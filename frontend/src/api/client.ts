import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("podo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("podo_token");
      const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
      const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
      window.location.href = `${authUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    }
    return Promise.reject(error);
  }
);

export default api;
