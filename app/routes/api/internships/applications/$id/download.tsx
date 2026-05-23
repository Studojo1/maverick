import type { Route } from "./+types/$id.download";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { downloadApplicationResume } from "~/lib/blob-storage.server";

// GET /api/internships/applications/:id/download - Download resume (admin only)
export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has ops or admin role
  const roleResult = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (roleResult.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = roleResult.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const { id: applicationId } = params;

  // LEFT JOINs: resume_id is nullable for direct PDF uploads (migration 0018).
  // Inner joins were silently 404'ing those applications.
  const applicationResult = await db.execute(
    sql`
      SELECT
        ia.resume_snapshot,
        ia.resume_id,
        ia.resume_file_url,
        ia.resume_file_content_type,
        ia.resume_file_name,
        r.name as resume_name,
        u.name as user_name
      FROM public.internship_applications ia
      LEFT JOIN public.resumes r ON ia.resume_id = r.id
      LEFT JOIN public."user" u ON ia.user_id = u.id
      WHERE ia.id = ${applicationId}
      LIMIT 1
    `
  );

  if (applicationResult.rows.length === 0) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const app = applicationResult.rows[0] as any;
  const resumeSnapshot = app.resume_snapshot;
  const resumeName = app.resume_file_name || app.resume_name || "resume";
  const userName = app.user_name || "student";

  // Direct-upload applicants (frontend migration 0023): stream the exact file
  // the candidate submitted, bypassing the snapshot renderer entirely. This is
  // what ops asked for — preview/download must show the original artifact, not
  // a re-render of whatever the parser was able to extract.
  if (app.resume_file_url) {
    const original = await downloadApplicationResume(app.resume_file_url as string);
    if (original) {
      const contentType =
        (app.resume_file_content_type as string | null) ||
        original.contentType ||
        "application/octet-stream";
      // Preserve original extension by sanitizing the user-supplied filename;
      // fall back to a sensible default so the browser still saves something.
      const safeName = resumeName.replace(/[^a-zA-Z0-9._-]/g, "_") || "resume";
      const filename = `${userName.replace(/[^a-zA-Z0-9.-]/g, "_")}-${safeName}`;

      return new Response(original.bytes, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
    // Fall through to snapshot rendering if blob fetch failed — keeps the
    // endpoint resilient when storage hiccups, rather than dead-ending the row.
    console.warn(
      `[applications/download] blob fetch failed for application ${applicationId}, falling back to snapshot render`,
    );
  }

  // Try to generate PDF using resume service
  const resumeServiceUrl = process.env.RESUME_SERVICE_URL || "http://resume-service:8086";
  
  try {
    // Add timeout to fetch (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const pdfResponse = await fetch(`${resumeServiceUrl}/make-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resumeSnapshot),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get("content-type");
      if (contentType?.includes("application/pdf")) {
        const pdfBytes = await pdfResponse.arrayBuffer();
        const filename = `${userName}-${resumeName}-${applicationId}.pdf`.replace(/[^a-zA-Z0-9.-]/g, "_");

        return new Response(pdfBytes, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } else {
        // Service returned non-PDF, log and fall back
        const errorText = await pdfResponse.text();
        console.error(`Resume service returned non-PDF content (${contentType}): ${errorText.substring(0, 200)}`);
      }
    } else {
      // If PDF generation fails, log and fall back to JSON
      const errorText = await pdfResponse.text();
      console.error(`Resume service returned ${pdfResponse.status}: ${errorText.substring(0, 200)}`);
    }
  } catch (error: any) {
    // If service is unavailable or times out, fall back to JSON
    if (error.name === "AbortError") {
      console.error("Resume service request timed out after 30 seconds");
    } else {
      console.error("Failed to generate PDF from resume service:", error.message || error);
    }
  }

  // Fallback: Return as JSON download if PDF generation fails
  const jsonContent = JSON.stringify(resumeSnapshot, null, 2);
  const filename = `${userName}-${resumeName}-${applicationId}.json`;

  return new Response(jsonContent, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

