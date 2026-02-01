import type { Route } from "./+types/$id";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// PATCH /api/internships/applications/:id - Update application status (admin only)
export async function action({ params, request }: Route.ActionArgs) {
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

  const { id } = params;
  const body = await request.json();
  const { status, admin_notes } = body;

  if (!status) {
    return Response.json({ error: "Status is required" }, { status: 400 });
  }

  const validStatuses = ["pending", "shortlisted", "rejected", "forwarded", "accepted", "interview_scheduled", "more_info_requested"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateResult = await db.execute(
    sql`
      UPDATE public.internship_applications SET
        status = ${status},
        admin_notes = COALESCE(${admin_notes || null}, admin_notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  );

  if (updateResult.rows.length === 0) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  return Response.json({ success: true, application: updateResult.rows[0] });
}

