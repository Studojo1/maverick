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
    sql`SELECT * FROM companies WHERE id = ${id} LIMIT 1`
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
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    },
  });
}

// PUT /api/companies/:id - Update company
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

  if (request.method !== "PUT") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { id } = params;
  const body = await request.json();
  const { name, email, phone, website } = body;

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
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, phone, website, created_at, updated_at
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
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    },
  });
}

