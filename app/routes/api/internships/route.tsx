import type { Route } from "./+types/route";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import slugify from "slugify";

// GET /api/internships - List all (admin only)
export async function loader({ request }: Route.LoaderArgs) {
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

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;
  
  if (status && status !== "all") {
    whereClause = sql`${whereClause} AND status = ${status}`;
  }

  if (search) {
    const searchPattern = `%${search}%`;
    whereClause = sql`${whereClause} AND (title ILIKE ${searchPattern} OR company_name ILIKE ${searchPattern})`;
  }

  const internships = await db.execute(
    sql`SELECT * FROM public.internships WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  );
  
  const countResult = await db.execute(
    sql`SELECT COUNT(*) as total FROM public.internships WHERE ${whereClause}`
  );

  const total = parseInt((countResult.rows[0] as any).total, 10);

  return Response.json({
    internships: internships.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/internships - Create internship (admin only)
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
  const { title, company_name, company_id, description, requirements, location, duration, stipend, application_deadline, status, questions } = body;

  if (!title || !company_name || !description || !requirements || !location || !duration || !stipend) {
    return Response.json({ error: "Title, company name, description, requirements, location, duration, and stipend are required" }, { status: 400 });
  }

  // Generate slug
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let originalSlug = slug;

  // Ensure uniqueness
  while (true) {
    const existing = await db.execute(
      sql`SELECT id FROM public.internships WHERE slug = ${slug} LIMIT 1`
    );
    if (existing.rows.length === 0) {
      break;
    }
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  // Insert internship
  const result = await db.execute(
    sql`
      INSERT INTO public.internships (
        title, company_name, company_id, description, requirements, location, duration, stipend,
        application_deadline, status, slug, created_by
      ) VALUES (
        ${title}, ${company_name}, ${company_id || null}, ${description}, ${requirements},
        ${location}, ${duration}, ${stipend},
        ${application_deadline ? new Date(application_deadline) : null},
        ${status || "draft"}, ${slug}, ${user.id}
      ) RETURNING *
    `
  );

  const internship = result.rows[0] as any;

  // Insert questions if provided
  if (questions && Array.isArray(questions) && questions.length > 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.question_text && q.question_type) {
        await db.execute(
          sql`
            INSERT INTO public.internship_questions (
              internship_id, question_text, question_type, options, required, "order", tag_id
            ) VALUES (
              ${internship.id},
              ${q.question_text},
              ${q.question_type},
              ${q.options ? JSON.stringify(q.options) : null},
              ${q.required || false},
              ${q.order !== undefined ? q.order : i},
              ${q.tag_id || null}
            )
          `
        );
      }
    }
  }

  return Response.json({ success: true, internship });
}

