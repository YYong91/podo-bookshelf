import { useEffect, useState } from "react";
import api from "../api/client";

interface DetailStats {
  total: number;
  monthly: { month: string; count: number }[];
  language_ratio: Record<string, number>;
  top_authors: { author: string; count: number }[];
  most_read_books: { title: string; author: string; count: number }[];
  streak: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<DetailStats | null>(null);

  useEffect(() => {
    api.get<DetailStats>("/stats/detail").then((r) => setStats(r.data));
  }, []);

  if (!stats) return <div className="text-center text-warm-500">불러오는 중...</div>;

  const maxMonthly = Math.max(...stats.monthly.map((m) => m.count), 1);
  const thisYear = stats.monthly.reduce((s, m) => s + (m.month.startsWith(new Date().getFullYear().toString()) ? m.count : 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-grape-700">독서 통계</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-grape-700">{stats.total}</p>
          <p className="text-xs text-warm-500">총 독서</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-grape-700">{thisYear}</p>
          <p className="text-xs text-warm-500">올해</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-grape-700">{stats.streak}</p>
          <p className="text-xs text-warm-500">연속 일</p>
        </div>
      </div>

      {/* 월별 차트 */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-warm-700">월별 독서량</h2>
        <div className="flex items-end gap-1.5" style={{ height: 120 }}>
          {stats.monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-grape-600">{m.count || ""}</span>
              <div
                className="w-full rounded-t bg-grape-400 transition-all"
                style={{ height: `${Math.max((m.count / maxMonthly) * 100, m.count ? 8 : 2)}%` }}
              />
              <span className="text-[9px] text-warm-400">{m.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 언어 비율 */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-warm-700">언어 비율</h2>
        <div className="flex gap-2">
          {Object.entries(stats.language_ratio).map(([lang, count]) => {
            const pct = Math.round((count / stats.total) * 100);
            return (
              <div key={lang} className="flex items-center gap-2">
                <div
                  className="h-3 rounded-full bg-grape-400"
                  style={{ width: `${Math.max(pct * 2, 20)}px` }}
                />
                <span className="text-sm text-warm-700">
                  {lang === "ko" ? "한글" : lang === "en" ? "영어" : lang} {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 자주 읽은 작가 */}
      {stats.top_authors.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-warm-700">자주 읽은 작가</h2>
          <div className="space-y-2">
            {stats.top_authors.map((a, i) => (
              <div key={a.author} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-grape-500">{i + 1}</span>
                <span className="flex-1 text-sm text-warm-800">{a.author}</span>
                <span className="text-xs text-warm-500">{a.count}권</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가장 많이 읽은 책 */}
      {stats.most_read_books.filter((b) => b.count > 1).length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-warm-700">가장 많이 읽은 책</h2>
          <div className="space-y-2">
            {stats.most_read_books.filter((b) => b.count > 1).map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-grape-500">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-warm-800">{b.title}</p>
                  <p className="text-xs text-warm-500">{b.author}</p>
                </div>
                <span className="text-xs text-warm-500">{b.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
