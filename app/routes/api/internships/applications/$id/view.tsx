import type { Route } from "./+types/$id.view";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// GET /api/internships/applications/:id/view - Get resume data for viewing (admin only)
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

  // hasOriginalFile tells the viewer that the download endpoint will return the
  // candidate's actual uploaded file (preferred) rather than a snapshot re-render.
  // The viewer's existing flow already streams the download endpoint into an
  // iframe, so PDFs / images render natively without further client changes.
  return Response.json({
    resume: app.resume_snapshot,
    resumeName: app.resume_file_name || app.resume_name,
    userName: app.user_name,
    hasOriginalFile: Boolean(app.resume_file_url),
    originalContentType: app.resume_file_content_type ?? null,
  });
}

