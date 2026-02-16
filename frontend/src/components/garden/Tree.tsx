interface TreeProps {
  bunchCount: number;
}

export default function Tree({ bunchCount }: TreeProps) {
  const bunchPositions = [
    { x: 32, y: 30 }, { x: 78, y: 28 },
    { x: 18, y: 48 }, { x: 55, y: 42 }, { x: 88, y: 46 },
    { x: 28, y: 66 }, { x: 68, y: 62 },
    { x: 42, y: 80 }, { x: 80, y: 78 },
    { x: 55, y: 92 },
  ];

  return (
    <svg viewBox="0 0 110 180" className="h-full w-full">
      <defs>
        <linearGradient id="t-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5C3A1E" />
          <stop offset="25%" stopColor="#7B5B3A" />
          <stop offset="50%" stopColor="#8B6B48" />
          <stop offset="75%" stopColor="#7B5B3A" />
          <stop offset="100%" stopColor="#5C3A1E" />
        </linearGradient>
        <radialGradient id="t-leaf-light" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#8ED88E" />
          <stop offset="100%" stopColor="#4CAF4C" />
        </radialGradient>
        <radialGradient id="t-leaf-mid" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#6BC46B" />
          <stop offset="100%" stopColor="#3D923D" />
        </radialGradient>
        <radialGradient id="t-leaf-dark" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#4CAF4C" />
          <stop offset="100%" stopColor="#2D7A2D" />
        </radialGradient>
        <radialGradient id="t-grape-f" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#C4A0F8" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
        <radialGradient id="t-grape-e" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F5F0FF" />
          <stop offset="100%" stopColor="#E2D6F8" />
        </radialGradient>
      </defs>

      {/* 그림자 */}
      <ellipse cx={55} cy={172} rx={32} ry={5} fill="#2D7A2D" opacity="0.15" />

      {/* 줄기 — 굵고 유기적 */}
      <path
        d="M 50,78 Q 48,100 46,130 Q 45,150 43,170 L 66,170 Q 64,150 63,130 Q 62,100 60,78 Z"
        fill="url(#t-trunk)"
      />
      {/* 줄기 나무결 */}
      <path d="M 52,82 Q 50,120 47,155" stroke="#4A2A12" strokeWidth="0.7" fill="none" opacity="0.2" />
      <path d="M 58,82 Q 59,125 62,158" stroke="#4A2A12" strokeWidth="0.5" fill="none" opacity="0.15" />
      {/* 나무 혹 */}
      <ellipse cx={48} cy={120} rx={3.5} ry={5} fill="#6B4A2A" opacity="0.4" />

      {/* 가지 */}
      <path d="M 50,95 Q 36,82 25,76" stroke="#6B4A2A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 60,90 Q 74,78 88,72" stroke="#6B4A2A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 52,108 Q 38,100 28,98" stroke="#6B4A2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 58,104 Q 72,96 82,94" stroke="#6B4A2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* 뒤쪽 잎 레이어 (어두운) */}
      <ellipse cx={55} cy={52} rx={48} ry={42} fill="url(#t-leaf-dark)" opacity="0.3" />
      <circle cx={22} cy={56} r={20} fill="url(#t-leaf-dark)" opacity="0.35" />
      <circle cx={88} cy={54} r={19} fill="url(#t-leaf-dark)" opacity="0.35" />
      <circle cx={55} cy={28} r={18} fill="url(#t-leaf-dark)" opacity="0.3" />

      {/* 중간 잎 레이어 */}
      <circle cx={35} cy={42} r={22} fill="url(#t-leaf-mid)" opacity="0.55" />
      <circle cx={75} cy={40} r={21} fill="url(#t-leaf-mid)" opacity="0.55" />
      <circle cx={55} cy={35} r={24} fill="url(#t-leaf-mid)" opacity="0.45" />
      <circle cx={18} cy={62} r={16} fill="url(#t-leaf-mid)" opacity="0.45" />
      <circle cx={92} cy={60} r={15} fill="url(#t-leaf-mid)" opacity="0.45" />

      {/* 앞쪽 잎 레이어 (밝은) */}
      <circle cx={30} cy={52} r={18} fill="url(#t-leaf-light)" opacity="0.5" />
      <circle cx={55} cy={45} r={20} fill="url(#t-leaf-light)" opacity="0.4" />
      <circle cx={80} cy={50} r={17} fill="url(#t-leaf-light)" opacity="0.5" />
      <circle cx={42} cy={70} r={15} fill="url(#t-leaf-light)" opacity="0.45" />
      <circle cx={68} cy={68} r={16} fill="url(#t-leaf-light)" opacity="0.45" />
      <circle cx={55} cy={22} r={14} fill="url(#t-leaf-light)" opacity="0.35" />

      {/* 하이라이트 잎 점 */}
      <circle cx={28} cy={36} r={4} fill="#A8E8A8" opacity="0.4" />
      <circle cx={72} cy={32} r={3.5} fill="#A8E8A8" opacity="0.35" />
      <circle cx={50} cy={20} r={3} fill="#B8F0B8" opacity="0.3" />

      {/* 잎 끝 장식 */}
      <path d="M 5,55 Q -2,44 6,40 Q 12,48 5,55 Z" fill="#4CAF4C" opacity="0.5" />
      <path d="M 105,50 Q 112,40 108,35 Q 102,42 105,50 Z" fill="#4CAF4C" opacity="0.45" />
      <path d="M 55,10 Q 51,0 58,2 Q 60,10 55,10 Z" fill="#6BC46B" opacity="0.35" />
      <path d="M 12,72 Q 4,66 8,60 Q 15,65 12,72 Z" fill="#4CAF4C" opacity="0.35" />
      <path d="M 98,68 Q 106,62 103,56 Q 96,62 98,68 Z" fill="#4CAF4C" opacity="0.35" />

      {/* 포도송이 */}
      {bunchPositions.map((pos, i) => {
        const filled = i < bunchCount;
        const gf = filled ? "url(#t-grape-f)" : "url(#t-grape-e)";
        return (
          <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
            <line x1={0} y1={-7} x2={0} y2={-3} stroke="#3D7A3D" strokeWidth={1.2} opacity={0.5} />
            <circle cx={0} cy={-1} r={4.5} fill={gf} />
            <circle cx={-4.5} cy={4} r={4.5} fill={gf} />
            <circle cx={4.5} cy={4} r={4.5} fill={gf} />
            <circle cx={-2} cy={9} r={4} fill={gf} />
            <circle cx={2} cy={9} r={4} fill={gf} />
            {filled && (
              <>
                <circle cx={-1.5} cy={-3} r={1.3} fill="white" opacity="0.3" />
                <circle cx={-6} cy={2.5} r={1.2} fill="white" opacity="0.25" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
