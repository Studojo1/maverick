import type { Route } from "./+types/whatsapp";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import { generateWhatsAppMessage } from "~/lib/internship-ai.server";
import { isAzureOpenAIConfigured } from "~/lib/azure-openai.server";

// POST /api/internships/:id/whatsapp
// Generate a WhatsApp outreach message for a published opening, including the
// public studojo.com application link. Generated on demand; not persisted.
export async function action({ params, request }: Route.ActionArgs) {
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

  const { id } = params;
  const result = await db.execute(
    sql`SELECT * FROM public.internships WHERE id = ${id} LIMIT 1`
  );
  if (result.rows.length === 0) {
    return Response.json({ error: "Internship not found" }, { status: 404 });
  }

  const internship = result.rows[0] as any;
  const baseUrl = (process.env.SITE_URL || "https://studojo.com").replace(/\/$/, "");
  const applicationUrl = `${baseUrl}/internships/${internship.slug}`;

  try {
    const message = await generateWhatsAppMessage({
      title: internship.title,
      company_name: internship.company_name,
      description: internship.description,
      requirements: internship.requirements,
      location: internship.location,
      duration: internship.duration,
      stipend: internship.stipend,
      applicationUrl,
    });

    return Response.json({ success: true, message, applicationUrl });
  } catch (error: any) {
    console.error("[api/internships/:id/whatsapp] Error:", error);
    return Response.json(
      { error: error.message || "Failed to generate WhatsApp message" },
      { status: 500 }
    );
  }
}
