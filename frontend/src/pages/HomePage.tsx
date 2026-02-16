import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenSquare } from "lucide-react";
import { getStats } from "../api/stats";
import { getReviews } from "../api/reviews";
import Garden from "../components/garden/Garden";
import type { GardenStats, Review } from "../types";

export default function HomePage() {
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getReviews({ size: 5 }).then((data) => setRecentReviews(data.items));
  }, []);

  if (!stats) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <Garden stats={stats} />

      {recentReviews.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-warm-700">최근 읽은 책</h3>
          <div className="space-y-2">
            {recentReviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="flex gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {review.book.cover_url ? (
                  <img src={review.book.cover_url} alt={review.book.title} className="h-16 w-12 rounded object-cover" />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100 text-lg">📕</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-warm-900">{review.book.title}</p>
                  <p className="text-xs text-warm-500">{review.read_date} · {review.book.author}</p>
                  {review.memo && <p className="mt-1 truncate text-xs text-warm-500">{review.memo}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/write"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grape-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-grape-700 md:bottom-8 md:right-8"
      >
        <PenSquare size={24} />
      </Link>
    </div>
  );
}
