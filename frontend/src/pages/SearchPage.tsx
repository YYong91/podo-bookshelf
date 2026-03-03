import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, PenLine, Search } from "lucide-react";
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
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [lastAddedBook, setLastAddedBook] = useState<Book | null>(null);

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
      setLastAddedBook(book);
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
      setLastAddedBook(book);
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
            <div
              key={i}
              className="flex w-full gap-3 rounded-lg border border-warm-200 p-3"
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
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="rounded-full border border-warm-200 px-2.5 py-1 text-xs text-warm-600 hover:border-grape-300 hover:text-grape-600"
                  >
                    상세보기
                  </button>
                  <button
                    onClick={() => handleAddBook(book)}
                    className="rounded-full bg-grape-100 px-2.5 py-1 text-xs font-medium text-grape-600 hover:bg-grape-200"
                  >
                    책장에 추가
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 책 상세 모달 */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              {selectedBook.cover_url ? (
                <img src={selectedBook.cover_url} alt="" className="h-36 w-28 shrink-0 rounded-lg object-cover shadow" />
              ) : (
                <div className="flex h-36 w-28 shrink-0 items-center justify-center rounded-lg bg-grape-100 text-4xl shadow">📕</div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-bold leading-snug text-warm-900">{selectedBook.title}</h2>
                <p className="mt-1 text-sm text-warm-500">{selectedBook.author}</p>
                {selectedBook.publisher && (
                  <p className="mt-1 text-xs text-warm-400">{selectedBook.publisher}</p>
                )}
                {selectedBook.isbn && (
                  <p className="mt-1 text-xs text-warm-400">ISBN: {selectedBook.isbn}</p>
                )}
                {selectedBook.language && (
                  <span className="mt-2 inline-block rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500">
                    {selectedBook.language === "ko" ? "한글" : "영어"}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setSelectedBook(null)}
                className="flex-1 rounded-lg border border-warm-200 py-2.5 text-sm text-warm-600 hover:bg-warm-50"
              >
                닫기
              </button>
              <button
                onClick={() => { handleAddBook(selectedBook); setSelectedBook(null); }}
                className="flex-1 rounded-lg bg-grape-600 py-2.5 text-sm text-white hover:bg-grape-700"
              >
                책장에 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 책 추가 완료 후 CTA */}
      {lastAddedBook && searchResults.length === 0 && (
        <div className="rounded-xl border border-grape-200 bg-grape-50 p-4">
          <div className="flex gap-3">
            {lastAddedBook.cover_url ? (
              <img
                src={lastAddedBook.cover_url}
                alt={lastAddedBook.title}
                className="h-16 w-12 shrink-0 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-grape-100 text-2xl shadow-sm">
                📕
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-grape-500">책장에 추가됐어요!</p>
              <p className="mt-0.5 truncate font-semibold text-warm-900">{lastAddedBook.title}</p>
              <p className="truncate text-xs text-warm-500">{lastAddedBook.author}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigate(`/write?book_id=${lastAddedBook.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-grape-600 py-2.5 text-sm font-medium text-white hover:bg-grape-700"
            >
              <PenLine size={15} />
              지금 독서 기록 남기기
            </button>
            <button
              onClick={() => setLastAddedBook(null)}
              className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm text-warm-500 hover:bg-warm-50"
            >
              나중에
            </button>
          </div>
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
