import type { Book } from "../types";

interface BookGridProps {
  books: Book[];
  currentUserId?: string;
  onBookClick: (bookId: string) => void;
}

/** 책 카드 그리드 — 책장 페이지에서 사용 */
export default function BookGrid({ books, currentUserId, onBookClick }: BookGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {books.map((book) => (
        <button
          key={book.id}
          onClick={() => onBookClick(book.id)}
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
          <div className="flex items-center gap-1">
            {book.review_count > 0 && (
              <span className="rounded-full bg-grape-100 px-1.5 py-0.5 text-[10px] text-grape-600">
                {book.review_count}회
              </span>
            )}
            {book.user_id && currentUserId && book.user_id !== currentUserId && (
              <span className="rounded-full bg-warm-100 px-1.5 py-0.5 text-[10px] text-warm-500">
                가족
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
