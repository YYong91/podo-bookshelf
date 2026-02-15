import Grape from "./Grape";

interface BunchProps {
  filledCount: number;
  complete?: boolean;
}

// 실제 포도송이처럼 더 촘촘하고 유기적인 배치
const GRAPE_POSITIONS = [
  { x: 0, y: 4 },
  { x: -12, y: 24 }, { x: 12, y: 22 },
  { x: -22, y: 44 }, { x: 0, y: 42 }, { x: 22, y: 44 },
  { x: -14, y: 63 }, { x: 12, y: 65 },
  { x: -4, y: 84 },
  { x: 4, y: 103 },
];

export default function Bunch({ filledCount, complete }: BunchProps) {
  return (
    <svg viewBox="-42 -35 84 165" className="h-full w-full">
      <defs>
        {/* 줄기 그라데이션 */}
        <linearGradient id="stem-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="50%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        {/* 잎 그라데이션 */}
        <linearGradient id="leaf-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="leaf-grad-2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>

      {/* 줄기 - 곡선으로 자연스럽게 */}
      <path
        d="M 0,-35 Q 2,-20 0,4"
        stroke="url(#stem-grad)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />

      {/* 왼쪽 잎 */}
      <path
        d="M -2,-25 Q -20,-35 -24,-22 Q -26,-14 -8,-18 Z"
        fill="url(#leaf-grad-1)"
        opacity={0.9}
      />
      {/* 잎맥 */}
      <path d="M -2,-25 Q -14,-24 -18,-20" stroke="#166534" strokeWidth={0.5} fill="none" opacity={0.4} />

      {/* 오른쪽 잎 */}
      <path
        d="M 2,-28 Q 18,-38 22,-26 Q 24,-18 8,-20 Z"
        fill="url(#leaf-grad-2)"
        opacity={0.85}
      />
      <path d="M 2,-28 Q 12,-28 16,-24" stroke="#166534" strokeWidth={0.5} fill="none" opacity={0.4} />

      {/* 덩굴 - 곡선 */}
      <path
        d="M 2,-30 Q 10,-36 8,-32 Q 6,-28 14,-34 Q 18,-38 16,-32"
        stroke="#15803D"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* 포도알들 */}
      {GRAPE_POSITIONS.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          <Grape filled={i < filledCount} index={i} />
        </g>
      ))}

      {/* 완성 표시 */}
      {complete && (
        <g transform="translate(0, 125)">
          <rect x={-16} y={-8} width={32} height={16} rx={8} fill="#7C3AED" opacity={0.15} />
          <text x={0} y={4} textAnchor="middle" fontSize={9} fill="#7C3AED" fontWeight={700}>
            완성!
          </text>
        </g>
      )}
    </svg>
  );
}
