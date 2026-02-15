interface GrapeProps {
  filled: boolean;
  index: number;
  onClick?: () => void;
}

export default function Grape({ filled, index, onClick }: GrapeProps) {
  return (
    <circle
      cx={0}
      cy={0}
      r={12}
      fill={filled ? "#7C3AED" : "#E9D5FF"}
      stroke={filled ? "#6B21A8" : "#C4B5FD"}
      strokeWidth={1.5}
      className={`cursor-pointer transition-all hover:scale-110 ${filled ? "animate-grape-pop" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    />
  );
}
