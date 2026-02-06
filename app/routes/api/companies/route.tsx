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
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  let query = sql`
    SELECT id, name, email, phone, website, created_at, updated_at
    FROM companies
  `;

  if (search) {
    query = sql`${query} WHERE name ILIKE ${`%${search}%`}`;
  }

  query = sql`${query} ORDER BY name ASC LIMIT 100`;

  const companies = await db.execute(query);

  return Response.json({
    companies: companies.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      website: row.website,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
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
  const { name, email, phone, website } = body;

  if (!name || !name.trim()) {
    return Response.json({ error: "Company name is required" }, { status: 400 });
  }

  // Check if company already exists
  const existing = await db.execute(
    sql`SELECT id FROM companies WHERE name = ${name.trim()} LIMIT 1`
  );

  if (existing.rows.length > 0) {
    return Response.json({
      company: {
        id: existing.rows[0].id,
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
      INSERT INTO companies (name, email, phone, website)
      VALUES (${name.trim()}, ${email?.trim() || null}, ${phone?.trim() || null}, ${website?.trim() || null})
      RETURNING id, name, email, phone, website, created_at, updated_at
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
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    },
  });
}

