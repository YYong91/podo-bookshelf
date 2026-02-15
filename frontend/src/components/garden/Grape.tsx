interface GrapeProps {
  filled: boolean;
  index: number;
  onClick?: () => void;
}

export default function Grape({ filled, index, onClick }: GrapeProps) {
  const id = `grape-${index}`;
  return (
    <g onClick={onClick} className="cursor-pointer" style={{ animationDelay: `${index * 0.05}s` }}>
      <defs>
        {filled && (
          <radialGradient id={`${id}-fill`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </radialGradient>
        )}
        {!filled && (
          <radialGradient id={`${id}-empty`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#F5F3FF" />
            <stop offset="100%" stopColor="#E9D5FF" />
          </radialGradient>
        )}
      </defs>
      {/* 그림자 */}
      <circle cx={1} cy={2} r={11} fill="rgba(0,0,0,0.08)" />
      {/* 포도알 본체 */}
      <circle
        cx={0}
        cy={0}
        r={11}
        fill={filled ? `url(#${id}-fill)` : `url(#${id}-empty)`}
        stroke={filled ? "#6D28D9" : "#DDD6FE"}
        strokeWidth={0.8}
      />
      {/* 하이라이트 반사광 */}
      <ellipse
        cx={-3}
        cy={-3}
        rx={4}
        ry={3}
        fill="white"
        opacity={filled ? 0.35 : 0.5}
        transform="rotate(-20 -3 -3)"
      />
    </g>
  );
}
