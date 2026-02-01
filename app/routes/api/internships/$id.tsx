import type { Route } from "./+types/$id";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import slugify from "slugify";

// GET /api/internships/:id - Get internship (admin only)
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

  const { id } = params;

  const internshipResult = await db.execute(
    sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`
  );

  if (internshipResult.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }

  return Response.json({ internship: internshipResult.rows[0] });
}

// PUT /api/internships/:id - Update internship (admin only)
// DELETE /api/internships/:id - Delete internship (admin only)
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

  // Handle DELETE request
  if (request.method === "DELETE") {
    await db.execute(
      sql`DELETE FROM public.internships WHERE id = ${id}`
    );

    return Response.json({ success: true });
  }

  // Handle PUT request
  const body = await request.json();
  const { title, company_name, description, requirements, location, duration, stipend, application_deadline, status } = body;

  // Check if internship exists
  const existingResult = await db.execute(
    sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`
  );

  if (existingResult.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }

  const existing = existingResult.rows[0] as any;

  // Generate new slug if title changed
  let slug = existing.slug;
  if (title && title !== existing.title) {
    slug = slugify(title, { lower: true, strict: true });
    let counter = 1;
    let originalSlug = slug;

    // Ensure uniqueness
    while (true) {
      const slugCheck = await db.execute(
        sql`SELECT id FROM public.internships WHERE slug = ${slug} AND id != ${id} LIMIT 1`
      );
      if (slugCheck.rows.length === 0) {
        break;
      }
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }

  // Update internship
  const updateResult = await db.execute(
    sql`
      UPDATE public.internships SET
        title = COALESCE(${title || null}, title),
        company_name = COALESCE(${company_name || null}, company_name),
        description = COALESCE(${description || null}, description),
        requirements = COALESCE(${requirements || null}, requirements),
        location = COALESCE(${location || null}, location),
        duration = COALESCE(${duration || null}, duration),
        stipend = COALESCE(${stipend || null}, stipend),
        application_deadline = COALESCE(${application_deadline ? new Date(application_deadline) : null}, application_deadline),
        status = COALESCE(${status || null}, status),
        slug = ${slug},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  );

  return Response.json({ success: true, internship: updateResult.rows[0] });
}

