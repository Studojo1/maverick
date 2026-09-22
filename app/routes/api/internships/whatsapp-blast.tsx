import type { Route } from "./+types/whatsapp-blast";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import {
  buildBlastMessage,
  generateOpeningHooks,
  type BlastOpening,
} from "~/lib/internship-ai.server";
import { isAzureOpenAIConfigured } from "~/lib/azure-openai.server";
import { ensurePipelineStatusColumn } from "~/lib/internship-status.server";

// POST /api/internships/whatsapp-blast
// Draft one WhatsApp message covering every internship that is still open:
// publicly published, and not marked Closed in the internal pipeline tracker
// (the red rows in the Maverick table). Generated on demand; not persisted.
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
    return Response.json(
      { error: "Forbidden - Ops or Admin access required" },
      { status: 403 }
    );
  }

  // If the pipeline column is unavailable we cannot tell closed rows apart, so
  // fall back to public status alone rather than failing the whole request.
  const hasPipelineColumn = await ensurePipelineStatusColumn();

  let whereClause = sql`created_by IS DISTINCT FROM 'scraper-system' AND status = 'published'`;
  if (hasPipelineColumn) {
    whereClause = sql`${whereClause} AND COALESCE(pipeline_status, 'published') <> 'closed'`;
  }

  const result = await db.execute(
    sql`SELECT id, title, company_name, slug, description, requirements, location, stipend
        FROM public.internships
        WHERE ${whereClause}
        ORDER BY created_at DESC`
  );

  if (result.rows.length === 0) {
    return Response.json(
      { error: "No active internships to share right now." },
      { status: 404 }
    );
  }

  const baseUrl = (process.env.SITE_URL || "https://studojo.com").replace(
    /\/$/,
    ""
  );

  const openings: BlastOpening[] = result.rows.map((row: any) => ({
    id: String(row.id),
    title: row.title,
    company_name: row.company_name,
    description: row.description,
    requirements: row.requirements,
    location: row.location,
    stipend: row.stipend,
    applicationUrl: `${baseUrl}/internships/${row.slug}`,
  }));

  // Hooks are a nice-to-have: without AI the blast still lists every opening.
  const aiConfigured = isAzureOpenAIConfigured();
  const hooks = aiConfigured ? await generateOpeningHooks(openings) : {};
  const missingHooks = openings.filter((o) => !hooks[o.id]).length;

  return Response.json({
    success: true,
    message: buildBlastMessage(openings, hooks),
    count: openings.length,
    internships: openings.map((o) => ({
      id: o.id,
      title: o.title,
      company_name: o.company_name,
      url: o.applicationUrl,
    })),
    warning: !aiConfigured
      ? "AI is not configured on this environment, so the message lists the openings without the one line hooks."
      : missingHooks > 0
        ? `Could not write a hook line for ${missingHooks} of ${openings.length} openings.`
        : undefined,
    pipelineFilterApplied: hasPipelineColumn,
  });
}
