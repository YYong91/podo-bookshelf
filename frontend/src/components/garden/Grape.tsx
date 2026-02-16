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
            <stop offset="0%" stopColor="#B794F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </radialGradient>
        )}
        {!filled && (
          <radialGradient id={`${id}-empty`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FAF5FF" />
            <stop offset="100%" stopColor="#EDE5FF" />
          </radialGradient>
        )}
      </defs>
      <circle cx={1} cy={2} r={11} fill="rgba(0,0,0,0.06)" />
      <circle
        cx={0}
        cy={0}
        r={11}
        fill={filled ? `url(#${id}-fill)` : `url(#${id}-empty)`}
        stroke={filled ? "#7C3AED" : "#DDD6FE"}
        strokeWidth={0.7}
      />
      <ellipse
        cx={-3}
        cy={-3}
        rx={4}
        ry={3}
        fill="white"
        opacity={filled ? 0.3 : 0.45}
        transform="rotate(-20 -3 -3)"
      />
    </g>
  );
}
