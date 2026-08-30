/**
 * 八经卦定表（8 条 · docs/prd/liuyao-prd.md §5.3 · 考据卡片 docs/external/liuyao-tradition.md §9）。
 *
 * 本文件只放经卦的「定表」：先天序 / 卦名 / 卦符 / 三爻阴阳 / 自然象 / 五行 / 卦德 / 家人 / 动物 / 身体，
 * **不含任何释义、白话或吉凶文案**——那属编写层，按本仓「定表 / 释义分文件」的既有做法拆开
 * （同 `data/tarot-deck.ts` ↔ `data/tarot-readings.ts`、`data/xiu.ts` ↔ `data/readings.ts`）。
 *
 * 📚 逐栏出处（PRD §5.3 逐栏出处行 / 卡片 §9.1 出处表；源 URL 见卡片来源清单）：
 *   - 卦德 —《说卦》第七章「乾，健也。坤，顺也。震，动也。巽，入也。坎，陷也。离，丽也。艮，止也。兑，说也。」
 *   - 动物 —《说卦》第八章「乾为马，坤为牛，震为龙，巽为鸡，坎为豕，离为雉，艮为狗，兑为羊。」
 *   - 身体 —《说卦》第九章「乾为首，坤为腹，震为足，巽为股，坎为耳，离为目，艮为手，兑为口。」
 *   - 家人 —《说卦》第十章「乾……故称乎父；坤……故称乎母；震一索而得男，故谓之长男……兑三索而得女，故谓之少女。」
 *   - 自然象 —《说卦》第十一章「乾为天……坤为地……震为雷……巽为木、为风……坎为水……离为火……艮为山……兑为泽」
 *   - 三爻阴阳 —《卜筮全书·八卦象例》「乾三连 ☰、坤六断 ☷、震仰盂 ☳、艮覆碗 ☶、离中虚 ☲、坎中满 ☵、兑上缺 ☱、巽下断 ☴」
 *   - 卦符 — Unicode U+2630–U+2637（TRIGRAM FOR HEAVEN … FOR EARTH），**码位顺序即先天序**
 *   - 先天序 —《卜筮全书·八卦次序》「乾一、兑二、离三、震四、巽五、坎六、艮七、坤八」（《梅花易数》卷一〈周易卦数〉同）
 *   - 五行 —《卜筮全书·八宫所属》「乾兑属金，震巽属木，坎属水，离属火，坤艮属土」（《梅花易数》卷一，二源一致）
 *
 * ⚠️ **方位刻意不进本表**（PRD §5.3）：《说卦》第五章只明给 6 个后天方位，**坤、兑两个没给**
 *    （坤=西南 / 兑=西 是《梅花易数》补的）；先天方位不见经文、是邵雍所立（黄宗羲《易学象数论》）。
 *    六爻断卦用不到方位，进了模型只会诱人误用。日后若要加：字段名必须叫 `houtianDirection`，
 *    **不许用含糊的 `direction`**，且坤 / 兑两条须分栏记来源。
 * ⚠️ 五行取**京房八宫所属**，不是通行本卦序推出来的；本期不做纳甲（PRD D7），
 *    五行**只用于白话里的意象描述，不做任何生克断语**。
 * ⚠️ **两个「老少」不是一回事**（PRD §5.3 实现陷阱）：《卜筮全书·系辞八卦象类歌》另给八卦分过
 *    「乾=老阳、坎艮震=少阳、坤=老阴、离兑巽=少阴」，与**爻**的 6/7/8/9 老少毫无关系。
 *    本表**刻意不收这一栏**，从源头上避免两套「老阳 / 少阴」同屏打架；日后确需表达时字段名写
 *    `category`，且不得与 `lib/liuyao.ts` 的爻象名混用。
 */

/** 爻的阴阳。放在定表这一层，`data/` 与 `lib/` 都能引用而不产生循环依赖（同 `data/tarot-deck.ts` 的 `Orientation`）。 */
export type YinYang = "yang" | "yin";

/** 一个经卦的三爻，**初→上**（下标 0 = 最下那一爻）。 */
export type TrigramLines = readonly [YinYang, YinYang, YinYang];

/** 先天序 1–8：乾一、兑二、离三、震四、巽五、坎六、艮七、坤八。 */
export type TrigramOrder = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** 一个经卦（PRD §10 `Trigram` 的超集——§10 只列了前五栏，D2 要求另含《说卦》四栏 + 三爻阴阳）。 */
export interface Trigram {
  /** 先天序 1–8。 */
  order: TrigramOrder;
  /** 卦名：乾 / 兑 / 离 / 震 / 巽 / 坎 / 艮 / 坤。 */
  name: string;
  /** 卦符 ☰☱☲☳☴☵☶☷（U+2630–U+2637）。 */
  symbol: string;
  /** 三爻阴阳，初→上。 */
  lines: TrigramLines;
  /** 自然象（《说卦》十一章）：天 / 泽 / 火 / 雷 / 风 / 水 / 山 / 地。用于卦名与白话取象。 */
  nature: string;
  /** 五行（京房八宫所属）：仅供意象描述，**不做生克**。 */
  wuxing: string;
  /** 卦德（《说卦》七章）：健 / 说 / 丽 / 动 / 入 / 陷 / 止 / 顺。 */
  virtue: string;
  /** 家人象（《说卦》十章）。 */
  family: string;
  /** 动物象（《说卦》八章）。 */
  animal: string;
  /** 身体象（《说卦》九章）。 */
  body: string;
}

/**
 * 八经卦，**下标 = 先天序 − 1**（即数组顺序就是乾兑离震巽坎艮坤）。
 *
 * 机器核对（考据卡片 §9.1）：`先天序 == 1 + binary(初→上，阳记 0、阴记 1)`，**8/8 一致**，
 * 初爻为最高位——`trigramOrderOf()` 就是这条恒等式的实现，改表须重跑该核对。
 */
export const TRIGRAMS: readonly Trigram[] = [
  { order: 1, name: "乾", symbol: "☰", lines: ["yang", "yang", "yang"], nature: "天", wuxing: "金", virtue: "健", family: "父", animal: "马", body: "首" },
  { order: 2, name: "兑", symbol: "☱", lines: ["yang", "yang", "yin"], nature: "泽", wuxing: "金", virtue: "说", family: "少女", animal: "羊", body: "口" },
  { order: 3, name: "离", symbol: "☲", lines: ["yang", "yin", "yang"], nature: "火", wuxing: "火", virtue: "丽", family: "中女", animal: "雉", body: "目" },
  { order: 4, name: "震", symbol: "☳", lines: ["yang", "yin", "yin"], nature: "雷", wuxing: "木", virtue: "动", family: "长男", animal: "龙", body: "足" },
  { order: 5, name: "巽", symbol: "☴", lines: ["yin", "yang", "yang"], nature: "风", wuxing: "木", virtue: "入", family: "长女", animal: "鸡", body: "股" },
  { order: 6, name: "坎", symbol: "☵", lines: ["yin", "yang", "yin"], nature: "水", wuxing: "水", virtue: "陷", family: "中男", animal: "豕", body: "耳" },
  { order: 7, name: "艮", symbol: "☶", lines: ["yin", "yin", "yang"], nature: "山", wuxing: "土", virtue: "止", family: "少男", animal: "狗", body: "手" },
  { order: 8, name: "坤", symbol: "☷", lines: ["yin", "yin", "yin"], nature: "地", wuxing: "土", virtue: "顺", family: "母", animal: "牛", body: "腹" },
];

/** 经卦个数（8）。查表边界取这里，不写死。 */
export const TRIGRAM_COUNT = TRIGRAMS.length;

/**
 * 三爻阴阳 → 先天序：`1 + binary(初→上，阳记 0、阴记 1)`，**初爻为最高位**（PRD §5.3）。
 * 例：兑 = 阳阳阴 → 001₂ = 1 → 序 2；巽 = 阴阳阳 → 100₂ = 4 → 序 5。
 */
export function trigramOrderOf(lines: TrigramLines): TrigramOrder {
  const bits = lines.reduce((acc, line) => (acc << 1) | (line === "yin" ? 1 : 0), 0);
  return (bits + 1) as TrigramOrder;
}

/** 按先天序取经卦（1-indexed）。 */
export function trigramByOrder(order: TrigramOrder): Trigram {
  return TRIGRAMS[order - 1];
}

/** 由三爻阴阳（初→上）取经卦——起卦时内卦取 1/2/3 爻、外卦取 4/5/6 爻。 */
export function trigramByLines(lines: TrigramLines): Trigram {
  return trigramByOrder(trigramOrderOf(lines));
}
