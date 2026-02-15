import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getReview, updateReview, deleteReview } from "../api/reviews";
import type { Review } from "../types";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [readDate, setReadDate] = useState("");

  useEffect(() => {
    if (id) {
      getReview(Number(id)).then((r) => {
        setReview(r);
        setMemo(r.memo);
        setChildReaction(r.child_reaction);
        setReadDate(r.read_date);
      });
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const updated = await updateReview(Number(id), { memo, child_reaction: childReaction, read_date: readDate });
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
      await deleteReview(Number(id));
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
        <div>
          <h1 className="text-lg font-bold text-warm-900">{review.book.title}</h1>
          <p className="text-sm text-warm-500">{review.book.author}</p>
          {review.book.publisher && <p className="text-xs text-warm-500">{review.book.publisher}</p>}
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
              <input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
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
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700">저장</button>
              <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm text-warm-500 hover:bg-warm-100">취소</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-warm-500">읽은 날짜</p>
              <p className="mt-1 text-sm text-warm-900">{review.read_date}</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
