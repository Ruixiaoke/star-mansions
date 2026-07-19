/**
 * 星图展示 —— scaffold 占位。
 * PRD §10：星图按「装饰 / 示意」处理，不宣称天文精确。正式版接 AI 生成图 / 真实星表坐标。
 */
export function StarMap({ label }: { label: string }) {
  // 简单的示意星点（装饰性，非真实星官坐标）
  const dots = [
    [20, 30],
    [45, 18],
    [70, 40],
    [55, 62],
    [30, 70],
    [80, 72],
  ];
  return (
    <div className="starmap" role="img" aria-label={`${label} 星图（示意占位）`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {dots.map(([cx, cy], i) => {
          const next = dots[(i + 1) % dots.length];
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={next[0]} y2={next[1]} className="starmap__line" />
              <circle cx={cx} cy={cy} r={2.4} className="starmap__dot" />
            </g>
          );
        })}
      </svg>
      <span className="starmap__note">星图 · 示意占位</span>
    </div>
  );
}
