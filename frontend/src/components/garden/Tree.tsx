interface TreeProps {
  bunchCount: number;
}

export default function Tree({ bunchCount }: TreeProps) {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full">
      <rect x={55} y={80} width={10} height={120} rx={3} fill="#92400E" />
      <ellipse cx={60} cy={70} rx={55} ry={60} fill="#22C55E" opacity={0.3} />
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i * 36 - 90) * (Math.PI / 180);
        const rx = 35;
        const ry = 40;
        const cx = 60 + rx * Math.cos(angle);
        const cy = 70 + ry * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={10}
            fill={i < bunchCount ? "#7C3AED" : "#E9D5FF"}
            stroke={i < bunchCount ? "#6B21A8" : "#C4B5FD"}
            strokeWidth={1}
          />
        );
      })}
      <ellipse cx={30} cy={40} rx={15} ry={8} fill="#16A34A" transform="rotate(-20 30 40)" />
      <ellipse cx={90} cy={45} rx={15} ry={8} fill="#16A34A" transform="rotate(20 90 45)" />
    </svg>
  );
}
