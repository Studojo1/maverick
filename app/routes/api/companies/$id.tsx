import type { Route } from "./+types/$id";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// GET /api/companies/:id - Get company
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
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const { id } = params;

  const result = await db.execute(
    sql`SELECT * FROM companies WHERE id = ${id} AND is_deleted = false LIMIT 1`
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const company = result.rows[0] as any;

  return Response.json({
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      website: company.website,
      logoUrl: company.logo_url,
      brandColor: company.brand_color,
      supportEmail: company.support_email,
      portalTitle: company.portal_title,
      isDeleted: company.is_deleted,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    },
  });
}

// PUT /api/companies/:id - Update company
// DELETE /api/companies/:id - Soft delete (archive) company
export async function action({ params, request }: Route.ActionArgs) {
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

  const { id } = params;

  if (request.method === "DELETE") {
    const result = await db.execute(
      sql`
        UPDATE companies
        SET is_deleted = true, deleted_at = NOW()
        WHERE id = ${id} AND is_deleted = false
        RETURNING id
      `
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "Company not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  }

  if (request.method !== "PUT") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const {
    name,
    email,
    phone,
    website,
    logoUrl,
    brandColor,
    supportEmail,
    portalTitle,
  } = body;

  if (!name || !name.trim()) {
    return Response.json({ error: "Company name is required" }, { status: 400 });
  }

  const result = await db.execute(
    sql`
      UPDATE companies SET
        name = ${name.trim()},
        email = ${email?.trim() || null},
        phone = ${phone?.trim() || null},
        website = ${website?.trim() || null},
        logo_url = ${logoUrl || null},
        brand_color = ${brandColor || null},
        support_email = ${supportEmail || null},
        portal_title = ${portalTitle || null},
        updated_at = NOW()
      WHERE id = ${id} AND is_deleted = false
      RETURNING
        id,
        name,
        email,
        phone,
        website,
        logo_url,
        brand_color,
        support_email,
        portal_title,
        is_deleted,
        created_at,
        updated_at
    `
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const company = result.rows[0] as any;

  return Response.json({
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      website: company.website,
      logoUrl: company.logo_url,
      brandColor: company.brand_color,
      supportEmail: company.support_email,
      portalTitle: company.portal_title,
      isDeleted: company.is_deleted,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    },
  });
}

