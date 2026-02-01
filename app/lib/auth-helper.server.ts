import db from "./db.server";
import { sql } from "drizzle-orm";
import { verifyToken } from "./jwks.server";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Verify JWT token and get user ID (replaces unsafe decode)
 * @deprecated Use verifyToken from jwks.server.ts directly
 */
export async function getUserIdFromToken(
  token: string
): Promise<string | null> {
  return verifyToken(token);
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
 * Get user info from Authorization header with verified JWT token
 */
export async function getUserFromRequest(request: Request): Promise<UserInfo | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  return getUserInfo(userId);
}

