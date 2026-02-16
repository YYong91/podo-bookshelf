import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import api from "../api/client";

function MonthlyChart({ data, max }: { data: { month: string; count: number }[]; max: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 600;
  const H = 200;
  const padL = 32;
  const padR = 16;
  const padT = 24;
  const padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Y축 눈금 (4단계)
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((max / 4) * i));
  if (yTicks[yTicks.length - 1] < max) yTicks[yTicks.length - 1] = max;

  const getX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const getY = (count: number) => padT + chartH - (count / (max || 1)) * chartH;

  // Line path
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.count)}`).join(" ");
  // Area path
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padT + chartH} L ${getX(0)} ${padT + chartH} Z`;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-warm-700">월별 독서량</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y축 가이드라인 */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL} y1={getY(tick)} x2={W - padR} y2={getY(tick)}
              stroke="#E7E5E4" strokeWidth="1" strokeDasharray={tick === 0 ? "0" : "4 3"}
            />
            <text x={padL - 6} y={getY(tick) + 3} textAnchor="end" fontSize="10" fill="#A8A29E">
              {tick}
            </text>
          </g>
        ))}

        {/* 영역 */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* 선 */}
        <path d={linePath} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* 데이터 포인트 + X축 라벨 */}
        {data.map((d, i) => (
          <g key={d.month} onMouseEnter={() => setHovered(i)}>
            {/* 히트 영역 (넓게) */}
            <rect
              x={getX(i) - chartW / data.length / 2}
              y={padT} width={chartW / data.length} height={chartH}
              fill="transparent"
            />
            {/* 세로 가이드 */}
            {hovered === i && (
              <line x1={getX(i)} y1={padT} x2={getX(i)} y2={padT + chartH} stroke="#C4B5FD" strokeWidth="1" strokeDasharray="3 3" />
            )}
            {/* 점 */}
            <circle
              cx={getX(i)} cy={getY(d.count)} r={hovered === i ? 5 : d.count > 0 ? 3.5 : 2}
              fill={hovered === i ? "#7C3AED" : d.count > 0 ? "#A78BFA" : "#D6D3D1"}
              stroke="white" strokeWidth="2"
            />
            {/* 툴팁 */}
            {hovered === i && d.count > 0 && (
              <>
                <rect
                  x={getX(i) - 22} y={getY(d.count) - 26} width="44" height="20"
                  rx="6" fill="#581C87"
                />
                <text
                  x={getX(i)} y={getY(d.count) - 12}
                  textAnchor="middle" fontSize="11" fontWeight="bold" fill="white"
                >
                  {d.count}권
                </text>
              </>
            )}
            {/* X축 라벨 */}
            <text
              x={getX(i)} y={H - 8}
              textAnchor="middle" fontSize="10"
              fill={hovered === i ? "#7C3AED" : "#A8A29E"}
              fontWeight={hovered === i ? "bold" : "normal"}
            >
              {d.month.slice(5)}월
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface DetailStats {
  total: number;
  monthly: { month: string; count: number }[];
  language_ratio: Record<string, number>;
  top_authors: { author: string; count: number }[];
  most_read_books: { id: string; title: string; author: string; count: number }[];
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
      <MonthlyChart data={stats.monthly} max={maxMonthly} />

      {/* 언어 비율 */}
      {Object.keys(stats.language_ratio).length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-warm-700">언어 비율</h2>
          {/* 누적 바 */}
          <div className="mb-3 flex h-6 overflow-hidden rounded-full">
            {Object.entries(stats.language_ratio).map(([lang, count], i) => {
              const pct = (count / stats.total) * 100;
              const colors = ["bg-grape-500", "bg-leaf-500", "bg-amber-400", "bg-sky-400"];
              return (
                <div
                  key={lang}
                  className={`${colors[i % colors.length]} flex items-center justify-center text-[10px] font-bold text-white`}
                  style={{ width: `${pct}%` }}
                >
                  {pct >= 15 && `${Math.round(pct)}%`}
                </div>
              );
            })}
          </div>
          {/* 범례 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(stats.language_ratio).map(([lang, count], i) => {
              const colors = ["bg-grape-500", "bg-leaf-500", "bg-amber-400", "bg-sky-400"];
              const labels: Record<string, string> = { ko: "한글", en: "영어" };
              return (
                <div key={lang} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
                  <span className="text-xs text-warm-700">
                    {labels[lang] || lang} {count}권
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 자주 읽은 작가 */}
      {stats.top_authors.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-warm-700">자주 읽은 작가</h2>
          <div className="space-y-1">
            {stats.top_authors.map((a, i) => (
              <Link
                key={a.author}
                to={`/reviews?q=${encodeURIComponent(a.author)}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-grape-50"
              >
                <span className="w-5 text-center text-xs font-bold text-grape-500">{i + 1}</span>
                <span className="flex-1 text-sm text-warm-800">{a.author}</span>
                <span className="text-xs text-warm-500">{a.count}권</span>
                <ChevronRight size={14} className="text-warm-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 가장 많이 읽은 책 */}
      {stats.most_read_books.filter((b) => b.count > 1).length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-warm-700">가장 많이 읽은 책</h2>
          <div className="space-y-1">
            {stats.most_read_books.filter((b) => b.count > 1).map((b, i) => (
              <Link
                key={b.id}
                to={`/books/${b.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-grape-50"
              >
                <span className="w-5 text-center text-xs font-bold text-grape-500">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-warm-800">{b.title}</p>
                  <p className="text-xs text-warm-500">{b.author}</p>
                </div>
                <span className="shrink-0 text-xs text-warm-500">{b.count}회</span>
                <ChevronRight size={14} className="shrink-0 text-warm-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
