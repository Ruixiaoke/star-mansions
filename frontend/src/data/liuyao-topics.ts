/**
 * 「所问事项」分类 + 视角提示的框架句（`docs/prd/liuyao-prd.md` §7.1 / §8.3 · 产物 C3 + D4）。
 *
 * 本文件属**编写层**（与 `data/gua-readings.ts` 同层）：分类的**骨架**有典籍出处，
 * 但每条的产品措辞与框架句是**本项目编写**，不是典籍原文。页面须按 PRD §8 双层分区块呈现。
 *
 * ── 两档来源，权威等级**必须如实标注**（PRD §7.1 / §16-18）─────────────────
 *   Tier A（`zhouli`）—《周礼·春官宗伯·大卜》「以邦事作龟之八命：一曰征，二曰象，三曰与，
 *     四曰谋，五曰果，六曰至，七曰雨，八曰瘳。**以八命者赞三兆、三易、三梦之占**。」
 *     原文明说这套分类同样用于**《易》占**，不限龟卜——这正是采它作骨架的理由。
 *     逐条训诂据宋·易祓《周官总义》卷十五。（`象` `雨` 属天象类，现代产品略去。）
 *   Tier B（`meihua`）—《梅花易数》〈八卦万物属类〉的现成问事类目（求名 / 求利 · 交易 / 婚姻）。
 *     ⚠️ 该书**托名邵雍、序为传奇故事、不入四库**（考据实测：检索无提要条目）。
 *     引用一律写「据《梅花易数》（传邵雍撰，明清流传本）」，
 *     **不得与《易传》并称「经典」**，页面必须把这条降级标注显示出来。
 *
 * ── 🚩 绝不可暗示的一件事（PRD §7.1 🚩 / 考据卡片 §6.1）────────────────────
 *   八命是 8 条、经卦是 8 个——**纯属巧合**。遍查**没有任何典籍把两者配对**。
 *   因此本文件**刻意不给分类任何序号字段**：`LIUYAO_TOPICS` 的数组下标**只是下拉框的呈现顺序**，
 *   不得与经卦先天序相联、不得与八经卦并排编号展示、不得写「八命应八卦」。
 *   若日后有人想做这个对应，那是**新造的规则**，必须先取证（铁律 §0-2）。
 *
 * ── 明确排除的三类（PRD D9 / §7.1「明确不做的三类」）────────────────────────
 *   PRD 台账 D9 列出的三个类目**本表一律不含**（其中一类直接撞铁律 §0-1 的医疗建议红线，
 *   另两类红线词频过高且不适合消费级产品）。要加回去须重新过一轮红线设计，不是顺手补全的事。
 *
 * ── 措辞纪律（PRD §9.1 / §9.3）──────────────────────────────────────────
 *   框架句只描述**处境与视角**，一律走「可以想想……」；
 *   不写「你将会……」「你必须……」，不下判词，不给医疗 / 投资 / 法律 / 关系上的具体行动建议，
 *   不对第三方作任何断言（卦象说不了别人的心思，`relationship` 那条把这点直接写进了正文）。
 */

/** 分类键。Tier A 用八命本字的拼音（与《周礼》原文一一对应），Tier B 用语义键。 */
export type TopicKey =
  | "mou"
  | "yu"
  | "guo"
  | "zhi"
  | "zheng"
  | "career"
  | "wealth"
  | "relationship";

/** 来源档次。`zhouli` = 经文级；`meihua` = 术数流传本，**须降级标注**。 */
export type TopicSourceTier = "zhouli" | "meihua";

/**
 * 两档来源的**可展示**标注文案。页面在分类旁 / 结果区回显时必须显示对应这一条，
 * 不能只在代码里标而页面上不说（PRD §16-18）。
 */
export const TOPIC_SOURCE_NOTES: Record<TopicSourceTier, string> = {
  zhouli: "分类骨架据《周礼·春官·大卜》八命（经文），逐条训诂据宋·易祓《周官总义》卷十五。",
  meihua: "分类据《梅花易数》（传邵雍撰，明清流传本）——术数流传本，权威等级低于经部文献。",
};

/**
 * 框架句里的槽位。引擎按本表替换，**槽位取值一律来自 `data/trigrams.ts` 的《说卦》定表**
 * （自然象 / 卦德），有出处且天然中性（PRD §8.3）。不要自造新槽位而不在这里登记。
 */
export const FRAME_SLOTS = {
  "{lowerNature}": "下卦（内卦）自然象：天 / 地 / 雷 / 风 / 水 / 火 / 山 / 泽",
  "{upperNature}": "上卦（外卦）自然象，取值同上",
  "{lowerVirtue}": "下卦卦德：健 / 顺 / 动 / 入 / 陷 / 丽 / 止 / 说",
  "{upperVirtue}": "上卦卦德，取值同上",
} as const;

/** 一个「所问事项」选项。 */
export interface LiuyaoTopic {
  key: TopicKey;
  /** 下拉框里显示的名称。 */
  label: string;
  /** 一句说明，告诉用户这一项管什么事。 */
  hint: string;
  sourceTier: TopicSourceTier;
  /** = `TOPIC_SOURCE_NOTES[sourceTier]`，冗余存一份是为了页面渲染时不必再查表。 */
  sourceNote: string;
  /**
   * 视角提示的框架句，**含槽位、不是成品句子**（PRD §8.3）。
   * MVP 刻意走「8 条框架句 + 64 段白话」的模板拼接，而不是 64×8 = 512 段手写——
   * 那个量级极易注水，Rick 已按推荐拍板（PRD §23-Q6）。
   */
  frameSentence: string;
}

/**
 * 八个「所问事项」，**数组顺序 = 下拉框呈现顺序**（Tier A 在前、Tier B 在后）。
 * ⚠️ 这个顺序不承载任何含义，**尤其与经卦无关**——见文件头 🚩。
 */
export const LIUYAO_TOPICS: readonly LiuyaoTopic[] = [
  {
    key: "mou",
    label: "谋划 · 一件事的得失",
    hint: "手上有一件事要谋，想看看得与失各在哪一边。",
    sourceTier: "zhouli",
    sourceNote: TOPIC_SOURCE_NOTES.zhouli,
    // 八命「四曰谋」，易祓训「谋决于人而卜其得失」。
    frameSentence:
      "你问的是一件事的得失。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以拿这组象当镜子，想想你要的「得」具体是什么，愿意付的「失」又到哪里为止。",
  },
  {
    key: "yu",
    label: "合作 · 与人共事",
    hint: "事情要和别人一起做，想看看这段共事本身。",
    sourceTier: "zhouli",
    sourceNote: TOPIC_SOURCE_NOTES.zhouli,
    // 八命「三曰与」，易祓训「事与人共而卜其成亏」。
    frameSentence:
      "你问的是与人共事这件事。这一卦下{lowerNature}上{upperNature}，一个{lowerVirtue}、一个{upperVirtue}——可以想想，谁在下面托着、谁在上面带着，各自的位置清不清楚。",
  },
  {
    key: "guo",
    label: "抉择 · 该不该做",
    hint: "在做与不做之间犹豫，想换个角度看看。",
    sourceTier: "zhouli",
    sourceNote: TOPIC_SOURCE_NOTES.zhouli,
    // 八命「五曰果」，易祓训「卜其行之果与否」。
    frameSentence:
      "你问的是做还是不做。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，你犹豫的是能不能做到，还是想不想做。",
  },
  {
    key: "zhi",
    label: "等待 · 悬而未决的事",
    hint: "有一件事悬着，等着一个消息或一个人。",
    sourceTier: "zhouli",
    sourceNote: TOPIC_SOURCE_NOTES.zhouli,
    // 八命「六曰至」，易祓训「卜所俟之至与否」。
    frameSentence:
      "你问的是那件悬着的事。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，这段等待里，哪些是你能动的，哪些只能等。",
  },
  {
    key: "zheng",
    label: "出行 · 远行迁移",
    hint: "要出一趟远门，或是换一个地方。",
    sourceTier: "zhouli",
    sourceNote: TOPIC_SOURCE_NOTES.zhouli,
    // 八命「一曰征」，易祓训「王师出征而卜其久速」。
    frameSentence:
      "你问的是出行远行。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，这一趟要走多久，走之前该先安顿好哪一头。",
  },
  {
    key: "career",
    label: "事业 · 功名",
    hint: "关于手上的事业、职位或名声。",
    sourceTier: "meihua",
    sourceNote: TOPIC_SOURCE_NOTES.meihua,
    // 来源类目：〈八卦万物属类〉「求名」。
    frameSentence:
      "你问的是事业与名声。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，你想要的那个位置，看重的是它带来的东西，还是它本身。",
  },
  {
    key: "wealth",
    label: "财运 · 收益",
    hint: "关于进项、开销或一笔往来。",
    sourceTier: "meihua",
    sourceNote: TOPIC_SOURCE_NOTES.meihua,
    // 来源类目：〈八卦万物属类〉「求利」「交易」。
    // ⚠️ 末句刻意把用户推回真实账目：卦象不是理财依据（铁律 §0-1 / PRD §9.1）。
    frameSentence:
      "你问的是财与收益。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，进与出两头你更清楚哪一头；至于数目本身，还是要拿实际账目去算，卦象算不了。",
  },
  {
    key: "relationship",
    label: "感情 · 关系",
    hint: "关于一段关系里的相处。",
    sourceTier: "meihua",
    sourceNote: TOPIC_SOURCE_NOTES.meihua,
    // 来源类目：〈八卦万物属类〉「婚姻」。
    // ⚠️ 末句是红线兜底：不得对第三方作任何断言（PRD §9.1），所以直接写明卦象说不了别人的心思。
    frameSentence:
      "你问的是感情与关系。这一卦下{lowerNature}上{upperNature}，下之德为{lowerVirtue}、上之德为{upperVirtue}——可以想想，你更想弄清楚的是对方，还是自己在这段关系里的位置；卦象说不了别人的心思，只能给你一个自问的角度。",
  },
];

/** 按键取分类；键不认识时返回 `undefined`（历史记录里可能存着旧键，页面须容错）。 */
export function findTopic(key: string): LiuyaoTopic | undefined {
  return LIUYAO_TOPICS.find((t) => t.key === key);
}

/**
 * 动爻有无的补充框架句（PRD §8.3 的「动爻位置 / 是否有之卦」两个槽位）。
 * 与 8 条类别框架句是**两回事**：这两句与所问事项无关，任何分类都可拼在后面。
 *
 * ⚠️ `moving` 末句是 PRD D5「不代为取断」的落地：古人对「多个动爻看哪一条」有两套互不相容的
 *    主张（朱熹考变占 / 火珠林），本项目两套都不采，只并列呈现。页面另有完整注文，此处是短版。
 */
export const MOVING_FRAMES = {
  /** 六爻皆静时用。 */
  still: "这一卦六爻皆静，没有动爻，也就没有之卦——只此一个象。",
  /** 有动爻时用；`{positions}` = 动爻位置（初 / 二 / 三 / 四 / 五 / 上），由引擎填。 */
  moving:
    "第 {positions} 爻为动爻，本卦由此变出之卦。两个卦象可以对照着看，本页并列呈现，不代为取断哪一个为准。",
} as const;

/**
 * 视角提示的固定收尾——把主动权交回用户（比照 `tarot-readings.ts` 的 `closing`，PRD §9.3）。
 * 这一句不替代结果区的显著免责声明（铁律 §0-1），免责走 `components/Disclaimer.tsx`。
 */
export const TOPIC_CLOSING = "卦只提供一个看事情的角度，怎么选还是你自己说了算。";
