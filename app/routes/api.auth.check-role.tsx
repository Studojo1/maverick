import type { Route } from "./+types/api.auth.check-role";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  // Extract JWT token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Decode JWT to get user ID (without verification for now - in production, verify via JWKS)
  // JWT format: header.payload.signature
  // We'll extract the payload to get the user ID
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return Response.json({ error: "Invalid token format" }, { status: 401 });
    }

    // Decode base64url payload
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );

    const userId = payload.sub || payload.userId;
    if (!userId) {
      return Response.json({ error: "Token missing user ID" }, { status: 401 });
    }

    // Get user role from database
    const result = await db.execute(
      sql`SELECT role FROM "user" WHERE id = ${userId} LIMIT 1`
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const role = result.rows[0].role as string | null;

    // Check if user has ops or admin role
    if (role !== "ops" && role !== "admin") {
      return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
    }

    return Response.json({ role });
  } catch (error) {
    console.error("Error checking role:", error);
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}

