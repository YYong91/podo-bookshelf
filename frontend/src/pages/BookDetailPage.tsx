import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PenSquare } from "lucide-react";
import { getBook, getBookReviews } from "../api/books";
import type { Book, Review } from "../types";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getBook(id), getBookReviews(id)])
      .then(([b, r]) => { setBook(b); setReviews(r); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-warm-500">불러오는 중...</div>;
  if (!book) return <div className="text-center text-warm-500">책을 찾을 수 없어요</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-warm-500 hover:text-warm-700">
        <ArrowLeft size={16} /> 돌아가기
      </button>

      {/* 책 정보 */}
      <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" className="h-36 w-28 rounded-lg object-cover shadow" />
        ) : (
          <div className="flex h-36 w-28 items-center justify-center rounded-lg bg-grape-100 text-4xl shadow">📕</div>
        )}
        <div>
          <h1 className="text-lg font-bold text-warm-900">{book.title}</h1>
          <p className="text-sm text-warm-500">{book.author}</p>
          {book.publisher && <p className="text-xs text-warm-500">{book.publisher}</p>}
          {book.language && (
            <span className="mt-1 inline-block rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500">
              {book.language === "ko" ? "한글" : "영어"}
            </span>
          )}
          <p className="mt-2 text-sm font-medium text-grape-600">
            {book.review_count}회 읽었어요
          </p>
        </div>
      </div>

      {/* 리딩 로그 타임라인 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-warm-700">리딩 로그</h2>
        {reviews.length === 0 ? (
          <p className="text-center text-sm text-warm-400">아직 기록이 없어요</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-medium text-grape-500">{review.read_date}</p>
                {review.memo && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-warm-800">{review.memo}</p>
                )}
                {review.child_reaction && (
                  <p className="mt-1 text-xs text-warm-500">👶 {review.child_reaction}</p>
                )}
                {review.activity && (
                  <p className="mt-1 text-xs text-leaf-600">📝 {review.activity}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/write"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grape-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-grape-700 md:bottom-8 md:right-8"
      >
        <PenSquare size={24} />
      </Link>
    </div>
  );
}
