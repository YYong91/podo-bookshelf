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

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("podo_token");
    if (!stored || isTokenExpired(stored)) {
      if (stored) localStorage.removeItem("podo_token");
      return null;
    }
    return stored;
  });

  const user = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("podo_token", token);
    } else {
      localStorage.removeItem("podo_token");
    }
  }, [token]);

  const logout = () => {
    setToken(null);
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
