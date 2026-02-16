interface HarvestBasketProps {
  completedBunches: number; // 0-9
  currentGrapes: number;    // 0-9
}

// 미니 포도송이 — 5알짜리 작은 클러스터
function MiniCluster({ filledCircles }: { filledCircles: number }) {
  const positions = [
    { x: 0, y: -7 },
    { x: -8, y: 0 },
    { x: 8, y: 0 },
    { x: -5, y: 9 },
    { x: 5, y: 9 },
  ];
  return (
    <g>
      {positions.map(({ x, y }, i) => {
        const filled = i < filledCircles;
        return (
          <g key={i}>
            <circle cx={x + 0.5} cy={y + 1} r={6.5} fill="rgba(0,0,0,0.04)" />
            <circle
              cx={x} cy={y} r={6.5}
              fill={filled ? "url(#hb-grape-f)" : "url(#hb-grape-e)"}
              stroke={filled ? "#7C3AED" : "#DDD6FE"}
              strokeWidth={0.4}
            />
            {filled && (
              <ellipse
                cx={x - 2} cy={y - 2.5} rx={2.5} ry={1.8}
                fill="white" opacity={0.25}
                transform={`rotate(-20 ${x - 2} ${y - 2.5})`}
              />
            )}
          </g>
        );
      })}
      {/* 꼭지 */}
      <line x1={0} y1={-14} x2={0} y2={-9} stroke="#4A8038" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </g>
  );
}

// 슬롯 위치 — 전부 림 위에 배치 (넘치는 바구니)
const SLOTS = [
  // 1열: 림 바로 위
  { x: -26, y: 32, rot: -4 },
  { x: 0, y: 35, rot: 6 },
  { x: 26, y: 32, rot: -3 },
  // 2열
  { x: -32, y: 10, rot: 5 },
  { x: -4, y: 8, rot: -6 },
  { x: 28, y: 12, rot: 3 },
  // 3열
  { x: -20, y: -12, rot: -5 },
  { x: 14, y: -14, rot: 4 },
  // 꼭대기
  { x: -6, y: -32, rot: -3 },
  { x: 20, y: -34, rot: 5 },
];

export default function HarvestBasket({ completedBunches, currentGrapes }: HarvestBasketProps) {
  const growingCircles = currentGrapes > 0 ? Math.ceil(currentGrapes / 2) : 0;
  const total = completedBunches + (currentGrapes > 0 ? 1 : 0);

  const clusters: { x: number; y: number; rot: number; circles: number }[] = [];
  for (let i = 0; i < total && i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const isGrowing = i === completedBunches;
    clusters.push({ ...slot, circles: isGrowing ? growingCircles : 5 });
  }

  return (
    <svg viewBox="-80 -55 160 178" className="h-full w-full">
      <defs>
        <linearGradient id="hb-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="40%" stopColor="#C4925E" />
          <stop offset="100%" stopColor="#A87A4A" />
        </linearGradient>
        <linearGradient id="hb-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0C098" />
          <stop offset="100%" stopColor="#C4925E" />
        </linearGradient>
        <linearGradient id="hb-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4925E" />
          <stop offset="50%" stopColor="#B8864E" />
          <stop offset="100%" stopColor="#C4925E" />
        </linearGradient>
        <radialGradient id="hb-grape-f" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#B794F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <radialGradient id="hb-grape-e" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="100%" stopColor="#EDE5FF" />
        </radialGradient>
        <linearGradient id="hb-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6BCB6B" />
          <stop offset="100%" stopColor="#3DA03D" />
        </linearGradient>
      </defs>

      {/* 손잡이 */}
      <path
        d="M -46,45 Q -50,-2 0,-46 Q 50,-2 46,45"
        stroke="url(#hb-handle)" strokeWidth={4} fill="none" strokeLinecap="round"
      />
      <path
        d="M -44,42 Q -47,0 0,-43 Q 47,0 44,42"
        stroke="#E0C098" strokeWidth={0.8} fill="none" opacity={0.3}
      />

      {/* 잎 장식 */}
      <path d="M -3,-42 Q -14,-54 -22,-46 Q -16,-36 -5,-42 Z" fill="url(#hb-leaf)" opacity={0.85} />
      <path d="M -6,-43 Q -12,-45 -17,-42" stroke="#2D7A2D" strokeWidth={0.4} fill="none" opacity={0.25} />
      <path d="M 3,-42 Q 14,-54 22,-46 Q 16,-36 5,-42 Z" fill="url(#hb-leaf)" opacity={0.8} />
      <path d="M 6,-43 Q 12,-45 17,-42" stroke="#2D7A2D" strokeWidth={0.4} fill="none" opacity={0.25} />
      <path d="M 0,-40 Q -3,-34 -1,-30 Q 2,-34 0,-40 Z" fill="#3DA03D" opacity={0.35} />

      {/* 바구니 */}
      <path
        d="M -52,45 L -42,108 Q -34,118 0,120 Q 34,118 42,108 L 52,45 Z"
        fill="url(#hb-basket)"
      />

      {/* 짜임 무늬 — 가로 */}
      {[58, 72, 86, 100].map((y) => {
        const s = (y - 45) * 0.1;
        return (
          <path key={y} d={`M ${-46 + s},${y} L ${46 - s},${y}`} stroke="#B87A4A" strokeWidth={0.7} opacity={0.2} />
        );
      })}
      {/* 짜임 무늬 — 세로 */}
      {[-22, -8, 6, 20].map((x) => (
        <path key={x} d={`M ${x},46 Q ${x * 0.8},82 ${x * 0.65},112`} stroke="#B87A4A" strokeWidth={0.5} fill="none" opacity={0.15} />
      ))}

      {/* 하이라이트 */}
      <path d="M -42,52 Q -38,78 -34,102" stroke="#E0C098" strokeWidth={1.8} fill="none" opacity={0.2} strokeLinecap="round" />

      {/* 림 */}
      <rect x="-54" y="42" width="108" height="7" rx="3.5" fill="url(#hb-rim)" />
      <rect x="-51" y="43.5" width="102" height="2.5" rx="1.2" fill="#EAD0A8" opacity="0.25" />

      {/* 포도송이들 — 림 위에 쌓임 */}
      {clusters.map((c, i) => (
        <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
          <MiniCluster filledCircles={c.circles} />
        </g>
      ))}

      {/* 빈 바구니일 때 안내 */}
      {total === 0 && (
        <text x={0} y={82} textAnchor="middle" fontSize={10} fill="#B8956A" opacity={0.5}>
          비어있어요
        </text>
      )}
    </svg>
  );
}
