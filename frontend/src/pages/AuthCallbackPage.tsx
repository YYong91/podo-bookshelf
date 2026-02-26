import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // iOS Safari ITP 우회: URL ?token= → localStorage 저장
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      try {
        localStorage.setItem("podo_access_token", urlToken);
      } catch {
        // private browsing 등 localStorage 접근 불가 시 무시
      }
      window.history.replaceState({}, "", window.location.pathname);
    }

    const intendedPath = sessionStorage.getItem("intended_path") || "/";
    sessionStorage.removeItem("intended_path");
    navigate(intendedPath, { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-grape-400">
      로그인 처리 중...
    </div>
  );
}
