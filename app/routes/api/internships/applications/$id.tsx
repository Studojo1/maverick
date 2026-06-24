import type { Route } from "./+types/$id";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { sendRejectionEmail } from "~/lib/email.server";

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

  const validStatuses = ["pending", "shortlisted", "rejected", "accepted", "interview_scheduled", "more_info_requested"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  // Snapshot prev status + candidate/internship info BEFORE the update so we can
  // detect a non-rejected -> rejected transition and email the candidate exactly once.
  const beforeResult = await db.execute(
    sql`
      SELECT
        ia.status AS prev_status,
        u.name AS user_name,
        u.email AS user_email,
        i.title AS internship_title,
        i.company_name AS company_name
      FROM public.internship_applications ia
      LEFT JOIN public."user" u ON u.id = ia.user_id
      LEFT JOIN public.internships i ON i.id = ia.internship_id
      WHERE ia.id = ${id}
      LIMIT 1
    `
  );

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

  if (status === "rejected" && beforeResult.rows.length > 0) {
    const before = beforeResult.rows[0] as {
      prev_status: string | null;
      user_name: string | null;
      user_email: string | null;
      internship_title: string | null;
      company_name: string | null;
    };

    if (before.prev_status !== "rejected" && before.user_email) {
      try {
        await sendRejectionEmail({
          to: before.user_email,
          name: before.user_name || "there",
          role: before.internship_title || "the role",
          company: before.company_name || "the company",
        });
      } catch (err) {
        console.error("[rejection-email] send failed for application", id, err);
      }
    }
  }

  return Response.json({ success: true, application: updateResult.rows[0] });
}
