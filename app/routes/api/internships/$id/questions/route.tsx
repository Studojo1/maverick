import type { Route } from "./+types/route";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// GET /api/internships/:id/questions - Get questions for an internship
export async function loader({ request, params }: Route.LoaderArgs) {
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

  const questions = await db.execute(
    sql`
      SELECT 
        id, internship_id, question_text, question_type, options, required, "order", tag_id,
        created_at, updated_at
      FROM public.internship_questions
      WHERE internship_id = ${id}
      ORDER BY "order" ASC, created_at ASC
    `
  );

  return Response.json({ questions: questions.rows });
}

// POST /api/internships/:id/questions - Add questions to an internship
export async function action({ request, params }: Route.ActionArgs) {
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

  // Verify internship exists
  const internshipCheck = await db.execute(
    sql`SELECT id FROM public.internships WHERE id = ${id} LIMIT 1`
  );

  if (internshipCheck.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return Response.json({ error: "Questions array is required" }, { status: 400 });
    }

    const insertedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.question_type) {
        continue;
      }

      const result = await db.execute(
        sql`
          INSERT INTO public.internship_questions (
            internship_id, question_text, question_type, options, required, "order", tag_id
          ) VALUES (
            ${id},
            ${q.question_text},
            ${q.question_type},
            ${q.options ? JSON.stringify(q.options) : null},
            ${q.required || false},
            ${q.order !== undefined ? q.order : i},
            ${q.tag_id || null}
          ) RETURNING *
        `
      );

      insertedQuestions.push(result.rows[0]);
    }

    return Response.json({ success: true, questions: insertedQuestions });
  }

  if (request.method === "PUT") {
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return Response.json({ error: "Questions array is required" }, { status: 400 });
    }

    // Delete existing questions
    await db.execute(
      sql`DELETE FROM public.internship_questions WHERE internship_id = ${id}`
    );

    // Insert new questions
    const insertedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.question_type) {
        continue;
      }

      const result = await db.execute(
        sql`
          INSERT INTO public.internship_questions (
            internship_id, question_text, question_type, options, required, "order", tag_id
          ) VALUES (
            ${id},
            ${q.question_text},
            ${q.question_type},
            ${q.options ? JSON.stringify(q.options) : null},
            ${q.required || false},
            ${q.order !== undefined ? q.order : i},
            ${q.tag_id || null}
          ) RETURNING *
        `
      );

      insertedQuestions.push(result.rows[0]);
    }

    return Response.json({ success: true, questions: insertedQuestions });
  }

  if (request.method === "DELETE") {
    await db.execute(
      sql`DELETE FROM public.internship_questions WHERE internship_id = ${id}`
    );

    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

