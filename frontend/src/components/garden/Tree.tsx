interface TreeProps {
  bunchCount: number;
}

export default function Tree({ bunchCount }: TreeProps) {
  // 나무에 매달린 미니 포도송이 위치 (수관 안에 유기적으로 배치)
  const bunchPositions = [
    { x: 35, y: 35 }, { x: 82, y: 32 },
    { x: 22, y: 55 }, { x: 58, y: 48 }, { x: 92, y: 52 },
    { x: 30, y: 75 }, { x: 70, y: 72 },
    { x: 45, y: 90 }, { x: 78, y: 88 },
    { x: 58, y: 102 },
  ];

  return (
    <svg viewBox="0 0 120 220" className="h-full w-full">
      <defs>
        {/* 나무줄기 그라데이션 */}
        <linearGradient id="trunk-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="30%" stopColor="#92400E" />
          <stop offset="70%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        {/* 수관 그라데이션 */}
        <radialGradient id="canopy-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#86EFAC" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#4ADE80" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#22C55E" stopOpacity={0.25} />
        </radialGradient>
        {/* 잎 그라데이션 */}
        <linearGradient id="tree-leaf-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        {/* 미니 포도송이 그라데이션 */}
        <radialGradient id="mini-bunch-filled" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <radialGradient id="mini-bunch-empty" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </radialGradient>
      </defs>

      {/* 나무줄기 - 아래로 약간 넓어지는 형태 */}
      <path
        d="M 55,95 Q 54,140 50,200 L 68,200 Q 64,140 63,95 Z"
        fill="url(#trunk-grad)"
      />
      {/* 줄기 나무결 텍스처 */}
      <path d="M 57,100 Q 56,150 54,190" stroke="#78350F" strokeWidth={0.5} fill="none" opacity={0.3} />
      <path d="M 61,100 Q 62,155 63,195" stroke="#78350F" strokeWidth={0.5} fill="none" opacity={0.2} />

      {/* 수관 (둥근 나뭇잎 영역) - 레이어드 */}
      <ellipse cx={58} cy={65} rx={52} ry={48} fill="url(#canopy-grad)" />
      <ellipse cx={50} cy={58} rx={35} ry={32} fill="#4ADE80" opacity={0.15} />
      <ellipse cx={70} cy={70} rx={30} ry={28} fill="#22C55E" opacity={0.12} />

      {/* 잎 장식들 (수관 가장자리에 포인트) */}
      <path d="M 10,60 Q 4,50 12,45 Q 18,52 10,60 Z" fill="url(#tree-leaf-1)" opacity={0.7} />
      <path d="M 105,55 Q 112,45 108,40 Q 100,46 105,55 Z" fill="url(#tree-leaf-1)" opacity={0.6} />
      <path d="M 25,28 Q 18,18 26,14 Q 32,22 25,28 Z" fill="#22C55E" opacity={0.5} />
      <path d="M 88,25 Q 96,16 92,12 Q 84,18 88,25 Z" fill="#16A34A" opacity={0.5} />
      <path d="M 55,18 Q 52,8 60,10 Q 62,18 55,18 Z" fill="#4ADE80" opacity={0.4} />

      {/* 미니 포도송이들 (나무에 매달린 열매) */}
      {bunchPositions.map((pos, i) => {
        const filled = i < bunchCount;
        return (
          <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
            {/* 줄기 연결선 */}
            <line x1={0} y1={-6} x2={0} y2={-2} stroke="#15803D" strokeWidth={1} opacity={0.6} />
            {/* 미니 송이 (3알 삼각형) */}
            <circle cx={-3} cy={0} r={4} fill={filled ? "url(#mini-bunch-filled)" : "url(#mini-bunch-empty)"} />
            <circle cx={3} cy={0} r={4} fill={filled ? "url(#mini-bunch-filled)" : "url(#mini-bunch-empty)"} />
            <circle cx={0} cy={5.5} r={4} fill={filled ? "url(#mini-bunch-filled)" : "url(#mini-bunch-empty)"} />
            {/* 하이라이트 */}
            {filled && <circle cx={-4} cy={-1.5} r={1.2} fill="white" opacity={0.35} />}
          </g>
        );
      })}

      {/* 땅 / 풀 */}
      <ellipse cx={58} cy={204} rx={40} ry={6} fill="#86EFAC" opacity={0.3} />
    </svg>
  );
}
