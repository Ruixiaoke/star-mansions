/**
 * 六爻（金钱卦）起卦的纯逻辑（docs/prd/liuyao-prd.md §5 / 考据卡片 docs/external/liuyao-tradition.md §1–§4）：
 * 随机源 / 掷币 / 成卦 / 动爻 / 之卦 / 卦码。与 UI 解耦——页面只负责渲染，便于单测与复核
 * （同 `lib/tarot.ts`、`lib/arithmetic.ts` 的分法）。
 *
 * 七条最容易做错、务必守住的规则（每条 PRD 里都有原文出处，不得自由发挥）：
 *   1. 随机走 `crypto.getRandomValues`，**禁止**用 `Math` 的内置伪随机；三枚铜钱**各自独立**掷定、每枚 50/50，
 *      不写成「三枚联合查表」——独立同分布是这套算法的前提，查表会掩盖 bug（PRD §5.1）。
 *   2. **爻数 = 6 + 背面枚数**（本项目取「背为阳」，D6）：0 背→6 交 / 1 背→7 单 / 2 背→8 拆 / 3 背→9 重。
 *      原文「一背为单画 ⚊，二背为拆画 ⚋，三背为重画 ○，纯字为交画 ×」（《古今图书集成》卷 544）。
 *   3. **六掷自下而上**：第 1 掷 = 初爻（最下），第 6 掷 = 上爻；1–3 掷成内卦（下卦），4–6 掷成外卦（上卦）。
 *      原文「自下而上，三掷内卦成……再求外象三爻，以成一卦」。
 *   4. 先天序 = `1 + binary(初→上，阳 0 阴 1)`，初爻为最高位（实现在 `data/trigrams.ts`）。
 *   5. **重变为拆，交变为单**（老阳 9 变阴、老阴 6 变阳；少阳 7 少阴 8 不变）；
 *      **无动爻时之卦为 `null`**，不造「同上」的空壳（PRD §5.4）。
 *   6. 卦码 = 六个爻数（初→上）拼成如 `"987678"`，且能**往返还原**整卦（PRD §5.5）。
 *   7. **禁止任何「兜底修正」**：不避免六爻全静（17.8% 会发生，让它发生）、不保证至少一个动爻、
 *      不回避特定卦——随机就是随机，「让结果好看一点」= 悄悄伪造占卜结果（PRD §5.1）。
 *
 * ⚠️ 命名陷阱（PRD §5.3）：八卦另有一套「乾=老阳、坎艮震=少阳……」的分类，**与爻的 6/7/8/9 老少毫无关系**。
 *    因此爻的动静一律写 `yao.isMoving`，**不许出现无前缀的「老阳 / 少阴」式布尔命名**；爻象别名（老阳 / 少阴 …）
 *    只作 `YAO_META.alias` 的展示用字，不参与任何判定。
 *
 * ⚠️ 本文件**不做断卦**：不取用神 / 世应 / 六亲 / 六神，也不替用户挑「该看哪条爻辞」（PRD D5 / D7 / §7.3）。
 */

import {
  trigramByLines,
  type Trigram,
  type TrigramOrder,
  type YinYang,
} from "../data/trigrams";

export type { Trigram, TrigramOrder, YinYang };

/** 六元组：六掷 / 六爻，长度恒为 6（同 `lib/tarot.ts` 的 `Triple<T>`）。 */
export type Six<T> = [T, T, T, T, T, T];

/** 一卦六爻。掷够 6 次才成卦，页面不许提前出结果（PRD §16-24）。 */
export const YAO_COUNT = 6;

// ───────────────────────── 爻象定表（PRD §5.2）─────────────────────────

/**
 * 单枚铜钱的一面：背 / 字。本项目取**「背为阳」**（D6，实务手册《卜筮全书》即此，口诀「总背是重安」）。
 *
 * ⚠️ 古籍对「钱之何面为阳」另有异说（储泳《祛疑说》：「自昔以钱之有字者为阴，无字者为阳……未知孰是」），
 *    页面须注明。**工程影响为零**：两种约定下四种爻象的概率分布对称，换约定只是把「背」「字」两字对调；
 *    不做用户可切换的开关（PRD §5.2 / §17）。
 */
export type CoinFace = "back" | "char";

/** 一掷三枚。 */
export type Coins = readonly [CoinFace, CoinFace, CoinFace];

/** 爻数：6 交 / 7 单 / 8 拆 / 9 重。 */
export type YaoValue = 6 | 7 | 8 | 9;

/** 爻位：1 = 初爻（最下），6 = 上爻（最上）。 */
export type YaoPosition = 1 | 2 | 3 | 4 | 5 | 6;

/** 一掷的结果（PRD §10 `Toss`）。 */
export interface Toss {
  /** 第几掷 = 第几爻（初→上）。 */
  index: YaoPosition;
  coins: Coins;
  /** 爻数 = 6 + 背面枚数。 */
  value: YaoValue;
}

/**
 * 一爻（PRD §10 `Yao`）。
 * ⚠️ 字段名与 PRD 草案的两处出入（本仓 camelCase 惯例 + §5.3 命名陷阱）：
 * `yin_yang` → `yinYang`、`moving` → `isMoving`。页面与后端 payload 按本文件为准。
 */
export interface Yao {
  position: YaoPosition;
  value: YaoValue;
  yinYang: YinYang;
  /** 动否：6 交 / 9 重 为动。只用 `isMoving`，**不许写成无前缀的「老阳」布尔**（§5.3 陷阱）。 */
  isMoving: boolean;
}

/** 一种爻象的定表条目。 */
export interface YaoMeta {
  value: YaoValue;
  /** 爻象名：单 / 拆 / 重 / 交（《古今图书集成》卷 544〈以钱代蓍画法〉）。 */
  name: string;
  /** 别名：少阳 / 少阴 / 老阳 / 老阴（《火珠林》「单为少阳，拆为少阴，重为太阳，交为太阴」）。 */
  alias: string;
  /** 画法符号：⚊ 单 / ⚋ 拆 / ○ 重 / × 交（原文用字）。 */
  symbol: string;
  yinYang: YinYang;
  isMoving: boolean;
  /** 背面枚数 0–3，= `value - 6`。留字段是为了页面能把「三枚里几枚背」讲清楚。 */
  backs: 0 | 1 | 2 | 3;
}

/** 四种爻象定表（PRD §5.2 表格逐行对应）。概率：6 与 9 各 1/8，7 与 8 各 3/8。 */
export const YAO_META: Record<YaoValue, YaoMeta> = {
  6: { value: 6, name: "交", alias: "老阴", symbol: "×", yinYang: "yin", isMoving: true, backs: 0 },
  7: { value: 7, name: "单", alias: "少阳", symbol: "⚊", yinYang: "yang", isMoving: false, backs: 1 },
  8: { value: 8, name: "拆", alias: "少阴", symbol: "⚋", yinYang: "yin", isMoving: false, backs: 2 },
  9: { value: 9, name: "重", alias: "老阳", symbol: "○", yinYang: "yang", isMoving: true, backs: 3 },
};

/** 爻位名，下标 0 = 初爻（传统称「初」与「上」，中间四爻直接叫二三四五）。 */
export const YAO_POSITION_NAMES: Six<string> = ["初", "二", "三", "四", "五", "上"];

/** 一爻的动变：**「重变为拆，交变为单」**（卷 544 原文）——9→8、6→7；少阳 7 少阴 8 不变。 */
const CHANGED_VALUE: Record<YaoValue, YaoValue> = { 6: 7, 7: 7, 8: 8, 9: 8 };

// ───────────────────────── 随机源（PRD §5.1）─────────────────────────

/**
 * 从 `crypto.getRandomValues` 批量取随机数的取数器：一次填满缓冲区、逐个消费、用完再填
 * （同 `lib/tarot.ts`；逐次调用会白白挨系统调用，大样本分布单测尤其明显）。
 */
function createRandomSource(): () => number {
  const buf = new Uint32Array(64);
  let i = buf.length;
  return () => {
    if (i >= buf.length) {
      crypto.getRandomValues(buf);
      i = 0;
    }
    return buf[i++];
  };
}

/** 模块级取数器：掷币是逐次点击触发的，共用一个缓冲区即可（首次调用时才填，import 无副作用）。 */
const nextRandom = createRandomSource();

/** 掷一枚：u32 的最低位本身就是均匀的 0/1，正好当一次 50/50。 */
function flipCoin(): CoinFace {
  return (nextRandom() & 1) === 1 ? "back" : "char";
}

// ───────────────────────── 掷币 → 爻（PRD §5.2）─────────────────────────

/** 爻数 = 6 + 背面枚数。 */
export function yaoValueOf(coins: Coins): YaoValue {
  return (6 + coins.filter((face) => face === "back").length) as YaoValue;
}

/**
 * 掷一次三枚铜钱 → 一爻。**三枚各自独立**掷定，不联合查表、不做任何兜底修正（PRD §5.1）。
 * 每一掷都由用户主动点击触发，引擎不提供「一键掷完六次」（PRD §3 流程铁律 2 / §17）。
 */
export function tossOnce(index: YaoPosition): Toss {
  const coins: Coins = [flipCoin(), flipCoin(), flipCoin()];
  return { index, coins, value: yaoValueOf(coins) };
}

/** 由爻位 + 爻数取一爻（阴阳与动否全查 `YAO_META`，不另行判断）。 */
export function yaoFromValue(position: YaoPosition, value: YaoValue): Yao {
  const meta = YAO_META[value];
  return { position, value, yinYang: meta.yinYang, isMoving: meta.isMoving };
}

/** 一掷 → 一爻：第 N 掷就是第 N 爻，**自下而上**（PRD §5.3）。 */
export function yaoFromToss(toss: Toss): Yao {
  return yaoFromValue(toss.index, toss.value);
}

/** 一爻动变后的爻数：重（9）变拆（8）、交（6）变单（7）；7 / 8 原样返回。 */
export function changedValueOf(value: YaoValue): YaoValue {
  return CHANGED_VALUE[value];
}

// ───────────────────────── 六爻 → 一卦（PRD §5.3 / §5.5）─────────────────────────

/**
 * 一卦的卦象层：六爻 + 内外卦 + 卦码。本卦与之卦复用同一结构。
 * 卦名 / 卦序 / 卦辞爻辞属 64 卦静态表，见文件末尾的 TODO。
 */
export interface GuaShape {
  /** 六爻，**初→上**（下标 0 = 初爻 = 最下）。 */
  yaos: Six<Yao>;
  /** 卦码，如 `"987678"`（六个爻数，初→上）。 */
  code: string;
  /** 内卦（下卦）= 初 / 二 / 三爻。 */
  lower: Trigram;
  /** 外卦（上卦）= 四 / 五 / 上爻。 */
  upper: Trigram;
}

/** 一次起卦的卦象结果（PRD §10 `Divination` 去掉 `topic` / `createdAt` / 64 卦身份的那一半）。 */
export interface Casting {
  /** 本卦。 */
  primary: GuaShape;
  /** 之卦；**无动爻时为 `null`**——不造「同上」的空壳，页面据此隐藏之卦板块（PRD §5.4 / §16-6）。 */
  changed: GuaShape | null;
  /** 动爻位置（初=1 … 上=6），可为空数组。 */
  movingPositions: YaoPosition[];
}

/** 卦码格式：六个 6–9 的数字。 */
const GUA_CODE_RE = /^[6-9]{6}$/;

/** 六爻 → 卦码（初→上）。 */
export function guaCodeOf(yaos: readonly Yao[]): string {
  return yaos.map((yao) => yao.value).join("");
}

/** 取三爻的阴阳，供查经卦用。 */
function linesOf(yaos: readonly Yao[]): [YinYang, YinYang, YinYang] {
  return [yaos[0].yinYang, yaos[1].yinYang, yaos[2].yinYang];
}

/** 六爻 → 卦象：内卦取 1/2/3 爻、外卦取 4/5/6 爻（**自下而上**，别反着来）。 */
export function guaShapeOf(yaos: Six<Yao>): GuaShape {
  return {
    yaos,
    code: guaCodeOf(yaos),
    lower: trigramByLines(linesOf(yaos.slice(0, 3))),
    upper: trigramByLines(linesOf(yaos.slice(3, 6))),
  };
}

/** 动爻位置（初→上顺序）。 */
export function movingPositionsOf(yaos: readonly Yao[]): YaoPosition[] {
  return yaos.filter((yao) => yao.isMoving).map((yao) => yao.position);
}

/**
 * 本卦 → 之卦：把所有动爻按「重变为拆，交变为单」翻转。
 * **无动爻则返回 `null`**（PRD §5.4）。之卦六爻恒为 7 / 8，故之卦自身没有动爻。
 */
export function changedShapeOf(shape: GuaShape): GuaShape | null {
  if (movingPositionsOf(shape.yaos).length === 0) return null;
  const yaos = shape.yaos.map((yao) => yaoFromValue(yao.position, changedValueOf(yao.value))) as Six<Yao>;
  return guaShapeOf(yaos);
}

/** 六爻 → 完整卦象结果（本卦 + 之卦 + 动爻位置）。 */
export function castingOf(yaos: Six<Yao>): Casting {
  const primary = guaShapeOf(yaos);
  return {
    primary,
    changed: changedShapeOf(primary),
    movingPositions: movingPositionsOf(yaos),
  };
}

/** 六掷 → 完整卦象结果。第 1 掷即初爻，**掷入顺序就是自下而上的顺序**。 */
export function castingFromTosses(tosses: Six<Toss>): Casting {
  return castingOf(tosses.map(yaoFromToss) as Six<Yao>);
}

/**
 * 卦码 → 六爻（往返还原，PRD §5.5：回看时由卦码还原卦象，**不重新掷**）。
 * 卦码可能来自存档 / 后端，格式不合法一律返回 `null`，不抛、不猜。
 */
export function yaosFromCode(code: string): Six<Yao> | null {
  if (!GUA_CODE_RE.test(code)) return null;
  return [...code].map((digit, i) =>
    yaoFromValue((i + 1) as YaoPosition, Number(digit) as YaoValue),
  ) as Six<Yao>;
}

/** 卦码 → 完整卦象结果；卦码不合法返回 `null`。 */
export function castingFromCode(code: string): Casting | null {
  const yaos = yaosFromCode(code);
  return yaos === null ? null : castingOf(yaos);
}

// ───────────────────────── 64 卦查表（待 `data/gua.ts` 到位）─────────────────────────

/** 查 64 卦表的键：(内卦先天序, 外卦先天序)。64 个组合互异且覆盖 8×8（PRD §6.3）。 */
export interface HexagramKey {
  lower: TrigramOrder;
  upper: TrigramOrder;
}

/** 由卦象取查表键。 */
export function hexagramKeyOf(shape: GuaShape): HexagramKey {
  return { lower: shape.lower.order, upper: shape.upper.order };
}

/**
 * TODO(gua-table)：64 卦静态表 `data/gua.ts` 由数据管线工位并行建，本轮**刻意不 import**（避免撞车）。
 * 表到位后在此接上，签名先定死，页面与单测按这个对接：
 *
 *   import { hexagramByKey } from "../data/gua";
 *   export function hexagramOf(shape: GuaShape): Hexagram   // = hexagramByKey(hexagramKeyOf(shape))
 *
 * 接上后的完整结果（PRD §10 `Divination`）= `Casting` + `topic` + `createdAt` +
 * `primary` / `changed` 的 64 卦身份，其中 **`changed` 恒随 `Casting.changed` 一起为 `null`**。
 * `topic`（所问事项）属 `data/liuyao-topics.ts`，另一工位，本文件不定义、不引用。
 *
 * ⚠️ 接表时仍不得替用户取断（PRD D5）：只并列给出本卦卦辞 / 各动爻爻辞 / 之卦卦辞，
 *    不写「所以该看第 X 爻」「以之卦为断」。
 */
