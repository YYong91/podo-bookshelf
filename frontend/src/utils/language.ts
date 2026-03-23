// 언어 코드 → 표시 라벨 매핑
const LANGUAGE_LABELS: Record<string, string> = {
  ko: "한글",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export function getLanguageLabel(code: string | null): string {
  return code ? (LANGUAGE_LABELS[code] || code.toUpperCase()) : "";
}
