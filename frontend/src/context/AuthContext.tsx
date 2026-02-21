import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("podo_token"));
  const [user, setUser] = useState<UserInfo | null>(() => {
    const t = localStorage.getItem("podo_token");
    return t ? parseJwt(t) : null;
  });

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("podo_token", token);
      setUser(parseJwt(token));
    } else {
      localStorage.removeItem("podo_token");
      setUser(null);
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
    window.location.href = `${authUrl}/login`;
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
