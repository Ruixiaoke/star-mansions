/**
 * 塔罗牌库骨架（78 张 · 固定顺序 · docs/prd/tarot-prd.md §5.1）。
 *
 * 本文件只放牌的「身份」：编号 / 中英名 / 大小阿卡纳 / 花色 / 位阶，**不含任何释义文案**——
 * 释义在 `data/tarot-readings.ts`，按本仓「定表 / 释义分文件」的既有做法拆开
 * （同 `data/xiu.ts` ↔ `data/readings.ts`）。
 *
 * ⚠️ `id` 是**牌库内部编号**（1–78，大阿卡纳 0→21 在前，再 权杖→圣杯→宝剑→星币、每花色 A→King），
 *    与用户输入的数字（洗牌后的**位置序号**）不是一回事，不得混用（PRD §5.1）。
 */

export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";
/** 宫廷位阶（PRD §5.1）。 */
export type CourtRank = "page" | "knight" | "queen" | "king";
/** 点数（大阿卡纳 0–21；小阿卡纳 A=1 … 10）或宫廷位阶（PRD §9.1）。 */
export type Rank = number | CourtRank;

/**
 * 牌的朝向（PRD §11）。放在牌库这一层，`data/` 与 `lib/` 都能引用而不产生循环依赖
 * （`lib/tarot.ts` 依赖 `data/tarot-readings.ts` 的模板，反向不能再依赖 lib）。
 */
export type Orientation = "upright" | "reversed";

/** 牌的身份字段（PRD §11 `TarotCard` 去掉释义部分的那一半）。 */
export interface TarotCardBase {
  id: number;
  nameZh: string;
  nameEn: string;
  arcana: Arcana;
  suit?: Suit;
  rank?: Rank;
}

/** 宫廷牌判定（综合解读的「宫廷牌数量」维度要用，PRD §9.3）。 */
export function isCourtRank(rank: Rank | undefined): boolean {
  return typeof rank === "string";
}

/**
 * 花色的展示元数据。`glyph` 是**中性的花色符号**（PRD §12）——
 * 刻意用单个汉字而非 ♠♥♣♦：后者在部分系统会被当 emoji 上色，
 * 逆位又只允许旋转装饰层，带色符号会破坏「正逆视觉权重相当」。
 */
export const SUIT_META: Record<Suit, { nameZh: string; nameEn: string; glyph: string }> = {
  wands: { nameZh: "权杖", nameEn: "Wands", glyph: "杖" },
  cups: { nameZh: "圣杯", nameEn: "Cups", glyph: "杯" },
  swords: { nameZh: "宝剑", nameEn: "Swords", glyph: "剑" },
  pentacles: { nameZh: "星币", nameEn: "Pentacles", glyph: "币" },
};

/** 花色在牌库里的固定次序（PRD §5.1）。 */
export const SUIT_ORDER: Suit[] = ["wands", "cups", "swords", "pentacles"];

/**
 * 大阿卡纳 22 张，索引即编号 0–21（韦特体系：8 力量、11 正义）。
 *
 * ⚠️ 中文译名以 PRD §5.1 那套为**内部标准**，两处消歧务必守住：
 *    - **III The Empress = 女皇**，宫廷牌 **Queen = 王后** —— 中文维基两者都作「皇后」，同屏会打架。
 *    - IV The Emperor = 皇帝，与 King = 国王 同理分开。
 * ⚠️ 英文取**今日 RWS 通行名**；韦特原书用词不同（VIII 作 Fortitude、XX 作 The Last Judgment，
 *    且愚者编号写作 Zero、排在 20 与 21 之间）。从原书誊录释义时按本表的位置对齐，别按原书排序，
 *    见 `docs/external/tarot-rws-meanings.md`。
 */
const MAJORS: { zh: string; en: string }[] = [
  { zh: "愚者", en: "The Fool" },
  { zh: "魔术师", en: "The Magician" },
  { zh: "女祭司", en: "The High Priestess" },
  { zh: "女皇", en: "The Empress" }, // 不是「皇后」——「王后」留给 Queen（见上方消歧）
  { zh: "皇帝", en: "The Emperor" },
  { zh: "教皇", en: "The Hierophant" },
  { zh: "恋人", en: "The Lovers" },
  { zh: "战车", en: "The Chariot" },
  { zh: "力量", en: "Strength" },
  { zh: "隐士", en: "The Hermit" },
  { zh: "命运之轮", en: "Wheel of Fortune" },
  { zh: "正义", en: "Justice" },
  { zh: "倒吊人", en: "The Hanged Man" },
  { zh: "死神", en: "Death" },
  { zh: "节制", en: "Temperance" },
  { zh: "恶魔", en: "The Devil" },
  { zh: "塔", en: "The Tower" },
  { zh: "星星", en: "The Star" },
  { zh: "月亮", en: "The Moon" },
  { zh: "太阳", en: "The Sun" },
  { zh: "审判", en: "Judgement" },
  { zh: "世界", en: "The World" },
];

/** 每花色 14 张的固定次序：A、2–10、侍者、骑士、王后、国王（PRD §5.1）。 */
const MINOR_RANKS: { rank: Rank; zh: string; en: string }[] = [
  { rank: 1, zh: "一", en: "Ace" },
  { rank: 2, zh: "二", en: "Two" },
  { rank: 3, zh: "三", en: "Three" },
  { rank: 4, zh: "四", en: "Four" },
  { rank: 5, zh: "五", en: "Five" },
  { rank: 6, zh: "六", en: "Six" },
  { rank: 7, zh: "七", en: "Seven" },
  { rank: 8, zh: "八", en: "Eight" },
  { rank: 9, zh: "九", en: "Nine" },
  { rank: 10, zh: "十", en: "Ten" },
  { rank: "page", zh: "侍者", en: "Page" },
  { rank: "knight", zh: "骑士", en: "Knight" },
  { rank: "queen", zh: "王后", en: "Queen" },
  { rank: "king", zh: "国王", en: "King" },
];

const MAJOR_COUNT = MAJORS.length;

/**
 * 78 张牌库。顺序与 `id` 由上面两张定表推导——顺序固定、`id` 稳定，
 * 改动定表即改动 `id`，届时须同步 `data/tarot-readings.ts` 的按 id 索引。
 */
export const TAROT_DECK: TarotCardBase[] = [
  ...MAJORS.map((m, i) => ({
    id: i + 1,
    nameZh: m.zh,
    nameEn: m.en,
    arcana: "major" as const,
    rank: i,
  })),
  ...SUIT_ORDER.flatMap((suit, s) =>
    MINOR_RANKS.map((r, k) => ({
      id: MAJOR_COUNT + s * MINOR_RANKS.length + k + 1,
      nameZh: `${SUIT_META[suit].nameZh}${r.zh}`,
      nameEn: `${r.en} of ${SUIT_META[suit].nameEn}`,
      arcana: "minor" as const,
      suit,
      rank: r.rank,
    })),
  ),
];

/** 牌库张数（78）。用户输入的数字上限、洗牌长度都取这里，不写死。 */
export const DECK_SIZE = TAROT_DECK.length;

/** 按牌库编号取牌（1-indexed）。 */
export function cardBaseById(id: number): TarotCardBase {
  return TAROT_DECK[id - 1];
}
