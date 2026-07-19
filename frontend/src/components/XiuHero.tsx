import type { ComputeResponse } from "../types/contract";
import { StarMap } from "./StarMap";

/** 结果页顶部形象区（PRD §6）——本命宿大字 + 四象 + 星图。 */
export function XiuHero({ resp }: { resp: ComputeResponse }) {
  const b = resp.benming;
  return (
    <header className="hero-result" data-xiang={b.siXiang}>
      <div className="hero-result__map">
        <StarMap label={b.fullName} />
      </div>
      <div className="hero-result__meta">
        <p className="hero-result__xiang">
          {b.direction}
          {b.siXiang}
        </p>
        <h1 className="hero-result__char">{b.fullName}</h1>
        <p className="hero-result__sub">
          宿 {b.xiu} · 七政 {b.zheng} · {b.animal}
        </p>
        <p className="hero-result__date">
          公历 {resp.solarDate} · {resp.lunarDate}
          {resp.timeZhi ? ` · ${resp.timeZhi}时` : ""}
        </p>
      </div>
    </header>
  );
}
