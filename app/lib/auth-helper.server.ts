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
 * Also supports getting token from cookies via frontend share-token endpoint
 */
export async function getUserFromRequest(request: Request): Promise<UserInfo | null> {
  // First, try Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const userId = await getUserIdFromToken(token);
    if (userId) {
      return getUserInfo(userId);
    }
  }

  // If no Authorization header, try to get token from cookies via frontend
  const frontendUrl = process.env.VITE_AUTH_URL || "https://studojo.pro";
  const cookies = request.headers.get("Cookie");
  
  if (cookies) {
    try {
      // Forward all cookies to frontend
      const response = await fetch(`${frontendUrl}/api/auth/share-token`, {
        method: "GET",
        headers: {
          "Cookie": cookies,
          "Content-Type": "application/json",
          "User-Agent": request.headers.get("User-Agent") || "Maverick/1.0",
        },
        // Important: don't follow redirects
        redirect: "manual",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          const userId = await getUserIdFromToken(data.token);
          if (userId) {
            return getUserInfo(userId);
          }
        }
      } else {
        // Log the error for debugging
        if (process.env.NODE_ENV === "development") {
          console.debug(`Failed to get token from frontend: ${response.status} ${response.statusText}`);
          const text = await response.text().catch(() => "");
          console.debug("Response:", text.substring(0, 200));
        }
      }
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to get token from frontend:", error);
      }
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.debug("No cookies found in request");
    }
  }

  return null;
}

