import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { authClient } from "./auth-client";
import { getToken } from "./api";

export function useOpsGuard() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { data: session, isPending } = authClient.useSession();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    
    const checkAuth = async () => {
      if (isPending) return;

      if (!session?.user) {
        checkedRef.current = true;
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
        return;
      }

      // Check if user has ops or admin role
      try {
        const token = await getToken();
        if (!token) {
          checkedRef.current = true;
          navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
          return;
        }

        const response = await fetch("/api/auth/check-role", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.role === "ops" || data.role === "admin") {
            checkedRef.current = true;
            setIsAuthorized(true);
          } else {
            checkedRef.current = true;
            navigate("/login?error=not_ops", { replace: true });
          }
        } else {
          // User is not ops or admin
          checkedRef.current = true;
          navigate("/login?error=not_ops", { replace: true });
        }
      } catch (error) {
        console.error("Ops check failed:", error);
        checkedRef.current = true;
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname), { replace: true });
      }
    };

    checkAuth();
  }, [session, isPending, navigate]);

  return { isAuthorized, isPending };
}

