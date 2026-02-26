import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  logout: () => void;
}

function parseJwt(token: string): UserInfo | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: String(payload.sub),
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getCookieToken(): string | null {
  // 1. 쿠키 우선 (Chrome/Android 등)
  const cookieMatch = document.cookie.match(/(?:^|; )podo_access_token=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];
  // 2. localStorage 폴백 (iOS Safari ITP가 JS 쿠키를 삭제하는 경우)
  try {
    return localStorage.getItem("podo_access_token");
  } catch {
    return null;
  }
}

function clearCookieToken(): void {
  const hostname = window.location?.hostname || "";
  const domain = hostname.endsWith("podonest.com") ? ".podonest.com" : "";
  const domainAttr = domain ? `Domain=${domain}; ` : "";
  const secure = window.location.protocol === "https:" ? "Secure; " : "";
  document.cookie = `podo_access_token=; ${domainAttr}${secure}SameSite=Lax; Path=/; Max-Age=0`;
  try { localStorage.removeItem("podo_access_token"); } catch { /* localStorage 미지원 환경 무시 */ }
}

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = getCookieToken();
    if (!stored || isTokenExpired(stored)) {
      return null;
    }
    return stored;
  });

  const user = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const isAuthenticated = !!token;

  // 주기적으로 쿠키 만료 체크 (5분마다)
  useEffect(() => {
    const checkToken = () => {
      const current = getCookieToken();
      if (!current || isTokenExpired(current)) {
        setToken(null);
      } else if (current !== token) {
        setToken(current);
      }
    };
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const logout = () => {
    setToken(null);
    clearCookieToken();
    const authUrl = import.meta.env.VITE_AUTH_URL || "https://auth.podonest.com";
    window.location.href = `${authUrl}/logout`;
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
