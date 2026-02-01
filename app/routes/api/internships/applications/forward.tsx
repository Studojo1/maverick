import type { Route } from "./+types/forward";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";

// POST /api/internships/applications/forward - Forward application(s) to company (admin only)
export async function action({ request }: Route.ActionArgs) {
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

  const body = await request.json();
  const { application_ids, internship_id, expires_at } = body;

  if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
    return Response.json({ error: "application_ids array is required" }, { status: 400 });
  }

  if (!internship_id) {
    return Response.json({ error: "internship_id is required" }, { status: 400 });
  }

  // Verify all applications belong to the same internship
  const applicationsCheck = await db.execute(
    sql`SELECT internship_id FROM internship_applications WHERE id = ANY(${application_ids})`
  );

  const uniqueInternshipIds = [...new Set(applicationsCheck.rows.map((r: any) => r.internship_id))];
  if (uniqueInternshipIds.length !== 1 || uniqueInternshipIds[0] !== internship_id) {
    return Response.json({ error: "All applications must belong to the same internship" }, { status: 400 });
  }

  // Generate secure token
  const token = randomBytes(32).toString("hex");

  // Create company token record
  const tokenResult = await db.execute(
    sql`
      INSERT INTO company_tokens (
        token, internship_id, application_ids, created_by, expires_at
      ) VALUES (
        ${token}, ${internship_id}, ${JSON.stringify(application_ids)}::jsonb, ${user.id},
        ${expires_at ? new Date(expires_at) : null}
      ) RETURNING *
    `
  );

  // Update applications to forwarded status
  await db.execute(
    sql`
      UPDATE internship_applications SET
        status = 'forwarded',
        company_token = ${token},
        forwarded_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY(${application_ids})
    `
  );

  const baseUrl = typeof process !== "undefined" && process.env.VITE_FRONTEND_URL
    ? process.env.VITE_FRONTEND_URL
    : "http://localhost:3000";

  const url = `${baseUrl}/company/internships/${internship_id}?token=${token}`;

  return Response.json({
    success: true,
    token,
    url,
    company_token: tokenResult.rows[0],
  });
}

