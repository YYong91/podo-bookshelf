import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, PenSquare, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getReview, updateReview, deleteReview } from "../api/reviews";
import api from "../api/client";
import type { Review } from "../types";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [activity, setActivity] = useState("");
  const [readDate, setReadDate] = useState("");
  const [childAgeMonths, setChildAgeMonths] = useState<number | null>(null);
  const [childBirthdate, setChildBirthdate] = useState("");

  useEffect(() => {
    if (id) {
      getReview(id).then((r) => {
        setReview(r);
        setMemo(r.memo);
        setChildReaction(r.child_reaction);
        setActivity(r.activity || "");
        setReadDate(r.read_date);
        setChildAgeMonths(r.child_age_months);
      });
    }
    api.get<{ child_birthdate?: string }>("/settings").then((r) => {
      if (r.data.child_birthdate) setChildBirthdate(r.data.child_birthdate);
    });
  }, [id]);

  // 수정 모드에서 읽은 날짜 변경 시 아이 나이 자동 계산
  useEffect(() => {
    if (!editing || !childBirthdate || !readDate) return;
    const birth = new Date(childBirthdate);
    const read = new Date(readDate);
    let years = read.getFullYear() - birth.getFullYear();
    let months = read.getMonth() - birth.getMonth();
    if (read.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years >= 0 && months >= 0) {
      setChildAgeMonths(years * 12 + months);
    }
  }, [editing, childBirthdate, readDate]);

  const formatAge = (months: number) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y > 0 && m > 0) return `${y}세 ${m}개월`;
    if (y > 0) return `${y}세`;
    return `${m}개월`;
  };

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const updated = await updateReview(id, { memo, child_reaction: childReaction, activity, read_date: readDate, child_age_months: childAgeMonths });
      setReview({ ...review!, ...updated });
      setEditing(false);
      toast.success("수정되었어요");
    } catch {
      toast.error("수정에 실패했어요");
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("정말 삭제할까요?")) return;
    try {
      await deleteReview(id);
      toast.success("삭제되었어요");
      navigate("/reviews");
    } catch {
      toast.error("삭제에 실패했어요");
    }
  };

  if (!review) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-warm-500 hover:text-warm-700">
        <ArrowLeft size={16} /> 돌아가기
      </button>

      <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
        {review.book.cover_url ? (
          <img src={review.book.cover_url} alt="" className="h-32 w-24 rounded-lg object-cover shadow" />
        ) : (
          <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-grape-100 text-3xl shadow">📕</div>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-bold text-warm-900">{review.book.title}</h1>
          <p className="text-sm text-warm-500">{review.book.author}</p>
          {review.book.publisher && <p className="text-xs text-warm-500">{review.book.publisher}</p>}
          {review.book.language && (
            <span className="mt-1 inline-block rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500">
              {review.book.language === "ko" ? "한글" : "영어"}
            </span>
          )}
          <div className="mt-2 flex items-center gap-3">
            <Link
              to={`/books/${review.book_id}`}
              className="flex items-center gap-1 text-xs text-grape-500 hover:text-grape-700"
            >
              <BookOpen size={12} /> 리딩로그 모아보기
            </Link>
            <Link
              to={`/write?book_id=${review.book_id}`}
              className="flex items-center gap-1 text-xs text-grape-500 hover:text-grape-700"
            >
              <PenSquare size={12} /> 리딩로그 추가
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-warm-700">리딩 로그</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="rounded-lg p-2 text-warm-400 hover:bg-warm-100 hover:text-grape-600">
              <Pencil size={16} />
            </button>
            <button onClick={handleDelete} className="rounded-lg p-2 text-warm-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-warm-500">읽은 날짜</label>
              <input type="date" value={readDate} max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setReadDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">아이 나이 (선택)</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="number" value={childAgeMonths != null ? Math.floor(childAgeMonths / 12) : ""}
                  onChange={(e) => {
                    const y = parseInt(e.target.value || "0");
                    const m = (childAgeMonths ?? 0) % 12;
                    setChildAgeMonths(e.target.value || (childAgeMonths ?? 0) % 12 ? y * 12 + m : null);
                  }}
                  min="0" max="12" placeholder="0"
                  className="w-16 rounded-lg border border-warm-200 px-2 py-2 text-center text-sm focus:border-grape-400 focus:outline-none" />
                <span className="text-xs text-warm-500">세</span>
                <input type="number" value={childAgeMonths != null ? childAgeMonths % 12 : ""}
                  onChange={(e) => {
                    const m = parseInt(e.target.value || "0");
                    const y = Math.floor((childAgeMonths ?? 0) / 12);
                    setChildAgeMonths(e.target.value || Math.floor((childAgeMonths ?? 0) / 12) ? y * 12 + m : null);
                  }}
                  min="0" max="11" placeholder="0"
                  className="w-16 rounded-lg border border-warm-200 px-2 py-2 text-center text-sm focus:border-grape-400 focus:outline-none" />
                <span className="text-xs text-warm-500">개월</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">감상</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">아이 반응</label>
              <textarea value={childReaction} onChange={(e) => setChildReaction(e.target.value)} rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">활용 내용</label>
              <textarea value={activity} onChange={(e) => setActivity(e.target.value)} rows={3}
                placeholder="책으로 어떤 활동을 했나요?"
                className="mt-1 w-full resize-none rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700">저장</button>
              <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm text-warm-500 hover:bg-warm-100">취소</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-warm-500">읽은 날짜</p>
                <p className="mt-1 text-sm text-warm-900">{review.read_date}</p>
              </div>
              {review.child_age_months != null && (
                <div>
                  <p className="text-xs font-medium text-warm-500">아이 나이</p>
                  <p className="mt-1 text-sm text-warm-900">{formatAge(review.child_age_months)}</p>
                </div>
              )}
            </div>
            {review.memo && (
              <div>
                <p className="text-xs font-medium text-warm-500">감상</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-warm-900">{review.memo}</p>
              </div>
            )}
            {review.child_reaction && (
              <div>
                <p className="text-xs font-medium text-warm-500">아이 반응</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-warm-900">{review.child_reaction}</p>
              </div>
            )}
            {review.activity && (
              <div>
                <p className="text-xs font-medium text-warm-500">활용 내용</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-warm-900">{review.activity}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
