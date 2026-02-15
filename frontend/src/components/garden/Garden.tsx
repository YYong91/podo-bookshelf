import type { GardenStats } from "../../types";
import Bunch from "./Bunch";
import Tree from "./Tree";

interface GardenProps {
  stats: GardenStats;
}

// 나무 배치 슬롯 — 앞(크고 아래)→뒤(작고 위) 순서로 채워짐
const TREE_SLOTS = [
  // 앞줄 (가까이, 크게)
  { x: 50, y: 12, scale: 1.0, z: 31 },
  { x: 22, y: 15, scale: 0.93, z: 30 },
  { x: 78, y: 14, scale: 0.9, z: 29 },
  // 중간줄
  { x: 35, y: 33, scale: 0.72, z: 21 },
  { x: 65, y: 31, scale: 0.7, z: 20 },
  { x: 8, y: 35, scale: 0.65, z: 19 },
  { x: 92, y: 34, scale: 0.67, z: 19 },
  // 뒷줄
  { x: 25, y: 50, scale: 0.5, z: 11 },
  { x: 50, y: 48, scale: 0.52, z: 12 },
  { x: 75, y: 51, scale: 0.48, z: 10 },
  { x: 92, y: 49, scale: 0.45, z: 9 },
  // 맨 뒤
  { x: 15, y: 62, scale: 0.38, z: 5 },
  { x: 45, y: 60, scale: 0.4, z: 6 },
  { x: 72, y: 63, scale: 0.37, z: 4 },
];

// 완성된 포도송이 배치 (정원 앞쪽 바닥)
const BUNCH_SLOTS = [
  { x: 38, y: 5 },
  { x: 62, y: 3 },
  { x: 15, y: 6 },
  { x: 85, y: 4 },
  { x: 28, y: 2 },
  { x: 72, y: 7 },
  { x: 50, y: 1 },
  { x: 8, y: 4 },
  { x: 92, y: 5 },
];

export default function Garden({ stats }: GardenProps) {
  const { trees, bunches, grapes, total_reviews } = stats;
  const displayTrees = Math.min(trees, TREE_SLOTS.length);
  const displayBunches = Math.min(bunches, BUNCH_SLOTS.length);
  const extraTrees = trees - displayTrees;

  return (
    <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm">
      <div className="pb-2 pt-4 text-center">
        <h2 className="text-lg font-bold text-grape-700">포도정원</h2>
        <p className="mt-1 text-sm text-warm-500">
          총 <span className="font-bold text-grape-600">{total_reviews}권</span> 읽었어요!
        </p>
      </div>

      {/* 정원 풍경 */}
      <div
        className="relative mx-auto aspect-[5/3] overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #DBEAFE 0%, #BAE6FD 30%, #86EFAC 55%, #4ADE80 100%)",
        }}
      >
        {/* 구름 */}
        <div className="absolute left-[12%] top-[8%] h-4 w-12 rounded-full bg-white/50" />
        <div className="absolute left-[16%] top-[5%] h-3 w-8 rounded-full bg-white/40" />
        <div className="absolute right-[18%] top-[10%] h-3 w-10 rounded-full bg-white/45" />
        <div className="absolute right-[22%] top-[6%] h-4 w-8 rounded-full bg-white/35" />

        {/* 언덕 지형 */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0,42 Q 20,36 40,40 Q 60,44 80,38 Q 95,34 100,38 L 100,100 L 0,100 Z"
            fill="#86EFAC"
            opacity="0.6"
          />
          <path
            d="M 0,52 Q 25,46 50,50 Q 75,54 100,48 L 100,100 L 0,100 Z"
            fill="#4ADE80"
            opacity="0.5"
          />
          <path
            d="M 0,65 Q 30,60 60,63 Q 85,66 100,62 L 100,100 L 0,100 Z"
            fill="#22C55E"
            opacity="0.4"
          />
        </svg>

        {/* 작은 꽃 장식 */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
        >
          <circle cx="30" cy="95" r="1.5" fill="#FDE68A" opacity="0.7" />
          <circle cx="85" cy="88" r="1.2" fill="#FCA5A5" opacity="0.6" />
          <circle cx="150" cy="92" r="1.3" fill="#FDE68A" opacity="0.6" />
          <circle cx="170" cy="98" r="1" fill="#C4B5FD" opacity="0.5" />
          <circle cx="45" cy="100" r="1.2" fill="#FCA5A5" opacity="0.5" />
          <circle cx="120" cy="96" r="1.5" fill="#FDE68A" opacity="0.7" />
        </svg>

        {/* 나무들 — z 순서(뒤→앞)로 렌더링 */}
        {[...Array(displayTrees)]
          .map((_, i) => ({ ...TREE_SLOTS[i], idx: i }))
          .sort((a, b) => a.z - b.z)
          .map(({ x, y, scale, z, idx }) => (
            <div
              key={`tree-${idx}`}
              className="absolute"
              style={{
                left: `${x}%`,
                bottom: `${y}%`,
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: "bottom center",
                zIndex: z,
                width: 80,
                height: 130,
              }}
            >
              <Tree bunchCount={10} />
            </div>
          ))}

        {/* 완성된 포도송이 (앞쪽 바닥) */}
        {[...Array(displayBunches)].map((_, i) => {
          const slot = BUNCH_SLOTS[i];
          return (
            <div
              key={`bunch-${i}`}
              className="absolute"
              style={{
                left: `${slot.x}%`,
                bottom: `${slot.y}%`,
                transform: "translateX(-50%) scale(0.5)",
                transformOrigin: "bottom center",
                zIndex: 35,
                width: 48,
                height: 72,
              }}
            >
              <Bunch filledCount={10} complete />
            </div>
          );
        })}

        {/* 자라는 포도송이 (중앙 앞) */}
        {grapes > 0 && (
          <div
            className="absolute"
            style={{
              left: "50%",
              bottom: "2%",
              transform: "translateX(-50%) scale(0.55)",
              transformOrigin: "bottom center",
              zIndex: 40,
              width: 56,
              height: 84,
            }}
          >
            <Bunch filledCount={grapes} />
          </div>
        )}

        {/* 슬롯 초과 나무 표시 */}
        {extraTrees > 0 && (
          <div className="absolute right-2 top-2 z-50 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-leaf-700 shadow-sm">
            +{extraTrees}그루
          </div>
        )}

        {/* 빈 정원 */}
        {total_reviews === 0 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-[15%]">
            <div className="h-28 w-16 opacity-50">
              <Bunch filledCount={0} />
            </div>
            <p className="mt-1 rounded-full bg-white/60 px-3 py-1 text-xs text-warm-600">
              첫 번째 책을 읽고 포도알을 심어보세요!
            </p>
          </div>
        )}
      </div>

      {/* 하단 요약 */}
      <div className="flex justify-center gap-4 py-3 text-xs text-warm-500">
        {trees > 0 && <span>🌳 {trees}그루</span>}
        {bunches > 0 && <span>🍇 {bunches}송이</span>}
        <span className="font-medium text-grape-500">🫧 {grapes}/10알</span>
      </div>
    </div>
  );
}
