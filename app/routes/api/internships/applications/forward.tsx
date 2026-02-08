import type { Route } from "./+types/forward";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function action({ request }: Route.ActionArgs) {
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
  // Escape UUIDs and build IN clause
  const escapedIds = application_ids.map((id: string) => `'${String(id).replace(/'/g, "''")}'`).join(", ");
  const applicationsCheck = await db.execute(
    sql.raw(`SELECT internship_id FROM public.internship_applications WHERE id IN (${escapedIds})`)
  );

  const uniqueInternshipIds = [...new Set(applicationsCheck.rows.map((r: any) => r.internship_id))];
  if (uniqueInternshipIds.length !== 1 || uniqueInternshipIds[0] !== internship_id) {
    return Response.json({ error: "All applications must belong to the same internship" }, { status: 400 });
  }

  // Get internship to find company_id
  const internshipResult = await db.execute(
    sql`SELECT company_id FROM public.internships WHERE id = ${internship_id} LIMIT 1`
  );

  if (internshipResult.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }

  const internship = internshipResult.rows[0] as any;
  const companyId = internship.company_id;

  // Generate token
  const token = randomBytes(32).toString("hex");

  // Create company token - properly handle JSONB casting with escaping
  const applicationIdsJson = JSON.stringify(application_ids);
  const applicationIdsValue = sql.raw(`'${applicationIdsJson.replace(/'/g, "''")}'::jsonb`);
  
  const tokenResult = await db.execute(
    sql`
      INSERT INTO public.company_tokens (
        token, internship_id, application_ids, created_by, expires_at
      ) VALUES (
        ${token}, ${internship_id}, ${applicationIdsValue}, ${user.id},
        ${expires_at ? new Date(expires_at) : null}
      ) RETURNING *
    `
  );

  // Update applications to forwarded status
  const escapedIdsForUpdate = application_ids.map((id: string) => `'${String(id).replace(/'/g, "''")}'`).join(", ");
  const escapedToken = token.replace(/'/g, "''");
  await db.execute(
    sql.raw(
      `UPDATE public.internship_applications SET
        status = 'forwarded',
        company_token = '${escapedToken}',
        forwarded_at = NOW(),
        updated_at = NOW()
      WHERE id IN (${escapedIdsForUpdate})`
    )
  );

  // Generate URLs - both old token-based and new partner panel
  // Use environment variable or infer from request origin
  let baseUrl = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL;
  if (!baseUrl && request) {
    try {
      const requestUrl = new URL(request.url);
      // Replace maverick subdomain with main domain
      baseUrl = requestUrl.origin.replace(/maverick\./, "");
    } catch {
      // Fallback to production URL
      baseUrl = "https://studojo.pro";
    }
  }
  if (!baseUrl) {
    baseUrl = "https://studojo.com";
  }
  const partnerPanelUrl = process.env.PARTNER_PANEL_URL || "https://partners.studojo.com";
  
  const tokenUrl = `${baseUrl}/company/internships/${internship_id}?token=${token}`;
  const partnerPanelLink = companyId 
    ? `${partnerPanelUrl}/applications?company=${companyId}`
    : null;

  return Response.json({
    success: true,
    token,
    url: tokenUrl, // Keep for backward compatibility
    partner_panel_url: partnerPanelLink,
    company_token: tokenResult.rows[0],
  });
}

