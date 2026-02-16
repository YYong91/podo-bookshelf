import type { GardenStats } from "../../types";
import HarvestBasket from "./HarvestBasket";
import Tree from "./Tree";

interface GardenProps {
  stats: GardenStats;
}

// 나무: 최대 6그루, 모두 잘 보이는 크기
const TREE_SLOTS = [
  // 앞줄 — 바구니와 안 겹치게 좌우 배치
  { x: 22, y: 14, scale: 0.9, z: 28 },
  { x: 78, y: 14, scale: 0.9, z: 28 },
  { x: 50, y: 22, scale: 0.95, z: 25 },
  // 뒷줄
  { x: 35, y: 40, scale: 0.62, z: 14 },
  { x: 65, y: 40, scale: 0.62, z: 14 },
  { x: 50, y: 54, scale: 0.5, z: 6 },
];

export default function Garden({ stats }: GardenProps) {
  const { trees, bunches, grapes, total_reviews } = stats;
  const displayTrees = Math.min(trees, TREE_SLOTS.length);
  const extraTrees = Math.max(0, trees - TREE_SLOTS.length);

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm" style={{ background: "#FFF8F0" }}>
      <div className="pb-2 pt-4 text-center">
        <h2 className="text-lg font-bold text-grape-700">포도정원</h2>
        <p className="mt-1 text-sm text-warm-500">
          총 <span className="font-bold text-grape-600">{total_reviews}권</span> 읽었어요!
        </p>
      </div>

      <div className="relative mx-auto aspect-[4/3] overflow-hidden">
        {/* 배경 */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 375"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4E8F7" />
              <stop offset="40%" stopColor="#F5E6CE" />
              <stop offset="70%" stopColor="#E8D4B0" />
              <stop offset="100%" stopColor="#C8E4B8" />
            </linearGradient>
            <radialGradient id="g-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF3C4" />
              <stop offset="40%" stopColor="#FFE082" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="g-hill-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A8CCA8" />
              <stop offset="100%" stopColor="#7CB87C" />
            </linearGradient>
            <linearGradient id="g-hill-main" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5EA05E" />
              <stop offset="100%" stopColor="#4A8E4A" />
            </linearGradient>
            <linearGradient id="g-hill-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A8E4A" />
              <stop offset="100%" stopColor="#3D7A3D" />
            </linearGradient>
          </defs>

          {/* 하늘 */}
          <rect width="500" height="375" fill="url(#g-sky)" />

          {/* 해 */}
          <circle cx="80" cy="60" r="60" fill="url(#g-sun)" />
          <circle cx="80" cy="60" r="18" fill="#FFE89A" />
          <circle cx="80" cy="60" r="14" fill="#FFF3C4" opacity="0.8" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={80 + Math.cos(r) * 22}
                y1={60 + Math.sin(r) * 22}
                x2={80 + Math.cos(r) * 35}
                y2={60 + Math.sin(r) * 35}
                stroke="#FFE082" strokeWidth="2" strokeLinecap="round" opacity="0.3"
              />
            );
          })}

          {/* 구름 */}
          <g opacity="0.6" style={{ animation: "garden-cloud-float 12s ease-in-out infinite" }}>
            <ellipse cx="220" cy="48" rx="30" ry="10" fill="white" />
            <ellipse cx="236" cy="42" rx="18" ry="8" fill="white" />
            <ellipse cx="206" cy="44" rx="16" ry="7" fill="white" />
          </g>
          <g opacity="0.4" style={{ animation: "garden-cloud-float 16s ease-in-out infinite reverse" }}>
            <ellipse cx="400" cy="58" rx="24" ry="8" fill="white" />
            <ellipse cx="414" cy="52" rx="14" ry="6" fill="white" />
          </g>

          {/* 새 */}
          <g opacity="0.2">
            <path d="M 320,68 Q 323,62 326,68" stroke="#78716c" strokeWidth="1.2" fill="none" />
            <path d="M 340,60 Q 343,54 346,60" stroke="#78716c" strokeWidth="1" fill="none" />
          </g>

          {/* 뒤쪽 언덕 */}
          <path
            d="M 0,220 Q 80,190 180,205 Q 280,218 380,195 Q 450,185 500,200 L 500,375 L 0,375 Z"
            fill="url(#g-hill-back)" opacity="0.6"
          />

          {/* 책방 */}
          <g transform="translate(425, 172)">
            <rect x="-14" y="-1" width="28" height="20" rx="1.5" fill="#D4A574" />
            <path d="M -18,-1 L 0,-16 L 18,-1 Z" fill="#D47B6A" />
            <rect x="-4" y="7" width="8" height="12" rx="1.5" fill="#8B6543" />
            <circle cx="2" cy="13" r="1" fill="#D4A574" />
            <rect x="7" y="3" width="6" height="6" rx="1" fill="#FFF5E6" opacity="0.85" />
            <rect x="-12" y="3" width="6" height="6" rx="1" fill="#FFF5E6" opacity="0.85" />
            <rect x="14" y="-1" width="12" height="7" rx="1.5" fill="#FFF8EE" stroke="#D4A574" strokeWidth="0.5" />
            <text x="20" y="4.5" fontSize="4" fill="#7C3AED" textAnchor="middle" fontWeight="bold">🍇</text>
          </g>

          {/* 메인 언덕 */}
          <path
            d="M 0,270 Q 100,245 200,258 Q 300,270 400,250 Q 460,242 500,256 L 500,375 L 0,375 Z"
            fill="url(#g-hill-main)"
          />

          {/* 오솔길 */}
          <path
            d="M 250,268 Q 244,300 248,340 Q 252,360 250,375"
            stroke="#C4A878" strokeWidth="14" fill="none" opacity="0.15" strokeLinecap="round"
          />

          {/* 앞 언덕 */}
          <path
            d="M 0,320 Q 60,308 140,315 Q 240,324 340,312 Q 420,305 500,318 L 500,375 L 0,375 Z"
            fill="url(#g-hill-front)" opacity="0.4"
          />

          {/* 나비 */}
          <g style={{ animation: "garden-butterfly 8s ease-in-out infinite" }}>
            <g transform="translate(170, 240)">
              <path d="M 0,0 Q -5,-7 -2,-11 Q 1,-7 0,0" fill="#CE93D8" opacity="0.5" />
              <path d="M 0,0 Q 5,-7 2,-11 Q -1,-7 0,0" fill="#E1BEE7" opacity="0.5" />
              <path d="M 0,0 Q -3,4 -1,7 Q 1,4 0,0" fill="#CE93D8" opacity="0.35" />
              <path d="M 0,0 Q 3,4 1,7 Q -1,4 0,0" fill="#E1BEE7" opacity="0.35" />
            </g>
          </g>

          {/* 꽃 */}
          {[
            { x: 50, c: "#F8A4B8" }, { x: 130, c: "#FFD54F" },
            { x: 310, c: "#F8A4B8" }, { x: 390, c: "#FFD54F" },
            { x: 460, c: "#CE93D8" },
          ].map(({ x, c }, i) => {
            const y = 330 + (i % 3) * 6;
            return (
              <g key={`fl-${i}`} transform={`translate(${x}, ${y})`}>
                <circle cx={-2} cy={-2} r={2.8} fill={c} opacity="0.55" />
                <circle cx={2} cy={-2} r={2.8} fill={c} opacity="0.55" />
                <circle cx={0} cy={1.5} r={2.8} fill={c} opacity="0.5" />
                <circle cx={0} cy={0} r={1.8} fill="#FFECB3" opacity="0.75" />
                <line x1={0} y1={3.5} x2={0} y2={12} stroke="#5A9E5A" strokeWidth="1" opacity="0.35" />
              </g>
            );
          })}

          {/* 풀 */}
          {[40, 100, 270, 350, 440].map((x, i) => {
            const y = 325 + (i % 3) * 5;
            return (
              <g key={`gr-${i}`} opacity="0.3">
                <path d={`M ${x},${y} Q ${x - 2},${y - 10} ${x - 4},${y - 15}`} stroke="#3D7A3D" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={`M ${x},${y} Q ${x + 1},${y - 11} ${x + 3},${y - 16}`} stroke="#4A8E4A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>

        {/* 나무들 */}
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
                width: 110,
                height: 170,
              }}
            >
              <Tree bunchCount={10} />
            </div>
          ))}

        {/* 수확 바구니 — 중앙에 크게 */}
        <div
          className="absolute"
          style={{
            left: "50%",
            bottom: "1%",
            transform: "translateX(-50%)",
            zIndex: 40,
            width: "40%",
            maxWidth: 170,
          }}
        >
          <HarvestBasket completedBunches={bunches} currentGrapes={grapes} />
        </div>

        {/* 초과 표시 */}
        {extraTrees > 0 && (
          <div className="absolute right-2 top-2 z-50">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-leaf-700 shadow-sm">
              +{extraTrees}그루
            </span>
          </div>
        )}

        {/* 빈 정원 */}
        {total_reviews === 0 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-[3%]">
            <div style={{ width: "35%", maxWidth: 150 }}>
              <HarvestBasket completedBunches={0} currentGrapes={0} />
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
