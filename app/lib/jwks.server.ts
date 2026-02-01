import { jwtVerify, createRemoteJWKSet } from "jose";

// JWKS URL from environment or default to frontend auth endpoint
const JWKS_URL =
  process.env.JWKS_URL || process.env.VITE_AUTH_URL
    ? `${process.env.VITE_AUTH_URL || "http://localhost:3000"}/api/auth/jwks`
    : "http://localhost:3000/api/auth/jwks";

// Create a remote JWKS set that will fetch and cache keys
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

/**
 * Verify JWT token using JWKS and return the user ID (subject)
 * @param token - The JWT token to verify
 * @returns The user ID (subject) from the token, or null if verification fails
 */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const jwksSet = getJWKS();
    const { payload } = await jwtVerify(token, jwksSet, {
      algorithms: ["RS256", "ES256", "EdDSA"], // Common algorithms used by Better Auth
    });

    // Extract user ID from subject claim
    const userId = payload.sub || (payload as any).userId;
    if (!userId || typeof userId !== "string") {
      return null;
    }

    return userId;
  } catch (error) {
    // Log error in development, but don't expose details in production
    if (process.env.NODE_ENV === "development") {
      console.error("JWT verification failed:", error);
    }
    return null;
  }
}

/**
 * Get user ID from a verified JWT token
 * This is a convenience wrapper around verifyToken
 */
export async function getUserIdFromVerifiedToken(
  token: string
): Promise<string | null> {
  return verifyToken(token);
}

