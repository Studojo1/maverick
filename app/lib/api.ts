import { authClient } from "./auth-client";

/**
 * Get the frontend URL for Better Auth
 */
function getFrontendUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Handle local development
    if (port === "3002" || window.location.port === "3002") {
      return `http://${host}:3000`;
    }
    
    // Handle production subdomain: maverick.studojo.pro -> studojo.pro
    if (host.startsWith("maverick.")) {
      const baseHost = host.replace(/^maverick\./, "");
      return `${protocol}//${baseHost}`;
    }
    
    // Fallback: try to replace port if present
    if (window.location.origin.includes(":3002")) {
      return window.location.origin.replace(":3002", ":3000");
    }
    
    // For same-domain deployments, use the same origin
    return window.location.origin;
  }
  return process.env.VITE_AUTH_URL || "http://localhost:3000";
}

/**
 * Get authentication token, trying multiple methods:
 * 1. Try to get token from Better Auth client (if cookies are shared)
 * 2. Try to fetch token from frontend's share-token endpoint (OAuth-like)
 */
export async function getToken(): Promise<string | null> {
  // First, try to get token directly from Better Auth
  const { data, error } = await authClient.token();
  if (!error && data?.token) {
    return data.token;
  }

  // If that fails, try to get token from frontend via share-token endpoint
  try {
    const frontendUrl = getFrontendUrl();
    
    const response = await fetch(`${frontendUrl}/api/auth/share-token`, {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        // Store token in sessionStorage for future use
        if (typeof window !== "undefined") {
          sessionStorage.setItem("maverick_token", data.token);
        }
        return data.token;
      }
    } else {
      // If request failed, check if we have a stored token
      if (typeof window !== "undefined") {
        const storedToken = sessionStorage.getItem("maverick_token");
        if (storedToken) {
          return storedToken;
        }
      }
    }
  } catch (error) {
    console.debug("Failed to get token from frontend:", error);
    // Fallback to stored token
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("maverick_token");
      if (storedToken) {
        return storedToken;
      }
    }
  }

  return null;
}

/**
 * Check if user has ops or admin role
 */
export async function checkOpsAccess(): Promise<boolean> {
  const { data: session } = authClient.useSession();
  if (!session?.user) return false;
  
  try {
    const token = await getToken();
    if (!token) return false;
    
    // Check role by calling the database directly or via control plane
    // For now, we'll check via a direct database query in the API route
    const response = await fetch("/api/auth/check-role", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

