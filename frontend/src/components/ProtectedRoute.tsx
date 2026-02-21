import { useEffect, type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
const CALLBACK_URL = import.meta.env.VITE_AUTH_CALLBACK_URL || "http://localhost:5173/auth/callback";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      const redirectUri = encodeURIComponent(CALLBACK_URL);
      window.location.href = `${AUTH_URL}/login?redirect_uri=${redirectUri}`;
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
