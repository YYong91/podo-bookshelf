import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Settings2 } from "lucide-react";
import { getStats } from "../api/stats";
import { getReviews } from "../api/reviews";
import api from "../api/client";
import Garden from "../components/garden/Garden";
import type { GardenStats, Review } from "../types";

interface Goals {
  monthly_goal: number;
  yearly_goal: number;
  monthly_count: number;
  yearly_count: number;
  month: string;
  year: number;
}

function GoalBar({ label, current, goal }: { label: string; current: number; goal: number }) {
  if (!goal) return null;
  const pct = Math.min((current / goal) * 100, 100);
  const done = current >= goal;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-warm-700">{label}</span>
        <span className={`text-xs font-bold ${done ? "text-leaf-600" : "text-grape-600"}`}>
          {current}/{goal}권 {done && "달성!"}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-warm-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? "bg-leaf-500" : "bg-grape-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const location = useLocation();
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [editingGoals, setEditingGoals] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [yearlyGoal, setYearlyGoal] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");

  useEffect(() => {
    getStats().then(setStats);
    getReviews({ size: 5 }).then((data) => setRecentReviews(data.items));
    api.get<Goals>("/goals").then((r) => {
      setGoals(r.data);
      setMonthlyGoal(r.data.monthly_goal ? String(r.data.monthly_goal) : "");
      setYearlyGoal(r.data.yearly_goal ? String(r.data.yearly_goal) : "");
    });
    api.get<{ child_birthdate?: string }>("/settings").then((r) => {
      setChildBirthdate(r.data.child_birthdate || "");
    });
  }, [location.key]);

  const saveGoals = async () => {
    const res = await api.put("/goals", {
      monthly: parseInt(monthlyGoal) || 0,
      yearly: parseInt(yearlyGoal) || 0,
    });
    await api.put("/settings", { child_birthdate: childBirthdate || null });
    setGoals((prev) => prev ? { ...prev, monthly_goal: res.data.monthly, yearly_goal: res.data.yearly } : prev);
    setEditingGoals(false);
  };

  if (!stats) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <Garden stats={stats} />

      {/* 독서 목표 */}
      {goals && (goals.monthly_goal > 0 || goals.yearly_goal > 0 || editingGoals) && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-warm-700">독서 목표</h3>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="rounded p-1 text-warm-400 hover:text-grape-600"
            >
              <Settings2 size={14} />
            </button>
          </div>
          {editingGoals ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-warm-500">월 목표</span>
                <input
                  type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(e.target.value)}
                  min="0" placeholder="0"
                  className="w-20 rounded-lg border border-warm-200 px-3 py-2 text-center text-sm focus:border-grape-400 focus:outline-none"
                />
                <span className="text-xs text-warm-500">권</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-warm-500">연 목표</span>
                <input
                  type="number" value={yearlyGoal} onChange={(e) => setYearlyGoal(e.target.value)}
                  min="0" placeholder="0"
                  className="w-20 rounded-lg border border-warm-200 px-3 py-2 text-center text-sm focus:border-grape-400 focus:outline-none"
                />
                <span className="text-xs text-warm-500">권</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-warm-500">아이 생일</span>
                <input
                  type="date" value={childBirthdate} onChange={(e) => setChildBirthdate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none"
                />
              </div>
              <button
                onClick={saveGoals}
                className="rounded-lg bg-grape-600 px-4 py-2 text-xs font-medium text-white hover:bg-grape-700"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <GoalBar label={`${goals.month.slice(5)}월`} current={goals.monthly_count} goal={goals.monthly_goal} />
              <GoalBar label={`${goals.year}년`} current={goals.yearly_count} goal={goals.yearly_goal} />
              {childBirthdate && (
                <p className="text-xs text-warm-500">
                  아이 생일: {childBirthdate}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 목표가 없으면 설정 유도 */}
      {goals && goals.monthly_goal === 0 && goals.yearly_goal === 0 && !editingGoals && (
        <button
          onClick={() => setEditingGoals(true)}
          className="w-full rounded-xl border border-dashed border-grape-300 bg-grape-50/50 p-4 text-center text-sm text-grape-500 transition-colors hover:bg-grape-50"
        >
          독서 목표를 설정해보세요
        </button>
      )}

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
        to="/search"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grape-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-grape-700 md:bottom-8 md:right-8"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
