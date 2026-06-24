import type { Route } from "./+types/download-zip";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { zipSync } from "fflate";
import {
  renderApplicationResume,
  ensureResumeDownloadedColumn,
} from "~/lib/resume-download.server";

// GET /api/internships/:id/applications/download-zip?scope=new|all
// Bundles applicant resumes into a single zip named "<company> - <role>.zip"
// and marks the included applications as downloaded. scope=new only includes
// applications that have not been downloaded yet.
export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleResult = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );
  if (roleResult.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  const role = roleResult.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json(
      { error: "Forbidden - Ops or Admin access required" },
      { status: 403 }
    );
  }

  const { id: internshipId } = params;
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "new" ? "new" : "all";

  const internshipResult = await db.execute(
    sql`SELECT title, company_name FROM public.internships WHERE id = ${internshipId} LIMIT 1`
  );
  if (internshipResult.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }
  const internship = internshipResult.rows[0] as any;

  const hasDownloadedColumn = await ensureResumeDownloadedColumn();

  // Only filter to not-yet-downloaded rows when we can actually track it.
  const onlyNew = scope === "new" && hasDownloadedColumn;
  const newFilter = onlyNew ? sql`AND ia.resume_downloaded_at IS NULL` : sql``;

  const applications = await db.execute(
    sql`
      SELECT
        ia.id,
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
      WHERE ia.internship_id = ${internshipId}
        ${newFilter}
      ORDER BY ia.created_at DESC
    `
  );

  const rows = applications.rows as any[];

  // Render every applicant that actually has a resume artifact.
  const files: Record<string, Uint8Array> = {};
  const usedNames = new Set<string>();
  const includedIds: string[] = [];

  for (const row of rows) {
    if (!row.resume_file_url && !row.resume_snapshot) continue;
    try {
      const rendered = await renderApplicationResume(row);
      const userName = row.user_name || "student";
      const resumeName = row.resume_file_name || row.resume_name || "resume";
      let base =
        `${userName}-${resumeName}`.replace(/[^a-zA-Z0-9._-]/g, "_") || "resume";
      if (!base.toLowerCase().endsWith(`.${rendered.ext}`)) {
        base = `${base}.${rendered.ext}`;
      }
      // Dedupe identical names within the zip.
      let name = base;
      let counter = 1;
      while (usedNames.has(name)) {
        const dot = base.lastIndexOf(".");
        name =
          dot > 0
            ? `${base.slice(0, dot)}-${counter}${base.slice(dot)}`
            : `${base}-${counter}`;
        counter++;
      }
      usedNames.add(name);
      files[name] = rendered.bytes;
      includedIds.push(row.id);
    } catch (e: any) {
      console.error(
        `[download-zip] failed to render application ${row.id}:`,
        e?.message || e
      );
    }
  }

  if (includedIds.length === 0) {
    return Response.json({
      count: 0,
      message:
        scope === "new"
          ? "No new resumes to download."
          : "No resumes to download.",
    });
  }

  // Build the zip (store-only: PDFs are already compressed).
  const zipped = zipSync(files, { level: 0 });

  // Mark the included applications as downloaded (best effort).
  if (hasDownloadedColumn) {
    try {
      const idList = sql.join(
        includedIds.map((id) => sql`${id}`),
        sql`, `
      );
      await db.execute(
        sql`UPDATE public.internship_applications SET resume_downloaded_at = NOW() WHERE id IN (${idList})`
      );
    } catch (e: any) {
      console.error("[download-zip] failed to mark downloaded:", e?.message || e);
    }
  }

  // Keep the "company - role" shape; strip only characters illegal in a
  // filename / Content-Disposition header (spaces and hyphens are fine).
  const zipName =
    `${internship.company_name || "company"} - ${internship.title || "role"}`
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "resumes";

  // Copy into a fresh ArrayBuffer-backed view so the body is a clean BodyInit.
  const body = zipped.slice();

  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}.zip"`,
      "X-Resume-Count": String(includedIds.length),
    },
  });
}
