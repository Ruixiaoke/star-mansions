import type { SiXiang } from "../types/contract";

/** 星宿名徽标 —— 挂 data-xiang，取四象色 var(--xiang)（不硬编码四色）。 */
export function XiuBadge({ label, siXiang }: { label: string; siXiang: SiXiang }) {
  return (
    <span className="badge" data-xiang={siXiang}>
      {label}
    </span>
  );
}
