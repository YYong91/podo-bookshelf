import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("podo_token", token);
    }
    const intendedPath = sessionStorage.getItem("intended_path") || "/";
    sessionStorage.removeItem("intended_path");
    navigate(intendedPath, { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-grape-400">
      로그인 처리 중...
    </div>
  );
}
