import {
  adminClient,
  jwtClient,
  lastLoginMethodClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Get the frontend URL for Better Auth (maverick uses same auth as main app)
const getAuthBaseURL = (): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Handle local development
    if (port === "3002" || window.location.port === "3002") {
      return `http://${host}:3000`; // Main frontend port
    }
    
    // Handle production subdomain: maverick.studojo.com -> studojo.com
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
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    lastLoginMethodClient(),
    jwtClient(),
    adminClient(),
    phoneNumberClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/2fa";
        }
      },
    }),
  ],
});

