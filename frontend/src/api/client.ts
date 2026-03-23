import axios from "axios";

import { getCookieToken } from "../utils/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = getCookieToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_RETRY_KEY = "auth_retry";
const MAX_AUTH_RETRIES = 2;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const retryCount = parseInt(sessionStorage.getItem(AUTH_RETRY_KEY) || "0");
      if (retryCount >= MAX_AUTH_RETRIES) {
        sessionStorage.removeItem(AUTH_RETRY_KEY);
        window.location.href = "/auth-error";
        return Promise.reject(error);
      }
      sessionStorage.setItem(AUTH_RETRY_KEY, String(retryCount + 1));

      const authUrl = import.meta.env.VITE_AUTH_URL || "https://auth.podonest.com";
      const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
      window.location.href = `${authUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    }
    return Promise.reject(error);
  },
);

export default api;
