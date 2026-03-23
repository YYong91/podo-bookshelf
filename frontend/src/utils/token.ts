/**
 * 토큰 접근 유틸리티 — cookie 우선, localStorage 폴백 (iOS Safari ITP 대응)
 * client.ts와 AuthContext에서 공유한다.
 */

export function getCookieToken(): string | null {
  const cookieMatch = document.cookie.match(/(?:^|; )podo_access_token=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];
  try {
    return localStorage.getItem("podo_access_token");
  } catch {
    return null;
  }
}

export function clearCookieToken(): void {
  const hostname = window.location?.hostname || "";
  const domain = hostname.endsWith("podonest.com") ? ".podonest.com" : "";
  const domainAttr = domain ? `Domain=${domain}; ` : "";
  const secure = window.location.protocol === "https:" ? "Secure; " : "";
  document.cookie = `podo_access_token=; ${domainAttr}${secure}SameSite=Lax; Path=/; Max-Age=0`;
  try {
    localStorage.removeItem("podo_access_token");
  } catch {
    /* localStorage 미지원 환경 무시 */
  }
}
