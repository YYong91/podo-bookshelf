import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Search } from "lucide-react";
import toast from "react-hot-toast";
import { searchBooks, searchBookByIsbn } from "../api/search";
import { getBooks, createBook } from "../api/books";
import BarcodeScanner from "../components/BarcodeScanner";
import type { Book, BookSearchResult } from "../types";

export default function SearchPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // 직접 입력 필드
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [adding, setAdding] = useState(false);

  // 최근 추가한 책 로드
  useEffect(() => {
    getBooks({ sort: "newest", limit: 4 }).then(({ items }) => setRecentBooks(items));
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setShowManual(false);
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const handleAddBook = async (result: BookSearchResult) => {
    try {
      const book = await createBook({
        title: result.title,
        author: result.author,
        publisher: result.publisher,
        isbn: result.isbn,
        cover_url: result.cover_url || null,
        language: result.language || "ko",
      });
      toast.success(`"${result.title}" 책장에 추가!`);
      setSearchResults([]);
      setQuery("");
      // 최근 추가 목록 갱신
      setRecentBooks((prev) => [book, ...prev.filter((b) => b.id !== book.id)].slice(0, 4));
    } catch {
      toast.error("추가에 실패했어요");
    }
  };

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

  const handleManualAdd = async () => {
    if (!manualTitle.trim() || !manualAuthor.trim()) {
      toast.error("제목과 저자를 입력해주세요");
      return;
    }
    setAdding(true);
    try {
      const book = await createBook({
        title: manualTitle.trim(),
        author: manualAuthor.trim(),
        publisher: manualPublisher.trim() || "",
        isbn: null,
        cover_url: null,
        language: "ko",
      });
      toast.success(`"${book.title}" 책장에 추가!`);
      setManualTitle("");
      setManualAuthor("");
      setManualPublisher("");
      setShowManual(false);
      setRecentBooks((prev) => [book, ...prev.filter((b) => b.id !== book.id)].slice(0, 4));
    } catch {
      toast.error("추가에 실패했어요");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setScannerOpen(false)}
      />

      <h1 className="text-xl font-bold text-grape-700">책 검색</h1>

      {/* 검색바 + 스캔 */}
      <div className="flex gap-2">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="책 제목으로 검색..."
          className="flex-1 rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          aria-label="검색"
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

      {searching && <p className="text-center text-sm text-warm-400">검색 중...</p>}

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((book, i) => (
            <button
              key={i}
              onClick={() => handleAddBook(book)}
              className="flex w-full gap-3 rounded-lg border border-warm-200 p-3 text-left hover:border-grape-300 hover:bg-grape-50"
            >
              {book.cover_url ? (
                <img src={book.cover_url} alt="" className="h-16 w-12 rounded object-cover" />
              ) : (
                <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100">📕</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-warm-900">{book.title}</p>
                <p className="truncate text-xs text-warm-500">{book.author}</p>
                {book.publisher && <p className="truncate text-xs text-warm-500">{book.publisher}</p>}
              </div>
              <span className="shrink-0 self-center rounded-full bg-grape-100 px-2.5 py-1 text-xs font-medium text-grape-600">
                추가
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없을 때 기본 화면 */}
      {searchResults.length === 0 && !searching && (
        <>
          {/* 직접 입력 */}
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="w-full rounded-lg border border-dashed border-warm-300 py-3 text-sm text-warm-500 hover:border-grape-400 hover:text-grape-600"
            >
              검색으로 안 나오는 책? 직접 입력하기
            </button>
          ) : (
            <div className="space-y-3 rounded-xl bg-warm-50 p-4">
              <p className="text-sm font-medium text-warm-700">직접 입력</p>
              <input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="책 제목 *"
                className="w-full rounded-lg border border-warm-200 bg-white px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                placeholder="저자 *"
                className="w-full rounded-lg border border-warm-200 bg-white px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={manualPublisher}
                onChange={(e) => setManualPublisher(e.target.value)}
                placeholder="출판사 (선택)"
                className="w-full rounded-lg border border-warm-200 bg-white px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManual(false)}
                  className="rounded-lg px-4 py-2 text-sm text-warm-500 hover:bg-warm-100"
                >
                  취소
                </button>
                <button
                  onClick={handleManualAdd}
                  disabled={adding}
                  className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700 disabled:opacity-50"
                >
                  {adding ? "추가 중..." : "책장에 추가"}
                </button>
              </div>
            </div>
          )}

          {/* 최근 추가한 책 */}
          {recentBooks.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-warm-500">최근 추가한 책</p>
              <div className="grid grid-cols-4 gap-3">
                {recentBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/write?book_id=${book.id}`)}
                    className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-colors hover:bg-grape-50"
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="aspect-[3/4] w-full rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-grape-100 text-2xl shadow-sm">
                        📕
                      </div>
                    )}
                    <p className="line-clamp-2 text-center text-[11px] font-medium text-warm-700">
                      {book.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
