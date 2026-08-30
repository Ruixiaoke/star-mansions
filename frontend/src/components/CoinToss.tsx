import { YAO_COUNT, YAO_META, YAO_POSITION_NAMES, type CoinFace, type Toss } from "../lib/liuyao";

/**
 * 掷币区（六爻 PRD §4 掷币区 / §13 无障碍 · 产物 C4）。
 *
 * 三条硬约束，改这个组件前先看清楚：
 * 1. **每一掷都由用户主动点击触发**，本组件只暴露一个「掷币」按钮 —— 引擎也刻意没有
 *    「一键掷完六次」的函数（PRD §3 流程铁律 2 / §17）。
 * 2. **未选所问事项不许掷**：按钮 `disabled` 且给出可读原因（PRD §16-22）；
 *    掷满六次同样 `disabled`，并有可读的状态说明（§16-24 / §13）。
 * 3. **铜钱正反不能只靠图形**：每枚都带可见汉字（背 / 字）+ `aria-label`（§13 无障碍）；
 *    翻动动画只是装饰，`prefers-reduced-motion` 开启时直接落定（CSS 侧，设计宪法 §4-4）。
 */

/** 钱面 → 可见汉字。本项目取「背为阳」（PRD D6），异说注文由页面给出，不在这里重复。 */
const FACE_LABEL: Record<CoinFace, string> = { back: "背", char: "字" };
/** 钱面 → 读屏用的完整说法。 */
const FACE_ARIA: Record<CoinFace, string> = { back: "背面", char: "字面" };

/** 尚未掷过时三枚钱的占位字（读屏由容器的 `aria-label` 交代，故本身 `aria-hidden`）。 */
const COIN_PLACEHOLDER = "？";

interface CoinTossProps {
  /** 已掷次数 0–6。 */
  count: number;
  /** 最近一掷；尚未掷过为 `null`。 */
  last: Toss | null;
  /** 按钮是否停用（未选所问事项 / 已掷满）。 */
  disabled: boolean;
  /** 停用原因；`null` = 可掷。可读文字，不是 title 提示。 */
  disabledReason: string | null;
  onToss: () => void;
}

/** 一枚铜钱。`key` 由外层按掷次给，换掷次即重挂载 → 翻动动画重新播。 */
function Coin({ index, face }: { index: number; face: CoinFace | null }) {
  return (
    <span
      className="liuyao-coin"
      data-face={face ?? "none"}
      aria-label={face ? `第 ${index} 枚铜钱：${FACE_ARIA[face]}` : `第 ${index} 枚铜钱：尚未掷出`}
      role="img"
    >
      <span aria-hidden="true">{face ? FACE_LABEL[face] : COIN_PLACEHOLDER}</span>
    </span>
  );
}

/** 一掷的文字读法：三枚钱面 + 爻数 + 爻象名 + 动静（读屏念得出，PRD §13）。 */
function tossReadout(toss: Toss): string {
  const meta = YAO_META[toss.value];
  const faces = toss.coins.map((face) => FACE_LABEL[face]).join(" ");
  const position = YAO_POSITION_NAMES[toss.index - 1];
  return `第 ${toss.index} 掷（${position}爻）：${faces} · ${toss.value} ${meta.name}（${meta.alias}）· ${
    meta.isMoving ? "动爻" : "静爻"
  }`;
}

export function CoinToss({ count, last, disabled, disabledReason, onToss }: CoinTossProps) {
  const done = count >= YAO_COUNT;
  const nextIndex = count + 1;
  // 第 1–3 掷成内卦、第 4–6 掷成外卦（PRD §5.3，原文「自下而上，三掷内卦成」）
  const nextPart = count < 3 ? "内卦（下卦）" : "外卦（上卦）";

  return (
    <section className="panel liuyao__toss">
      <h2 className="section-h">掷币</h2>

      <div className="liuyao__coins" aria-label="三枚铜钱" role="group">
        {[0, 1, 2].map((i) => (
          <Coin key={`${count}-${i}`} index={i + 1} face={last ? last.coins[i] : null} />
        ))}
      </div>

      <button type="button" className="cta liuyao__toss-btn" onClick={onToss} disabled={disabled}>
        {count === 0 ? "掷币" : done ? "已掷满六次" : `掷第 ${nextIndex} 次`}
      </button>

      {/* 进度与结果都在同一个 live 区里播报：掷完一次，读屏能听到掷出了什么、下一掷是第几掷 */}
      <div className="liuyao__toss-status" aria-live="polite">
        <p className="liuyao__progress">
          {done
            ? `六掷已毕（${YAO_COUNT} / ${YAO_COUNT}），卦已成，掷币按钮已停用。`
            : `进度 ${count} / ${YAO_COUNT} —— 下一掷是第 ${nextIndex} 掷 · ${nextPart}`}
        </p>
        {last && <p className="liuyao__readout">{tossReadout(last)}</p>}
        {/* 原文在内卦成后有「再祝」一节，此处对应地给一句过渡提示（PRD §3 ③ / §5.3） */}
        {count === 3 && <p className="liuyao__transition">内卦（下三爻）已成，接着再掷三次求外卦，合成一卦。</p>}
      </div>

      {disabledReason && <p className="liuyao__toss-hint">{disabledReason}</p>}
    </section>
  );
}
