import db from "./db.server";
import { sql } from "drizzle-orm";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Decode JWT token to get user ID
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );

    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * Get user info from database by user ID
 */
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    const result = await db.execute(
      sql`SELECT id, name, email FROM "user" WHERE id = ${userId} LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

/**
 * Get user info from Authorization header
 */
export async function getUserFromRequest(request: Request): Promise<UserInfo | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  return getUserInfo(userId);
}

