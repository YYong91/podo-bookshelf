import { getLanguageLabel } from "../utils/language";
import type { BookSearchResult } from "../types";

interface SearchResultListProps {
  results: BookSearchResult[];
  onDetailClick: (book: BookSearchResult) => void;
  onAddClick: (book: BookSearchResult) => void;
}

/** 검색 결과 리스트 — SearchPage에서 사용 */
export function SearchResultList({ results, onDetailClick, onAddClick }: SearchResultListProps) {
  return (
    <div className="space-y-2">
      {results.map((book) => (
        <div
          key={book.isbn || `${book.title}-${book.author}`}
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
                onClick={() => onDetailClick(book)}
                className="rounded-full border border-warm-200 px-2.5 py-1 text-xs text-warm-600 hover:border-grape-300 hover:text-grape-600"
              >
                상세보기
              </button>
              <button
                onClick={() => onAddClick(book)}
                className="rounded-full bg-grape-100 px-2.5 py-1 text-xs font-medium text-grape-600 hover:bg-grape-200"
              >
                책장에 추가
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface BookDetailModalProps {
  book: BookSearchResult;
  onClose: () => void;
  onAdd: (book: BookSearchResult) => void;
}

/** 책 상세 모달 — SearchPage에서 사용 */
export function BookDetailModal({ book, onClose, onAdd }: BookDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          {book.cover_url ? (
            <img src={book.cover_url} alt="" className="h-36 w-28 shrink-0 rounded-lg object-cover shadow" />
          ) : (
            <div className="flex h-36 w-28 shrink-0 items-center justify-center rounded-lg bg-grape-100 text-4xl shadow">📕</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-bold leading-snug text-warm-900">{book.title}</h2>
            <p className="mt-1 text-sm text-warm-500">{book.author}</p>
            {book.publisher && (
              <p className="mt-1 text-xs text-warm-400">{book.publisher}</p>
            )}
            {book.isbn && (
              <p className="mt-1 text-xs text-warm-400">ISBN: {book.isbn}</p>
            )}
            {book.language && (
              <span className="mt-2 inline-block rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500">
                {getLanguageLabel(book.language)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-warm-200 py-2.5 text-sm text-warm-600 hover:bg-warm-50"
          >
            닫기
          </button>
          <button
            onClick={() => { onAdd(book); onClose(); }}
            className="flex-1 rounded-lg bg-grape-600 py-2.5 text-sm text-white hover:bg-grape-700"
          >
            책장에 추가
          </button>
        </div>
      </div>
    </div>
  );
}
