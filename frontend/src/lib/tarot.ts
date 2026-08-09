/**
 * 三张牌塔罗的纯逻辑（docs/prd/tarot-prd.md §6–§9）：洗牌 / 定正逆 / 输入校验 / 抽牌 / 综合解读规则。
 * 与 UI 解耦——页面只负责渲染，便于单测与复核（同 `lib/arithmetic.ts` 的分法）。
 *
 * 三条最容易做错、务必守住的规则：
 *   1. 洗牌用 Fisher–Yates + `crypto.getRandomValues`，**禁止** `sort(() => Math.random() - 0.5)`（PRD §6.1）。
 *   2. 牌序与全部 78 张的正逆在**用户报数之前**一次定死；抽牌阶段只按位置取，**不二次掷骰**（PRD §6.1 / §6.4）。
 *   3. 不做任何「兜底修正」（不避免三张全逆、不保证至少一张大阿卡纳）——随机就是随机（PRD §6.1）。
 */

import {
  DECK_SIZE,
  SUIT_ORDER,
  TAROT_DECK,
  cardBaseById,
  isCourtRank,
  type Orientation,
  type Suit,
  type TarotCardBase,
} from "../data/tarot-deck";
import {
  SUMMARY_TEMPLATES,
  readingsFor,
  type PositionalReading,
  type ReversedReading,
  type SuitBucket,
  type SummaryCount,
  type TarotCardReadings,
  type UprightReading,
} from "../data/tarot-readings";

export { DECK_SIZE };
export type { Orientation };

/** 三元组：三个输入框 / 三张牌，长度恒为 3。 */
export type Triple<T> = [T, T, T];

/** 一张牌的完整形态 = 身份 + 释义（PRD §11 `TarotCard`）。 */
export type TarotCard = TarotCardBase & TarotCardReadings;

/** 洗好的一副牌（PRD §11 `DeckOrder`）。生成后只读。 */
export interface DeckOrder {
  shuffleCode: string;
  /** `order[i]` = 第 i+1 个位置上的牌 id。 */
  order: number[];
  /** `orientations[i]` = 第 i+1 个位置上那张牌的朝向，与 `order` 等长且一一对应。 */
  orientations: Orientation[];
}

/** 用户报的三个数字（PRD §11 `DrawInput`），均为 1–78 且互不相同。 */
export interface DrawInput {
  n1: number;
  n2: number;
  n3: number;
}

export type PositionIndex = 1 | 2 | 3;

export interface DrawPick {
  position: PositionIndex;
  inputNumber: number;
  card: TarotCard;
  orientation: Orientation;
}

/** 一次抽牌的结果（PRD §11 `DrawResult`）。 */
export interface DrawResult {
  shuffleCode: string;
  picks: Triple<DrawPick>;
  summary: string;
}

/** 三张牌阵的位置定义（PRD §8 / §4）；位置含义写死，不让用户选，正逆位也不改变它。 */
export interface PositionMeta {
  index: PositionIndex;
  key: keyof PositionalReading;
  name: string;
  hint: string;
  inputLabel: string;
  /**
   * 位置框架句（**引擎层 / 规则层**，非内容层 —— PRD §9.4 明确归属，不得混淆）。
   * 逆位不写三段位置化，只给一段与位置无关的 `reversedLens`，位置感由这句话带出：
   * `frame + reversedLens` 拼成该位置的呈现文字。
   * 文字取自 PRD §9.4 的表；位置 3 写成「值得留意的是」这类**倾向**句式，
   * §8 / §9.4「不得写成未来断言」这条纪律因此由引擎兜住，不指望每条内容都自觉。
   */
  frame: string;
}

export const POSITIONS: Triple<PositionMeta> = [
  {
    index: 1,
    key: "past",
    name: "过去 · 背景",
    hint: "是什么把你带到了现在这个位置",
    inputLabel: "第一个数字（过去）",
    frame: "回头看这一段——",
  },
  {
    index: 2,
    key: "present",
    name: "现在 · 现状",
    hint: "你此刻正处在什么状态里",
    inputLabel: "第二个数字（现在）",
    frame: "就眼下的状态——",
  },
  {
    index: 3,
    key: "guidance",
    // 这一张叫「指引」不叫「结果」：文案一律写成倾向 / 提醒 / 反问（PRD §8 / §9.4）
    name: "指引 · 走向",
    hint: "如果顺着现在这样走下去，值得留意什么",
    inputLabel: "第三个数字（指引）",
    frame: "就这件事往下走，值得留意的是——",
  },
];

// ───────────────────────── 随机源 ─────────────────────────

/**
 * 从 `crypto.getRandomValues` 批量取随机数的取数器：一次填满缓冲区、逐个消费、用完再填。
 * 洗一次牌要 77 + 78 次取数，逐次调用会白白挨系统调用（大样本单测尤其明显）。
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

/**
 * 取 `[0, maxExclusive)` 内的均匀整数。用拒绝采样砍掉尾巴上那段不满一轮的区间，
 * 直接取模会让小数字略多（模偏差），会污染 PRD §15 的分布断言。
 */
function randomIndex(next: () => number, maxExclusive: number): number {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  let v = next();
  while (v >= limit) v = next();
  return v % maxExclusive;
}

// ───────────────────────── 洗牌 / 定正逆 ─────────────────────────

const CODE_LENGTH = 6;
const CODE_SPACE = 36 ** CODE_LENGTH;

/**
 * 把牌序 + 全部朝向压成一个 6 位短码（FNV-1a）。同一副牌必得同一码，码变了 = 这副牌动过。
 * 仅供 UI 展示与人工核对，不含任何用户信息、不上报（PRD §6.2）；
 * 6 位 36 进制约 2.2e9 种，不承担唯一性保证。
 */
export function shuffleCodeOf(order: readonly number[], orientations: readonly Orientation[]): string {
  const serialized = order.map((id, i) => `${id}${orientations[i] === "reversed" ? "r" : "u"}`).join(",");
  let h = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    h ^= serialized.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % CODE_SPACE).toString(36).toUpperCase().padStart(CODE_LENGTH, "0");
}

/**
 * 洗一副新牌：Fisher–Yates 排定牌序，再对 78 个位置**逐一独立**掷定朝向
 * （50/50，不做配额、不与牌序相关，PRD §6.3）。
 */
export function shuffle(): DeckOrder {
  const next = createRandomSource();

  const order = TAROT_DECK.map((card) => card.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomIndex(next, i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }

  // u32 的最低位本身就是均匀的 0/1，正好当 50/50 的一次掷骰
  const orientations: Orientation[] = order.map(() => ((next() & 1) === 0 ? "upright" : "reversed"));

  return { shuffleCode: shuffleCodeOf(order, orientations), order, orientations };
}

// ───────────────────────── 输入校验（PRD §7）─────────────────────────

type NumberErrorKind = "empty" | "decimal" | "invalid" | "range";

type ParseNumberResult = { ok: true; value: number } | { ok: false; error: NumberErrorKind };

export interface DrawErrors {
  /** 逐框错误文案，无错为 null（PRD §7.2「每个输入框显示自己的错误」）。 */
  fields: Triple<string | null>;
  /** 表单级错误，目前只有「数字重复」（PRD §7.2）。 */
  form: string | null;
  /** 该标成错误态的输入框——含被「重复」牵连的那几个。 */
  flagged: Triple<boolean>;
}

export type ParseDrawResult = { ok: true; input: DrawInput } | { ok: false; errors: DrawErrors };

const INTEGER_RE = /^[+-]?\d+$/;
const DECIMAL_RE = /^[+-]?(?:\d+\.\d*|\.\d+)$/;

/** 全角符号 → 半角（全角数字另走码位偏移）。 */
const FULLWIDTH_SIGN: Record<string, string> = { "＋": "+", "－": "-", "−": "-", "．": "." };

/** 序数词：错误文案里的「第 N 个数字」与输入框标签口径一致（PRD §7.3）。 */
const ORDINALS: Triple<string> = ["一", "二", "三"];

const DUPLICATE_MESSAGE = "三个数字不能重复，同一张牌不会被翻两次";

/** 归一化：trim 前后空格（含全角空格），中文输入法常打出的全角数字 / 符号折成半角（PRD §7.1-5）。 */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[＋－−．]/g, (c) => FULLWIDTH_SIGN[c]);
}

/** 解析单个数字输入：区分「空 / 小数 / 非法 / 越界」四类（PRD §7.3）；前导零照收（`007` → 7）。 */
function parseNumberInput(raw: string): ParseNumberResult {
  const s = normalize(raw);
  if (s === "") return { ok: false, error: "empty" };
  if (INTEGER_RE.test(s)) {
    const value = Number(s);
    if (value < 1 || value > DECK_SIZE) return { ok: false, error: "range" };
    return { ok: true, value };
  }
  if (DECIMAL_RE.test(s)) return { ok: false, error: "decimal" };
  return { ok: false, error: "invalid" };
}

/** 错误文案（PRD §7.3 表格逐字对应）。 */
export function errorMessage(index: number, error: NumberErrorKind): string {
  switch (error) {
    case "empty":
      return `请填写第${ORDINALS[index]}个数字`;
    case "decimal":
      return "请输入整数，不支持小数";
    case "invalid":
      return `请输入 1–${DECK_SIZE} 之间的整数`;
    case "range":
      return `数字要在 1–${DECK_SIZE} 之间`;
  }
}

/**
 * 提交时的统一校验入口（PRD §7.2）：三个都合法且互不重复才放行。
 * 校验失败只返回错误，**不动已有结果**——页面负责保留上一次的合法结果。
 */
export function parseDrawInput(raw: Triple<string>): ParseDrawResult {
  const [p1, p2, p3] = raw.map(parseNumberInput) as Triple<ParseNumberResult>;
  const parsed: Triple<ParseNumberResult> = [p1, p2, p3];

  const fields = parsed.map((p, i) => (p.ok ? null : errorMessage(i, p.error))) as Triple<string | null>;
  const flagged = fields.map((f) => f !== null) as Triple<boolean>;

  // 重复只在两边都解析成功时判定；命中则出表单级错误，并把涉及的两个框一起标错误态（PRD §7.2）
  let form: string | null = null;
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const a = parsed[i];
      const b = parsed[j];
      if (a.ok && b.ok && a.value === b.value) {
        form = DUPLICATE_MESSAGE;
        flagged[i] = true;
        flagged[j] = true;
      }
    }
  }

  if (p1.ok && p2.ok && p3.ok && form === null) {
    return { ok: true, input: { n1: p1.value, n2: p2.value, n3: p3.value } };
  }
  return { ok: false, errors: { fields, form, flagged } };
}

/** 用户一改某框就撤掉它的报错（PRD §7.2）；被「重复」牵连时连表单级错误一起撤。 */
export function clearFieldError(errors: DrawErrors, index: number): DrawErrors {
  const fields = [...errors.fields] as Triple<string | null>;
  const flagged = [...errors.flagged] as Triple<boolean>;
  const wasDuplicate = errors.form !== null && flagged[index];
  fields[index] = null;
  flagged[index] = false;
  return {
    fields,
    flagged: wasDuplicate ? ([false, false, false] as Triple<boolean>) : flagged,
    form: wasDuplicate ? null : errors.form,
  };
}

// ───────────────────────── 抽牌（PRD §6.4）─────────────────────────

/** 取一张完整的牌 = 牌库身份 + 释义（未定稿的牌走占位兜底）。 */
export function cardOf(id: number): TarotCard {
  return { ...cardBaseById(id), ...readingsFor(id) };
}

/**
 * 按朝向取这张牌的内容。正逆结构**刻意不对称**（PRD v0.3 §9.1），
 * 但两边都有 `sourceQuote` / `keywords` / `meaning`，页面可直接取这三项。
 */
export type OrientedView = UprightReading | ReversedReading;

export function readingOf(pick: DrawPick): OrientedView {
  return pick.orientation === "upright" ? pick.card.upright : pick.card.reversed;
}

/**
 * 这张牌在它所在位置上的呈现文字：
 *   - 正位 → 内容层写好的三段位置化解读之一；
 *   - 逆位 → **引擎的位置框架句 + 内容层的「逆位视角」**拼接（逆位不写三段位置化，PRD v0.3 §9.1）。
 * 拼接发生在规则层，内容层因此不必为三个位置各写一遍逆位文案。
 */
export function positionalText(pick: DrawPick): string {
  const meta = POSITIONS[pick.position - 1];
  if (pick.orientation === "upright") return pick.card.upright.byPosition[meta.key];
  return `${meta.frame}${pick.card.reversed.reversedLens}`;
}

/**
 * 按用户报的三个数字翻牌：数字 = 洗好后牌堆的位置序号（1-indexed），按输入顺序对上位置 1/2/3，
 * **不排序、不去重后重排**；朝向直接取洗牌时定好的那一个，**不二次掷骰**（PRD §6.4）。
 *
 * 前置条件：`input` 已过 `parseDrawInput`（1–78、互不相同）。
 */
export function drawCards(deck: DeckOrder, input: DrawInput): DrawResult {
  const numbers: Triple<number> = [input.n1, input.n2, input.n3];
  const picks = numbers.map((n, i) => ({
    position: POSITIONS[i].index,
    inputNumber: n,
    card: cardOf(deck.order[n - 1]),
    orientation: deck.orientations[n - 1],
  })) as Triple<DrawPick>;

  return { shuffleCode: deck.shuffleCode, picks, summary: buildSummary(picks) };
}

// ───────────────────────── 综合解读（PRD §9.3）─────────────────────────

/**
 * 模板填充：只认 `{cards}` 一个变量；替换完把任何残留的 `{...}` 抹掉——
 * 未知占位符属于文案 bug，但绝不能让它上屏（PRD §9.3 / §15「不出现模板占位符」）。
 */
function fillTemplate(template: string, picks: readonly DrawPick[]): string {
  return template
    .replace(/\{cards\}/g, picks.map((p) => p.card.nameZh).join("、"))
    .replace(/\{[a-zA-Z]+\}/g, "");
}

/** 三张牌里最多只有 3 张，档位天然落在 0–3。 */
function bucket(n: number): SummaryCount {
  return n as SummaryCount;
}

/** 花色是否集中：三张小阿卡纳里有某个花色占到 2 张及以上就算集中。 */
function dominantSuit(minors: readonly DrawPick[]): Suit | null {
  return SUIT_ORDER.find((suit) => minors.filter((p) => p.card.suit === suit).length >= 2) ?? null;
}

/**
 * 按 大阿卡纳数量 / 花色分布 / 宫廷牌数量 / 逆位数量 四个维度挑模板，拼成 3–5 句。
 * 四个维度都是穷尽的（0–3 档 + 花色三种归类），任何抽牌组合——含三张全正、三张全逆——
 * 都能拼出完整文案，不留空段落（PRD §9.3）。
 */
export function buildSummary(picks: readonly DrawPick[]): string {
  const majors = picks.filter((p) => p.card.arcana === "major");
  const minors = picks.filter((p) => p.card.arcana === "minor");
  const courts = picks.filter((p) => isCourtRank(p.card.rank));
  const reversed = picks.filter((p) => p.orientation === "reversed");

  const focused = dominantSuit(minors);
  const suitKey: SuitBucket = focused ?? (minors.length > 0 ? "mixed" : "none");
  const suitPicks = focused ? minors.filter((p) => p.card.suit === focused) : minors;

  return [
    fillTemplate(SUMMARY_TEMPLATES.major[bucket(majors.length)], majors),
    fillTemplate(SUMMARY_TEMPLATES.suit[suitKey], suitPicks),
    fillTemplate(SUMMARY_TEMPLATES.court[bucket(courts.length)], courts),
    fillTemplate(SUMMARY_TEMPLATES.reversed[bucket(reversed.length)], reversed),
    SUMMARY_TEMPLATES.closing,
  ]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join("");
}
