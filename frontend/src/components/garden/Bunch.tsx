import Grape from "./Grape";

interface BunchProps {
  filledCount: number;
  complete?: boolean;
}

// 포도알 위치 — 아래부터 채워짐 (바구니 안 → 위로 넘치는 순서)
const GRAPES = [
  // 바구니 안 (indices 0-3) — 먼저 채워짐
  { x: -14, y: 26, inBasket: true },
  { x: -4, y: 24, inBasket: true },
  { x: 7, y: 24, inBasket: true },
  { x: 17, y: 26, inBasket: true },
  // 바구니 위 1열 (indices 4-6)
  { x: -18, y: 8, inBasket: false },
  { x: 1, y: 6, inBasket: false },
  { x: 19, y: 8, inBasket: false },
  // 바구니 위 2열 (indices 7-8)
  { x: -9, y: -10, inBasket: false },
  { x: 11, y: -10, inBasket: false },
  // 꼭대기 (index 9) — 마지막에 채워짐
  { x: 1, y: -26, inBasket: false },
];

export default function Bunch({ filledCount, complete }: BunchProps) {
  const renderGrape = (i: number) => {
    const { x, y } = GRAPES[i];
    return (
      <g key={i} transform={`translate(${x}, ${y})`}>
        <Grape filled={i < filledCount} index={i} />
      </g>
    );
  };

  return (
    <svg viewBox="-48 -58 96 135" className="h-full w-full">
      <defs>
        {/* 바구니 그라데이션 */}
        <linearGradient id="b-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="40%" stopColor="#C4925E" />
          <stop offset="100%" stopColor="#A87A4A" />
        </linearGradient>
        <linearGradient id="b-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0C098" />
          <stop offset="100%" stopColor="#C4925E" />
        </linearGradient>
        <linearGradient id="b-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4925E" />
          <stop offset="50%" stopColor="#B8864E" />
          <stop offset="100%" stopColor="#C4925E" />
        </linearGradient>
        {/* 잎 그라데이션 */}
        <linearGradient id="b-leaf-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6BCB6B" />
          <stop offset="100%" stopColor="#3DA03D" />
        </linearGradient>
        <linearGradient id="b-leaf-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6BCB6B" />
          <stop offset="100%" stopColor="#3DA03D" />
        </linearGradient>
        {/* 포도 글로우 */}
        <radialGradient id="b-glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#C4A0F8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#C4A0F8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 포도 글로우 — 채워진 알이 많을수록 */}
      {filledCount > 5 && (
        <ellipse cx={1} cy={5} rx={34} ry={38} fill="url(#b-glow)" />
      )}

      {/* 바구니 손잡이 */}
      <path
        d="M -28,16 Q -32,-16 0,-50 Q 32,-16 28,16"
        stroke="url(#b-handle)"
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* 손잡이 하이라이트 */}
      <path
        d="M -26,12 Q -29,-14 0,-47 Q 29,-14 26,12"
        stroke="#E0C098"
        strokeWidth={0.8}
        fill="none"
        opacity={0.35}
      />

      {/* 잎 장식 — 손잡이 꼭대기 */}
      <path
        d="M -3,-46 Q -15,-58 -23,-50 Q -17,-40 -5,-46 Z"
        fill="url(#b-leaf-l)"
        opacity={0.85}
      />
      <path d="M -6,-47 Q -13,-49 -18,-46" stroke="#2D7A2D" strokeWidth={0.5} fill="none" opacity={0.3} />
      <path
        d="M 3,-46 Q 15,-58 23,-50 Q 17,-40 5,-46 Z"
        fill="url(#b-leaf-r)"
        opacity={0.8}
      />
      <path d="M 6,-47 Q 13,-49 18,-46" stroke="#2D7A2D" strokeWidth={0.5} fill="none" opacity={0.3} />
      {/* 작은 잎 */}
      <path
        d="M -1,-44 Q -5,-38 -2,-35 Q 1,-38 -1,-44 Z"
        fill="#3DA03D"
        opacity={0.4}
      />

      {/* 바구니 뒷면 (살짝 비침) */}
      <path
        d="M -30,16 L -24,52 Q -20,60 1,62 Q 22,60 26,52 L 32,16 Z"
        fill="#C4925E"
        opacity={0.2}
      />

      {/* 바구니 안쪽 포도알 (0-3) */}
      {[0, 1, 2, 3].map(renderGrape)}

      {/* 바구니 앞면 */}
      <path
        d="M -30,16 L -24,52 Q -20,60 1,62 Q 22,60 26,52 L 32,16 Z"
        fill="url(#b-basket)"
      />

      {/* 바구니 짜임 패턴 — 가로 */}
      {[24, 32, 40, 48].map((y) => {
        const shrink = (y - 16) * 0.15;
        return (
          <path
            key={`h-${y}`}
            d={`M ${-28 + shrink},${y} L ${28 - shrink},${y}`}
            stroke="#B87A4A"
            strokeWidth={0.7}
            opacity={0.22}
          />
        );
      })}
      {/* 바구니 짜임 패턴 — 세로 */}
      {[-12, 0, 12].map((x) => (
        <path
          key={`v-${x}`}
          d={`M ${x},17 Q ${x * 0.85},40 ${x * 0.7},57`}
          stroke="#B87A4A"
          strokeWidth={0.5}
          fill="none"
          opacity={0.18}
        />
      ))}

      {/* 바구니 하이라이트 */}
      <path
        d="M -24,20 Q -22,36 -18,50"
        stroke="#E0C098"
        strokeWidth={1.5}
        fill="none"
        opacity={0.2}
        strokeLinecap="round"
      />

      {/* 바구니 림 */}
      <rect x="-32" y="13" width="64" height="6" rx="3" fill="url(#b-rim)" />
      <rect x="-30" y="14" width="60" height="2" rx="1" fill="#EAD0A8" opacity="0.3" />

      {/* 바구니 위 포도알 (4-9) */}
      {[4, 5, 6, 7, 8, 9].map(renderGrape)}

      {/* 완성 배지 */}
      {complete && (
        <g transform="translate(1, 70)">
          <ellipse cx={0} cy={0} rx={16} ry={7} fill="#7C3AED" opacity={0.1} />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight={700}>
            완성!
          </text>
        </g>
      )}
    </svg>
  );
}
