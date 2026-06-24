import type { Route } from "./+types/$id.applications";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { ensureResumeDownloadedColumn } from "~/lib/resume-download.server";

// GET /api/internships/:id/applications - List applications (admin only)
export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has ops or admin role
  const result = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = result.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const { id: internshipId } = params;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  // Make sure the download-tracking column exists so ia.* surfaces it.
  await ensureResumeDownloadedColumn();

  // LEFT JOINs: resume_id is nullable for direct PDF uploads (migration 0018),
  // and we want to surface applications even if the user row was later deleted.
  // resume_name prefers ia.resume_file_name (set on direct uploads, frontend
  // migration 0023) before falling back to r.name (Studojo-builder resume title).
  let query = sql`
    SELECT
      ia.*,
      u.name as user_name,
      u.email as user_email,
      u.phone_number as user_phone,
      COALESCE(ia.resume_file_name, r.name) as resume_name
    FROM public.internship_applications ia
    LEFT JOIN public."user" u ON ia.user_id = u.id
    LEFT JOIN public.resumes r ON ia.resume_id = r.id
    WHERE ia.internship_id = ${internshipId}
  `;

  if (status && status !== "all") {
    query = sql`${query} AND ia.status = ${status}`;
  }

  query = sql`${query} ORDER BY ia.created_at DESC`;

  const applications = await db.execute(query);

  // Fetch question responses for each application
  const applicationsWithResponses = await Promise.all(
    applications.rows.map(async (row: any) => {
      // Get question responses for this user and internship
      const responsesQuery = sql`
        SELECT 
          uqr.id,
          uqr.question_id,
          uqr.response,
          iq.question_text,
          iq.question_type,
          iq."order"
        FROM public.user_question_responses uqr
        JOIN public.internship_questions iq ON uqr.question_id = iq.id
        WHERE uqr.user_id = ${row.user_id}
          AND iq.internship_id = ${internshipId}
        ORDER BY iq."order" ASC
      `;
      
      const responses = await db.execute(responsesQuery);
      
      return {
        id: row.id,
        user_id: row.user_id,
        resume_id: row.resume_id,
        status: row.status,
        created_at: row.created_at,
        user_name: row.user_name,
        user_email: row.user_email,
        user_phone: row.user_phone,
        resume_name: row.resume_name,
        resume_downloaded_at: row.resume_downloaded_at ?? null,
        question_responses: responses.rows.map((resp: any) => ({
          question_id: resp.question_id,
          question_text: resp.question_text,
          question_type: resp.question_type,
          order: resp.order,
          response: resp.response,
        })),
      };
    })
  );

  return Response.json({
    applications: applicationsWithResponses,
  });
}

