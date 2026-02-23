import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

function getCookieToken(): string | null {
  const match = document.cookie.match(/(?:^|; )podo_access_token=([^;]+)/);
  return match ? match[1] : null;
}

api.interceptors.request.use((config) => {
  const token = getCookieToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
      const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
      window.location.href = `${authUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    }
    return Promise.reject(error);
  }
);

export default api;
