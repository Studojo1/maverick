import type { Route } from "./+types/route";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// Simple Levenshtein distance calculation for text similarity
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 1.0;
  
  return 1 - distance / maxLength;
}

// POST /api/questions/match - Match a question text against existing questions
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

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const { question_text } = body;

  if (!question_text || typeof question_text !== "string") {
    return Response.json({ error: "question_text is required" }, { status: 400 });
  }

  // Get all existing questions
  const allQuestions = await db.execute(
    sql`
      SELECT 
        id, internship_id, question_text, question_type, options, required, "order", tag_id,
        created_at, updated_at
      FROM public.internship_questions
      ORDER BY created_at DESC
    `
  );

  // Calculate similarity scores
  const matches = allQuestions.rows
    .map((q: any) => {
      const similarity = calculateSimilarity(question_text, q.question_text);
      return {
        ...q,
        similarity,
      };
    })
    .filter((m: any) => m.similarity >= 0.8) // 80% similarity threshold
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 10); // Top 10 matches

  return Response.json({
    matches,
    query: question_text,
  });
}

