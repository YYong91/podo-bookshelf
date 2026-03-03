import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { getBook } from "../api/books";
import { createReview } from "../api/reviews";
import api from "../api/client";
import MilestoneModal from "../components/MilestoneModal";
import type { Book } from "../types";

const MILESTONE_NUMBERS = new Set([10, 20, 30, 50, 100, 200, 300, 500]);

type AgeFormat = "months" | "years_months";

export default function WriteReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("book_id");

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [activity, setActivity] = useState("");
  const [childAgeYears, setChildAgeYears] = useState("");
  const [childAgeMonths, setChildAgeMonths] = useState("");
  const [ageFormat, setAgeFormat] = useState<AgeFormat>("months");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [milestoneTotal, setMilestoneTotal] = useState<number | null>(null);

  const totalAgeMonths = (parseInt(childAgeYears || "0") * 12) + parseInt(childAgeMonths || "0");

  const handleTotalMonthsChange = (value: string) => {
    const total = parseInt(value) || 0;
    setChildAgeYears(String(Math.floor(total / 12)));
    setChildAgeMonths(String(total % 12));
  };

  // book_id 없으면 책장으로
  useEffect(() => {
    if (!bookId) {
      navigate("/bookshelf", { replace: true });
      return;
    }
    setLoading(true);
    getBook(bookId)
      .then(setBook)
      .catch(() => {
        toast.error("책을 찾을 수 없어요");
        navigate("/bookshelf", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [bookId, navigate]);

  // 아이 생년월일 로드 & 자동 나이 계산
  useEffect(() => {
    api.get<{ child_birthdate?: string }>("/settings").then((r) => {
      if (r.data.child_birthdate) {
        setChildBirthdate(r.data.child_birthdate);
      }
    });
  }, []);

  useEffect(() => {
    if (!childBirthdate || !readDate) return;
    const birth = new Date(childBirthdate);
    const read = new Date(readDate);
    let years = read.getFullYear() - birth.getFullYear();
    let months = read.getMonth() - birth.getMonth();
    if (read.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years >= 0 && months >= 0) {
      setChildAgeYears(String(years));
      setChildAgeMonths(String(months));
    }
  }, [childBirthdate, readDate]);

  const handleSubmit = async () => {
    if (!bookId) return;
    setSubmitting(true);
    const ageMonths = childAgeYears || childAgeMonths
      ? (parseInt(childAgeYears || "0") * 12) + parseInt(childAgeMonths || "0")
      : null;
    try {
      const result = await createReview({
        book_id: bookId,
        read_date: readDate,
        memo,
        activity,
        child_age_months: ageMonths,
      });
      const total = result.total_reviews;
      if (total && MILESTONE_NUMBERS.has(total)) {
        setMilestoneTotal(total);
      } else {
        toast.success("포도알이 하나 생겼어요!");
        navigate("/");
      }
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-warm-400">불러오는 중...</p>;
  }

  if (!book) return null;

  return (
    <div className="space-y-6">
      {milestoneTotal && (
        <MilestoneModal total={milestoneTotal} onClose={() => navigate("/")} />
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-warm-400 hover:text-warm-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-grape-700">리딩로그 쓰기</h1>
      </div>

      {/* 선택된 책 정보 */}
      <div className="flex items-start gap-3 rounded-xl bg-grape-50 p-4">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" className="h-20 w-14 rounded object-cover" />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded bg-grape-100 text-2xl">📕</div>
        )}
        <div className="flex-1">
          <p className="font-bold text-warm-900">{book.title}</p>
          <p className="text-sm text-warm-500">{book.author}</p>
          {book.publisher && <p className="text-xs text-warm-500">{book.publisher}</p>}
          {book.review_count > 0 && (
            <span className="mt-1 inline-block rounded-full bg-grape-100 px-2 py-0.5 text-xs text-grape-600">
              {book.review_count}회 읽음
            </span>
          )}
        </div>
      </div>

      {/* 리뷰 폼 */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-warm-700">읽은 날짜</label>
          <input
            type="date" value={readDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setReadDate(e.target.value)}
            className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-warm-700">읽을 때 아이 나이 (선택)</label>
            <button
              type="button"
              onClick={() => setAgeFormat(ageFormat === "months" ? "years_months" : "months")}
              className="rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500 hover:bg-warm-200"
            >
              {ageFormat === "months" ? "세/개월로 보기" : "개월로 보기"}
            </button>
          </div>
          {ageFormat === "months" ? (
            <div className="flex items-center gap-2">
              <input
                type="number" value={totalAgeMonths || ""} onChange={(e) => handleTotalMonthsChange(e.target.value)}
                min="0" max="144" placeholder="0"
                className="w-24 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
              />
              <span className="text-sm text-warm-500">개월</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number" value={childAgeYears} onChange={(e) => setChildAgeYears(e.target.value)}
                min="0" max="12" placeholder="0"
                className="w-20 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
              />
              <span className="text-sm text-warm-500">세</span>
              <input
                type="number" value={childAgeMonths} onChange={(e) => setChildAgeMonths(e.target.value)}
                min="0" max="11" placeholder="0"
                className="w-20 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
              />
              <span className="text-sm text-warm-500">개월</span>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-warm-700">감상/메모</label>
          <textarea
            value={memo} onChange={(e) => setMemo(e.target.value)}
            rows={5} placeholder="이 책을 읽고 느낀 점, 아이 반응 등을 자유롭게 적어보세요..."
            className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-warm-700">활용 내용</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {["그림 그리기", "역할놀이", "만들기/공작", "노래/율동", "요리/간식", "야외 체험", "퀴즈/대화", "따라 읽기"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActivity((prev) => prev ? `${prev}, ${tag}` : tag)}
                className="rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-1 text-xs text-leaf-700 transition-colors hover:bg-leaf-100"
              >
                + {tag}
              </button>
            ))}
          </div>
          <textarea
            value={activity} onChange={(e) => setActivity(e.target.value)}
            rows={3} placeholder="책으로 어떤 활동을 했나요?"
            className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-xl bg-grape-600 py-4 text-base font-bold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "포도알 심기!"}
        </button>
      </div>
    </div>
  );
}
