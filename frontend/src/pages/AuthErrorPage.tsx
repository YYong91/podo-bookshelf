import { clearCookieToken } from "../utils/token";

export default function AuthErrorPage() {
  const handleRetry = () => {
    clearCookieToken();
    sessionStorage.removeItem("auth_retry");
    const authUrl = import.meta.env.VITE_AUTH_URL || "https://auth.podonest.com";
    const callbackUrl =
      import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
    window.location.href = `${authUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold text-grape-600">로그인에 문제가 발생했어요</p>
      <p className="text-sm text-warm-500">
        반복적으로 인증에 실패했습니다. 다시 시도해 주세요.
      </p>
      <button
        onClick={handleRetry}
        className="rounded-lg bg-grape-500 px-6 py-2 text-white hover:bg-grape-600"
      >
        다시 로그인
      </button>
    </div>
  );
}
