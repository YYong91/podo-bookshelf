import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("podo_token"));

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
    const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
    window.location.href = `${authUrl}/login`;
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
