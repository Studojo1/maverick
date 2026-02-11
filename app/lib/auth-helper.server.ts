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
  const frontendUrl = process.env.VITE_AUTH_URL || "https://studojo.com";
  const cookies = request.headers.get("Cookie");
  
  // Also check for Better Auth session cookie directly
  // Better Auth uses cookies like "better-auth.session_token" or similar
  if (cookies) {
    // Try to extract session token from cookies and verify it directly
    const cookieMatch = cookies.match(/(?:^|;\s*)(?:better-auth\.session_token|session_token|better-auth\.session)=([^;]+)/i);
    if (cookieMatch) {
      // If we have a session cookie, we could try to verify it, but Better Auth
      // doesn't expose a direct API for this. So we'll still use the share-token endpoint.
    }
    
    try {
      // Forward all cookies to frontend, including Origin header for CORS
      // Use the maverick origin so the share-token endpoint recognizes it as a valid admin panel request
      const maverickUrl = process.env.VITE_MAVERICK_URL || "https://maverick.studojo.com";
      const origin = request.headers.get("Origin") || maverickUrl;
      const referer = request.headers.get("Referer") || maverickUrl;
      
      const response = await fetch(`${frontendUrl}/api/auth/share-token`, {
        method: "GET",
        headers: {
          "Cookie": cookies,
          "Content-Type": "application/json",
          "User-Agent": request.headers.get("User-Agent") || "Maverick/1.0",
          "Origin": origin,
          "Referer": referer,
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
        // Log the error for debugging (always log in production too for now)
        console.debug(`[auth-helper] Failed to get token from frontend: ${response.status} ${response.statusText}`);
        try {
          const text = await response.text();
          console.debug(`[auth-helper] Response: ${text.substring(0, 200)}`);
        } catch (e) {
          // Ignore
        }
      }
    } catch (error) {
      // Log error for debugging
      console.debug(`[auth-helper] Failed to get token from frontend:`, error);
    }
  } else {
    console.debug("[auth-helper] No cookies found in request");
  }

  return null;
}

