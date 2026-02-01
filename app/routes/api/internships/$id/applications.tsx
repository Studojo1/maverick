import type { Route } from "./+types/$id.applications";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

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

  let query = sql`
    SELECT 
      ia.*,
      u.name as user_name,
      u.email as user_email,
      r.name as resume_name
    FROM public.internship_applications ia
    JOIN public."user" u ON ia.user_id = u.id
    JOIN public.resumes r ON ia.resume_id = r.id
    WHERE ia.internship_id = ${internshipId}
  `;

  if (status && status !== "all") {
    query = sql`${query} AND ia.status = ${status}`;
  }

  query = sql`${query} ORDER BY ia.created_at DESC`;

  const applications = await db.execute(query);

  return Response.json({
    applications: applications.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      resume_id: row.resume_id,
      status: row.status,
      created_at: row.created_at,
      user_name: row.user_name,
      user_email: row.user_email,
      resume_name: row.resume_name,
    })),
  });
}

