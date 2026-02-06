import type { Route } from "./+types/$id.partner-users";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { hashPassword } from "~/lib/auth.server";

// GET /api/companies/:id/partner-users - List partner users for a company
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

  // Verify company exists and is not deleted
  const companyCheck = await db.execute(
    sql`SELECT id FROM companies WHERE id = ${id} AND is_deleted = false LIMIT 1`
  );

  if (companyCheck.rows.length === 0) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const users = await db.execute(
    sql`
      SELECT 
        id,
        company_id,
        email,
        name,
        role,
        created_at,
        updated_at
      FROM company_users
      WHERE company_id = ${id}
      ORDER BY created_at DESC
    `
  );

  return Response.json({
    users: users.rows.map((row: any) => ({
      id: row.id,
      companyId: row.company_id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

// POST /api/companies/:id/partner-users - Create partner user
// PUT /api/companies/:id/partner-users - Update partner user
// DELETE /api/companies/:id/partner-users - Delete partner user
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

  // Verify company exists and is not deleted
  const companyCheck = await db.execute(
    sql`SELECT id, primary_user_id FROM companies WHERE id = ${id} AND is_deleted = false LIMIT 1`
  );

  if (companyCheck.rows.length === 0) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const company = companyCheck.rows[0] as any;
  const method = request.method;

  if (method === "POST") {
    const body = await request.json();
    const { email, password, name, userRole } = body;

    if (!email || !password || !name) {
      return Response.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.execute(
      sql`SELECT id FROM company_users WHERE email = ${email.trim()} LIMIT 1`
    );

    if (existing.rows.length > 0) {
      return Response.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await db.execute(
      sql`
        INSERT INTO company_users (company_id, email, password_hash, name, role)
        VALUES (${id}, ${email.trim()}, ${passwordHash}, ${name.trim()}, ${userRole || "viewer"})
        RETURNING id, company_id, email, name, role, created_at, updated_at
      `
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "Failed to create partner user" }, { status: 500 });
    }

    const newUser = result.rows[0] as any;

    // If this is the first user for this company, set as primary
    if (!company.primary_user_id) {
      await db.execute(
        sql`UPDATE companies SET primary_user_id = ${newUser.id} WHERE id = ${id}`
      );
    }

    return Response.json({
      user: {
        id: newUser.id,
        companyId: newUser.company_id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      },
    });
  }

  if (method === "PUT") {
    const body = await request.json();
    const { userId, email, password, name, userRole, setAsPrimary } = body;

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists and belongs to this company
    const userCheck = await db.execute(
      sql`SELECT id FROM company_users WHERE id = ${userId} AND company_id = ${id} LIMIT 1`
    );

    if (userCheck.rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If email is being changed, check if new email already exists
    if (email) {
      const emailCheck = await db.execute(
        sql`SELECT id FROM company_users WHERE email = ${email.trim()} AND id != ${userId} LIMIT 1`
      );

      if (emailCheck.rows.length > 0) {
        return Response.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // Build update query using sql template
    let updateQuery = sql`UPDATE company_users SET `;
    const updates: any[] = [];

    if (email) {
      updates.push(sql`email = ${email.trim()}`);
    }
    if (password) {
      if (password.length < 8) {
        return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      const passwordHash = await hashPassword(password);
      updates.push(sql`password_hash = ${passwordHash}`);
    }
    if (name) {
      updates.push(sql`name = ${name.trim()}`);
    }
    if (userRole) {
      updates.push(sql`role = ${userRole}`);
    }
    updates.push(sql`updated_at = NOW()`);

    if (updates.length === 1) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updateQuery = sql`${updateQuery} ${sql.join(updates, sql`, `)} WHERE id = ${userId} AND company_id = ${id} RETURNING id, company_id, email, name, role, created_at, updated_at`;

    const result = await db.execute(updateQuery);

    if (result.rows.length === 0) {
      return Response.json({ error: "Failed to update partner user" }, { status: 500 });
    }

    const updatedUser = result.rows[0] as any;

    // Set as primary if requested
    if (setAsPrimary) {
      await db.execute(
        sql`UPDATE companies SET primary_user_id = ${userId} WHERE id = ${id}`
      );
    }

    return Response.json({
      user: {
        id: updatedUser.id,
        companyId: updatedUser.company_id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    });
  }

  if (method === "DELETE") {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists and belongs to this company
    const userCheck = await db.execute(
      sql`SELECT id FROM company_users WHERE id = ${userId} AND company_id = ${id} LIMIT 1`
    );

    if (userCheck.rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If this is the primary user, clear primary_user_id
    if (company.primary_user_id === userId) {
      await db.execute(
        sql`UPDATE companies SET primary_user_id = NULL WHERE id = ${id}`
      );
    }

    // Delete user
    await db.execute(
      sql`DELETE FROM company_users WHERE id = ${userId} AND company_id = ${id}`
    );

    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

