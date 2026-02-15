import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReviews } from "../api/reviews";
import type { Review } from "../types";

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-grape-700">리뷰 목록</h1>
      {reviews.length === 0 ? (
        <div className="py-12 text-center text-warm-500">
          <p className="text-4xl">📖</p>
          <p className="mt-2">아직 리뷰가 없어요</p>
          <Link to="/write" className="mt-2 inline-block text-sm text-grape-500 underline">
            첫 리뷰 쓰러 가기
          </Link>
        </div>
      ) : (
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
                <p className="font-bold text-warm-900">{review.book.title}</p>
                <p className="text-xs text-warm-500">{review.book.author} · {review.read_date}</p>
                {review.memo && (
                  <p className="mt-1 line-clamp-2 text-sm text-warm-700">{review.memo}</p>
                )}
                {review.child_reaction && (
                  <p className="mt-1 text-xs text-grape-500">👶 {review.child_reaction}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
