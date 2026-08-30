import { trigramByLines, type TrigramLines } from "../data/trigrams";
import { YAO_COUNT, YAO_META, YAO_POSITION_NAMES, type Yao, type YaoPosition } from "../lib/liuyao";

/**
 * 卦象图（六爻 PRD §4 卦象区 / §13 无障碍 · 产物 C4）。
 *
 * 三条硬约束：
 * 1. **自下而上**：数据是初→上（下标 0 = 初爻 = 最下），显示是上→初 —— 显示顺序反转是排版，
 *    数据顺序**不许反**（PRD §5.3）。这里只在渲染时 `[...group].reverse()`，不动传进来的数组。
 * 2. **每一爻都有文字可读版**：读屏念得出「初爻 · 单（少阳）· 静」，不能只有视觉线条（§13）。
 *    文字是**可见文字**而不是 `aria-label`，视力正常的人也照样看得见。
 * 3. **动爻标记不只靠颜色**：金色之外同时给符号（重 ○ / 交 ×）与「动」字（§13）。
 *
 * 掷卦途中传进来的 `yaos` 可以不足六爻，未掷的位置画虚线占位 —— 让用户一开始就预期到要掷六次
 * （PRD §4「卦象区在第一掷之前显示六个空位」）。
 */

/** 内外卦分组。`positions` 按初→上，显示时再反转（PRD §5.3：1–3 掷内卦，4–6 掷外卦）。 */
const GROUPS = [
  { key: "upper", label: "外卦 · 上卦", note: "第 4–6 掷", positions: [4, 5, 6] as YaoPosition[] },
  { key: "lower", label: "内卦 · 下卦", note: "第 1–3 掷", positions: [1, 2, 3] as YaoPosition[] },
] as const;

interface GuaChartProps {
  /** 六爻，**初→上**；长度可以是 0–6（掷卦途中）。 */
  yaos: readonly Yao[];
  /** 图的可读标题，如「本卦卦象」「之卦卦象」。 */
  label: string;
}

/** 一爻的文字读法（可见 + 读屏共用）。 */
function yaoText(position: YaoPosition, yao: Yao | undefined): string {
  const name = `${YAO_POSITION_NAMES[position - 1]}爻`;
  if (!yao) return `${name} · 未掷`;
  const meta = YAO_META[yao.value];
  return `${name} · ${meta.name}（${meta.alias}）· ${yao.isMoving ? "动" : "静"}`;
}

/** 爻线：阳一段、阴两段、未掷画虚线占位。纯装饰，文字读法在同一行的 `__state` 里。 */
function YaoLine({ yao }: { yao: Yao | undefined }) {
  if (!yao) {
    return (
      <span className="gua-chart__line" aria-hidden="true">
        <span className="gua-chart__seg gua-chart__seg--pending" />
      </span>
    );
  }
  const segments = yao.yinYang === "yang" ? 1 : 2;
  return (
    <span className="gua-chart__line" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="gua-chart__seg" />
      ))}
    </span>
  );
}

/**
 * 取某一爻；还没掷到返回 `undefined`。
 * 掷卦是逐次追加的，所以「掷到第几爻」= 数组长度 —— 按长度判断，不去和 `undefined` 比对象。
 */
function yaoAt(yaos: readonly Yao[], position: YaoPosition): Yao | undefined {
  return position <= yaos.length ? yaos[position - 1] : undefined;
}

/** 一组三爻齐了才报经卦名；不齐时留空，不猜。 */
function trigramNameOf(yaos: readonly Yao[], positions: readonly YaoPosition[]): string | null {
  const [a, b, c] = positions.map((p) => yaoAt(yaos, p));
  if (!a || !b || !c) return null;
  const lines: TrigramLines = [a.yinYang, b.yinYang, c.yinYang];
  const trigram = trigramByLines(lines);
  return `${trigram.symbol} ${trigram.name}（${trigram.nature}）`;
}

export function GuaChart({ yaos, label }: GuaChartProps) {
  const tossed = yaos.length;

  return (
    <figure className="gua-chart" aria-label={label}>
      <figcaption className="gua-chart__caption">
        {label} · 自下而上共六爻（已成 {tossed} / {YAO_COUNT}）
      </figcaption>

      {GROUPS.map((group) => {
        const trigramName = trigramNameOf(yaos, group.positions);
        return (
          <section className="gua-chart__group" key={group.key}>
            {/* 分组标题写成 <p> 而不是 <h4>：它是子列表的说明文字，不是文档结构标题。
                写成 h4 会在「卦象区」（前面只有 h2）造成 h2 → h4 跳级，读屏按标题跳转时出现断层。 */}
            <p className="gua-chart__group-label">
              {group.label} · {group.note}
              {trigramName && <span className="gua-chart__trigram">{trigramName}</span>}
            </p>
            <ul className="gua-chart__rows">
              {/* 显示上→初：反转的是这份切片，传进来的数组不动 */}
              {[...group.positions].reverse().map((position) => {
                const yao = yaoAt(yaos, position);
                return (
                  <li className="gua-chart__row" key={position} data-moving={yao?.isMoving ? "true" : undefined}>
                    <span className="gua-chart__mark" aria-hidden="true">
                      {yao?.isMoving ? YAO_META[yao.value].symbol : ""}
                    </span>
                    <YaoLine yao={yao} />
                    <span className="gua-chart__state">{yaoText(position, yao)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </figure>
  );
}
