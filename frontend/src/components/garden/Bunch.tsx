import Grape from "./Grape";

interface BunchProps {
  filledCount: number;
  complete?: boolean;
}

const GRAPE_POSITIONS = [
  { x: 0, y: 0 },
  { x: -14, y: 24 }, { x: 14, y: 24 },
  { x: -28, y: 48 }, { x: 0, y: 48 }, { x: 28, y: 48 },
  { x: -14, y: 72 }, { x: 14, y: 72 },
  { x: 0, y: 96 },
  { x: 0, y: 120 },
];

export default function Bunch({ filledCount, complete }: BunchProps) {
  return (
    <svg viewBox="-40 -20 80 160" className="h-full w-full">
      <line x1={0} y1={-20} x2={0} y2={0} stroke="#15803D" strokeWidth={3} />
      <ellipse cx={12} cy={-12} rx={10} ry={6} fill="#22C55E" transform="rotate(-30 12 -12)" />
      {GRAPE_POSITIONS.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          <Grape filled={i < filledCount} index={i} />
        </g>
      ))}
      {complete && (
        <text x={0} y={150} textAnchor="middle" fontSize={10} fill="#7C3AED" fontWeight={600}>
          완성!
        </text>
      )}
    </svg>
  );
}
