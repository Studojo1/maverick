import type { Route } from "./+types/$id.download";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

// GET /api/internships/applications/:id/download - Download resume (admin only)
export async function loader({ params, request }: Route.LoaderArgs) {
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

  const { id: applicationId } = params;

  // Get application with resume snapshot
  const applicationResult = await db.execute(
    sql`
      SELECT 
        ia.resume_snapshot,
        ia.resume_id,
        r.name as resume_name,
        u.name as user_name
      FROM internship_applications ia
      JOIN resumes r ON ia.resume_id = r.id
      JOIN "user" u ON ia.user_id = u.id
      WHERE ia.id = ${applicationId}
      LIMIT 1
    `
  );

  if (applicationResult.rows.length === 0) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const app = applicationResult.rows[0] as any;
  const resumeSnapshot = app.resume_snapshot;
  const resumeName = app.resume_name || "resume";
  const userName = app.user_name || "student";

  // Return as JSON download
  const jsonContent = JSON.stringify(resumeSnapshot, null, 2);
  const filename = `${userName}-${resumeName}-${applicationId}.json`;

  return new Response(jsonContent, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

