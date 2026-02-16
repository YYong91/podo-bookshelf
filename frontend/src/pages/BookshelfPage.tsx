import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { getBooks, createBook } from "../api/books";
import { searchBooks, searchBookByIsbn } from "../api/search";
import BarcodeScanner from "../components/BarcodeScanner";
import type { Book, BookSearchResult } from "../types";

const SORT_OPTIONS = [
  { value: "recent", label: "최근 읽은 순" },
  { value: "newest", label: "등록순" },
  { value: "title", label: "제목순" },
  { value: "most_read", label: "많이 읽은 순" },
] as const;

const PAGE_SIZE = 30;

export default function BookshelfPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [offset, setOffset] = useState(0);

  // 새 책 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<BookSearchResult[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const addSearchRef = useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = async (isbn: string) => {
    setScannerOpen(false);
    try {
      const result = await searchBookByIsbn(isbn);
      if (result.source === "local") {
        toast("이미 책장에 있는 책이에요!", { icon: "📚" });
      } else {
        await handleAddBook(result.book as BookSearchResult);
      }
    } catch {
      toast.error("이 바코드의 책 정보를 찾지 못했어요");
    }
  };

  const fetchBooks = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const newOffset = reset ? 0 : offset;
        const { items, total: t } = await getBooks({
          q: query || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: newOffset,
        });
        if (reset) {
          setBooks(items);
          setOffset(items.length);
        } else {
          setBooks((prev) => [...prev, ...items]);
          setOffset(newOffset + items.length);
        }
        setTotal(t);
      } catch {
        toast.error("책 목록을 불러오지 못했어요");
      } finally {
        setLoading(false);
      }
    },
    [query, sort, offset],
  );

  // 초기 로드 + sort/query 변경 시 리셋
  useEffect(() => {
    setOffset(0);
    const load = async () => {
      setLoading(true);
      try {
        const { items, total: t } = await getBooks({
          q: query || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: 0,
        });
        setBooks(items);
        setOffset(items.length);
        setTotal(t);
      } catch {
        toast.error("책 목록을 불러오지 못했어요");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sort, query]);

  // 페이지 진입 시 검색바 포커스
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // 모달 열릴 때 검색바 포커스
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => addSearchRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  const handleAddSearch = async () => {
    if (!addQuery.trim()) return;
    setAddSearching(true);
    try {
      const results = await searchBooks(addQuery);
      setAddResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setAddSearching(false);
    }
  };

  const handleAddBook = async (result: BookSearchResult) => {
    try {
      await createBook({
        title: result.title,
        author: result.author,
        publisher: result.publisher,
        isbn: result.isbn,
        cover_url: result.cover_url || null,
        language: result.language || "ko",
      });
      toast.success(`"${result.title}" 책장에 추가!`);
      setShowAddModal(false);
      setAddQuery("");
      setAddResults([]);
      // 목록 새로고침
      const { items, total: t } = await getBooks({
        q: query || undefined,
        sort,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setBooks(items);
      setOffset(items.length);
      setTotal(t);
    } catch {
      toast.error("추가에 실패했어요");
    }
  };

  const hasMore = offset < total;

  return (
    <div className="space-y-4">
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setScannerOpen(false)}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-grape-700">책장</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 rounded-lg bg-grape-600 px-3 py-2 text-sm font-medium text-white hover:bg-grape-700"
        >
          <Plus size={16} />
          새 책 추가
        </button>
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목이나 저자로 찾기..."
            className="w-full rounded-lg border border-warm-200 py-2.5 pl-9 pr-8 text-sm focus:border-grape-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-warm-200 px-3 py-2.5 text-sm text-warm-700 focus:border-grape-400 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 총 권수 */}
      {!loading && (
        <p className="text-sm text-warm-500">
          총 <span className="font-medium text-grape-600">{total}</span>권
        </p>
      )}

      {/* 책 그리드 */}
      {books.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => navigate(`/write?book_id=${book.id}`)}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-grape-50"
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="aspect-[3/4] w-full rounded-lg object-cover shadow-sm transition-transform group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-grape-100 text-3xl shadow-sm">
                  📕
                </div>
              )}
              <p className="line-clamp-2 text-center text-xs font-medium text-warm-800">
                {book.title}
              </p>
              {book.review_count > 0 && (
                <span className="rounded-full bg-grape-100 px-1.5 py-0.5 text-[10px] text-grape-600">
                  {book.review_count}회
                </span>
              )}
            </button>
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-warm-400">
          <span className="text-4xl">📚</span>
          <p className="text-sm">
            {query ? "검색 결과가 없어요" : "아직 책이 없어요"}
          </p>
          {!query && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-grape-100 px-4 py-2 text-sm font-medium text-grape-700 hover:bg-grape-200"
            >
              첫 번째 책 추가하기
            </button>
          )}
        </div>
      ) : null}

      {/* 더 보기 */}
      {hasMore && !loading && (
        <button
          onClick={() => fetchBooks()}
          className="w-full rounded-lg border border-warm-200 py-3 text-sm font-medium text-warm-600 hover:bg-warm-50"
        >
          더 보기
        </button>
      )}

      {loading && (
        <p className="py-8 text-center text-sm text-warm-400">불러오는 중...</p>
      )}

      {/* 새 책 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => { setShowAddModal(false); setAddQuery(""); setAddResults([]); }}>
          <div className="mb-16 flex max-h-[75dvh] w-full max-w-lg flex-col rounded-2xl bg-white p-5 sm:mb-0 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-grape-700">새 책 추가</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddQuery("");
                  setAddResults([]);
                }}
                className="text-warm-400 hover:text-warm-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                ref={addSearchRef}
                type="text"
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSearch()}
                placeholder="책 제목으로 검색..."
                className="flex-1 rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <button
                onClick={handleAddSearch}
                disabled={addSearching}
                className="rounded-lg bg-grape-600 px-4 text-white hover:bg-grape-700 disabled:opacity-50"
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => setScannerOpen(true)}
                className="rounded-lg bg-warm-100 px-3 text-warm-600 hover:bg-warm-200"
                title="바코드 스캔"
              >
                <Camera size={18} />
              </button>
            </div>

            {addSearching && (
              <p className="text-center text-sm text-warm-400">검색 중...</p>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {addResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleAddBook(result)}
                  className="flex w-full gap-3 rounded-lg border border-warm-200 p-3 text-left hover:border-grape-300 hover:bg-grape-50"
                >
                  {result.cover_url ? (
                    <img
                      src={result.cover_url}
                      alt=""
                      className="h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100">
                      📕
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-warm-900">
                      {result.title}
                    </p>
                    <p className="truncate text-xs text-warm-500">
                      {result.author}
                    </p>
                    {result.publisher && (
                      <p className="truncate text-xs text-warm-500">
                        {result.publisher}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
