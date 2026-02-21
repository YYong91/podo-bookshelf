import { useState } from "react";

interface Props {
  total: number;
  onClose: () => void;
}

const MILESTONES: Record<number, { emoji: string; title: string; sub: string }> = {
  10: { emoji: "🍇", title: "첫 번째 포도송이 완성!", sub: "포도알 10개가 모여 송이가 되었어요" },
  20: { emoji: "🍇🍇", title: "포도송이 2개!", sub: "벌써 20권이나 읽었어요" },
  30: { emoji: "🍇🍇🍇", title: "포도송이 3개!", sub: "30권 달성! 대단해요" },
  50: { emoji: "🎉", title: "50권 돌파!", sub: "반백 권을 읽다니, 정말 멋져요" },
  100: { emoji: "🌳", title: "첫 번째 포도나무!", sub: "100권의 책이 나무가 되었어요" },
  200: { emoji: "🌳🌳", title: "포도나무 2그루!", sub: "200권! 작은 과수원이 되어가고 있어요" },
  300: { emoji: "🌳🌳🌳", title: "포도나무 3그루!", sub: "300권! 멋진 포도밭이에요" },
  500: { emoji: "🏆", title: "500권 대장정!", sub: "정말 대단한 독서 여정이에요" },
};

function getMilestone(total: number) {
  return MILESTONES[total] || null;
}

export default function MilestoneModal({ total, onClose }: Props) {
  const milestone = getMilestone(total);
  const [particles] = useState<{ id: number; x: number; delay: number; color: string; size: number }[]>(() => {
    const colors = ["#7C3AED", "#A78BFA", "#C4B5FD", "#22C55E", "#FACC15", "#F472B6", "#60A5FA"];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
    }));
  });

  if (!milestone) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti rounded-full"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div
        className="relative mx-4 animate-bounce-in rounded-2xl bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-5xl">{milestone.emoji}</div>
        <h2 className="mb-2 text-2xl font-bold text-grape-700">{milestone.title}</h2>
        <p className="mb-1 text-warm-600">{milestone.sub}</p>
        <p className="mb-6 text-sm text-warm-400">총 {total}권의 책을 읽었어요</p>
        <button
          onClick={onClose}
          className="rounded-xl bg-grape-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-grape-700"
        >
          정원 보러가기
        </button>
      </div>
    </div>
  );
}
