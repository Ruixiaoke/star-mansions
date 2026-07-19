import type { ComputeResponse } from "../types/contract";

/** 可分享的结果卡片 —— scaffold 占位（PRD §6）。正式版支持截图 / 导出。 */
export function ResultCard({ resp }: { resp: ComputeResponse }) {
  const b = resp.benming;
  return (
    <div className="result-card" data-xiang={b.siXiang}>
      <p className="result-card__label">我的本命宿</p>
      <p className="result-card__char">{b.fullName}</p>
      <p className="result-card__sub">
        {b.direction}
        {b.siXiang} · 公历 {resp.solarDate}
      </p>
      <p className="result-card__note">分享卡片（占位）</p>
    </div>
  );
}
