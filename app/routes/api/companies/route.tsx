import type { Route } from "./+types/route";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// GET /api/companies - List companies
export async function loader({ request }: Route.LoaderArgs) {
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

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  // Some legacy data may contain multiple rows per company name.
  // Use DISTINCT ON (name) to surface a single canonical row per company.
  // Filter deleted companies first, then deduplicate by name.
  // DISTINCT ON requires ORDER BY to start with the DISTINCT ON columns.
  let baseQuery = search
    ? sql`FROM companies WHERE is_deleted = false AND name ILIKE ${`%${search}%`}`
    : sql`FROM companies WHERE is_deleted = false`;

  let query = sql`
    SELECT DISTINCT ON (name)
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
    ${baseQuery}
    ORDER BY name, created_at DESC
    LIMIT 100
  `;

  try {
    const companies = await db.execute(query);

    return Response.json({
      companies: companies.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        website: row.website,
        logoUrl: row.logo_url,
        brandColor: row.brand_color,
        supportEmail: row.support_email,
        portalTitle: row.portal_title,
        isDeleted: row.is_deleted,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error: any) {
    // If the companies table doesn't exist yet in this environment, return an empty list
    const code = error?.cause?.code || error?.code;
    const message: string =
      error?.message || error?.cause?.message || "";

    if (code === "42P01" || message.includes('relation "companies" does not exist')) {
      console.warn("[maverick] companies table missing, returning empty list");
      return Response.json({ companies: [] }, { status: 200 });
    }

    console.error("[maverick] Failed to load companies:", error);
    return Response.json({ error: "Failed to load companies" }, { status: 500 });
  }
}

// POST /api/companies - Create company
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

  if (request.method !== "POST") {
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

  try {
    // Check if company already exists (by name, not deleted)
    const existing = await db.execute(
      sql`SELECT id FROM companies WHERE name = ${name.trim()} AND is_deleted = false LIMIT 1`
    );

    if (existing.rows.length > 0) {
      const existingCompany = existing.rows[0] as any;
      return Response.json({
        company: {
          id: existingCompany.id,
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          website: website?.trim() || null,
        },
      });
    }

    // Create new company
    const result = await db.execute(
      sql`
        INSERT INTO companies (
          name,
          email,
          phone,
          website,
          logo_url,
          brand_color,
          support_email,
          portal_title
        )
        VALUES (
          ${name.trim()},
          ${email?.trim() || null},
          ${phone?.trim() || null},
          ${website?.trim() || null},
          ${logoUrl || null},
          ${brandColor || null},
          ${supportEmail || null},
          ${portalTitle || null}
        )
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
      return Response.json({ error: "Failed to create company" }, { status: 500 });
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
  } catch (error: any) {
    const code = error?.cause?.code || error?.code;
    const message: string =
      error?.message || error?.cause?.message || "";

    if (code === "42P01" || message.includes('relation "companies" does not exist')) {
      console.error(
        "[maverick] Cannot create company: companies table missing. Run migrations for Maverick ops schema."
      );
      return Response.json(
        { error: "Companies table is not initialized in this environment. Please run migrations." },
        { status: 500 }
      );
    }

    console.error("[maverick] Failed to create company:", error);
    return Response.json({ error: "Failed to create company" }, { status: 500 });
  }
}

