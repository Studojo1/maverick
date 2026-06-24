import type { Route } from "./+types/generate";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { extractOpening } from "~/lib/internship-ai.server";
import { isAzureOpenAIConfigured } from "~/lib/azure-openai.server";

// POST /api/internships/generate
// Extract structured opening fields from a raw pasted job description.
// Does NOT create anything; the result is used to pre-fill the create form.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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

  if (!isAzureOpenAIConfigured()) {
    return Response.json(
      { error: "AI generation is not configured on this environment." },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 20) {
    return Response.json(
      { error: "Please paste a longer job description to generate from." },
      { status: 400 }
    );
  }

  try {
    const opening = await extractOpening(text);
    return Response.json({ success: true, opening });
  } catch (error: any) {
    console.error("[api/internships/generate] Error:", error);
    return Response.json(
      { error: error.message || "Failed to generate opening" },
      { status: 500 }
    );
  }
}
