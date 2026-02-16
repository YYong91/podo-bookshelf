import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Heart, CalendarDays } from "lucide-react";
import { getReviews } from "../api/reviews";
import type { Review } from "../types";

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [favorite, setFavorite] = useState<boolean | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const size = 20;

  const fetchReviews = async (p: number, q?: string, lang?: string, fav?: boolean, df?: string, dt?: string) => {
    setLoading(true);
    try {
      const data = await getReviews({ page: p, size, q: q || undefined, language: lang, favorite: fav, date_from: df || undefined, date_to: dt || undefined });
      setReviews(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, query, language, favorite, dateFrom, dateTo);
  }, [page, query, language, favorite, dateFrom, dateTo]);

  const handleSearch = () => {
    setPage(1);
    setQuery(searchInput);
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-grape-700">리뷰 목록</h1>

      {/* 검색 + 필터 */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="제목 또는 저자 검색..."
            className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-grape-600 px-3 text-white hover:bg-grape-700"
          >
            <Search size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          {[
            { value: undefined, label: "전체" },
            { value: "ko", label: "한글" },
            { value: "en", label: "영어" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => { setLanguage(opt.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                language === opt.value
                  ? "bg-grape-600 text-white"
                  : "bg-warm-100 text-warm-600 hover:bg-warm-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => { setFavorite(favorite ? undefined : true); setPage(1); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              favorite
                ? "bg-red-50 text-red-500"
                : "bg-warm-100 text-warm-600 hover:bg-warm-200"
            }`}
          >
            <Heart size={12} className={favorite ? "fill-red-400" : ""} />
            즐겨찾기
          </button>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              dateFrom || dateTo
                ? "bg-grape-100 text-grape-700"
                : "bg-warm-100 text-warm-600 hover:bg-warm-200"
            }`}
          >
            <CalendarDays size={12} />
            기간
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="rounded-full bg-warm-200 px-3 py-1 text-xs text-warm-600 hover:bg-warm-300"
            >
              기간 초기화
            </button>
          )}
          {query && (
            <button
              onClick={() => { setSearchInput(""); setQuery(""); setPage(1); }}
              className="rounded-full bg-warm-200 px-3 py-1 text-xs text-warm-600 hover:bg-warm-300"
            >
              "{query}" 초기화
            </button>
          )}
        </div>
        {showDateFilter && (
          <div className="flex items-center gap-2">
            <input
              type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              max={dateTo || new Date().toISOString().split("T")[0]}
              className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-xs focus:border-grape-400 focus:outline-none"
            />
            <span className="text-xs text-warm-400">~</span>
            <input
              type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              min={dateFrom} max={new Date().toISOString().split("T")[0]}
              className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-xs focus:border-grape-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-warm-500">불러오는 중...</div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center text-warm-500">
          <p className="text-4xl">📖</p>
          <p className="mt-2">{query ? "검색 결과가 없어요" : "아직 리뷰가 없어요"}</p>
          {!query && (
            <Link to="/write" className="mt-2 inline-block text-sm text-grape-500 underline">
              첫 리뷰 쓰러 가기
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-warm-400">총 {total}건</p>
          <div className="space-y-2">
            {reviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="flex gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {review.book.cover_url ? (
                  <img src={review.book.cover_url} alt="" className="h-20 w-14 rounded object-cover" />
                ) : (
                  <div className="flex h-20 w-14 items-center justify-center rounded bg-grape-100 text-xl">📕</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-warm-900">{review.book.title}</p>
                    {review.book.is_favorite && (
                      <Heart size={12} className="shrink-0 fill-red-400 text-red-400" />
                    )}
                    {review.book.language && (
                      <span className="shrink-0 rounded-full bg-warm-100 px-1.5 py-0.5 text-[10px] text-warm-500">
                        {review.book.language === "ko" ? "한" : "EN"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-500">{review.book.author} · {review.read_date}</p>
                  {review.memo && (
                    <p className="mt-1 line-clamp-2 text-sm text-warm-700">{review.memo}</p>
                  )}
                  {review.child_reaction && (
                    <p className="mt-1 truncate text-xs text-grape-500">👶 {review.child_reaction}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* 페이징 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-2 text-warm-500 hover:bg-warm-100 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-warm-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-2 text-warm-500 hover:bg-warm-100 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
