import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 쿠키 기반 SSO: podo-auth가 .podonest.com 쿠키를 이미 설정함
    // URL ?token= 파라미터 방식 제거됨
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
