import { Camera, PenLine, Search } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import { SearchResultList, BookDetailModal } from "../components/SearchResults";
import { useBookSearch } from "../hooks/useBookSearch";

export default function SearchPage() {
  const {
    navigate,
    searchInputRef,
    query,
    setQuery,
    searchResults,
    searching,
    handleSearch,
    scannerOpen,
    setScannerOpen,
    handleBarcodeScan,
    selectedBook,
    setSelectedBook,
    handleAddBook,
    lastAddedBook,
    setLastAddedBook,
    showManual,
    setShowManual,
    manualTitle,
    setManualTitle,
    manualAuthor,
    setManualAuthor,
    manualPublisher,
    setManualPublisher,
    adding,
    handleManualAdd,
    recentBooks,
  } = useBookSearch();

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
        <SearchResultList
          results={searchResults}
          onDetailClick={setSelectedBook}
          onAddClick={handleAddBook}
        />
      )}

      {/* 책 상세 모달 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAdd={handleAddBook}
        />
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
