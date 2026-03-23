import { useNavigate } from "react-router-dom";
import { Camera, Plus, Search, X } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import BookFilters from "../components/BookFilters";
import BookGrid from "../components/BookGrid";
import { useAuth } from "../context/AuthContext";
import { useBookshelf } from "../hooks/useBookshelf";

export default function BookshelfPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    books,
    total,
    loading,
    query,
    setQuery,
    sort,
    setSort,
    hasMore,
    fetchBooks,
    searchRef,
    showAddModal,
    setShowAddModal,
    addQuery,
    setAddQuery,
    addResults,
    addSearching,
    addSearchRef,
    scannerOpen,
    setScannerOpen,
    handleAddSearch,
    handleAddBook,
    handleBarcodeScan,
    closeAddModal,
  } = useBookshelf();

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
          className="flex items-center gap-1.5 rounded-lg bg-grape-600 px-4 py-3 text-sm font-medium text-white hover:bg-grape-700"
        >
          <Plus size={18} />
          새 책 추가
        </button>
      </div>

      {/* 검색 + 정렬 */}
      <BookFilters
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        searchRef={searchRef}
      />

      {/* 총 권수 */}
      {!loading && (
        <p className="text-sm text-warm-500">
          총 <span className="font-medium text-grape-600">{total}</span>권
        </p>
      )}

      {/* 책 그리드 */}
      {books.length > 0 ? (
        <BookGrid
          books={books}
          currentUserId={user?.id}
          onBookClick={(id) => navigate(`/books/${id}`)}
        />
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={closeAddModal}>
          <div className="mb-16 flex max-h-[75dvh] w-full max-w-lg flex-col rounded-2xl bg-white p-5 sm:mb-0 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-grape-700">새 책 추가</h2>
              <button
                onClick={closeAddModal}
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
              {addResults.map((result) => (
                <button
                  key={result.isbn || `${result.title}-${result.author}`}
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
