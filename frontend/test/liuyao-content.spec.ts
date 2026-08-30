/**
 * 六爻起卦 —— 内容红线自动化验收（docs/prd/liuyao-prd.md §9/§16 第 9–21 条）。
 *
 * 范围衔接：`test/liuyao.spec.ts` 覆盖 §16 第 1–8 条（引擎 + §6.3 数据门禁）；本文件覆盖
 * §16 第 9–21 条（内容红线）。第 22 条起的流程/交互/后端条目属页面与后端层，`dev-page` 尚在
 * 进行，本轮不测（见交付报告「未验证项」）。
 *
 * 数据来源：本文件**只读取真实导入的运行时对象**（`GUA_READINGS` / `LIUYAO_TOPICS` 等），
 * 不对源码文本做正则扫描——这样注释里出现的「用神」「世爻」「排序」这类反面举例文字
 * （例如 `lib/liuyao.ts` 注释里写「不取用神 / 世应 / 六亲 / 六神」）不会被误判为数据违规，
 * 因为注释在 TS 编译/运行时就已经不存在于任何字符串值里了（同 `tarot-content.spec.ts` 的做法）。
 * 唯一的例外是 §16-21（`isOldYang` 命名扫描）——那条本质是「代码里不该出现这个标识符」，
 * 只能对源码文本做字面量扫描，不是内容/数据问题，单独放在文件末尾并说明理由。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  GUA_READINGS,
  GUA_READINGS_SIGNOFF,
  SHUOGUA_LEXICON,
  type GuaOrder,
} from "../src/data/gua-readings";
import { HEXAGRAMS, hexagramByOrder } from "../src/data/gua";
import { trigramByOrder, type TrigramOrder } from "../src/data/trigrams";
import {
  LIUYAO_TOPICS,
  TOPIC_SOURCE_NOTES,
  MOVING_FRAMES,
  TOPIC_CLOSING,
  type TopicKey,
} from "../src/data/liuyao-topics";

const ALL_ORDERS = Array.from({ length: 64 }, (_, i) => (i + 1) as GuaOrder);

// ───────────────────────── §16-9：未验证（如实说明，不假装测过）─────────────────────────
//
// 「引用层与源逐字一致」要求对着**另一个公版底本**核对（PRD 已改口径：不能只对着同一个维基文库
// 页面核，那只能验出「抄得对」，验不出「源本身对不对」）。本次交付没有第二个公版底本可用，
// 因此本文件**不写这条断言**，在交付报告里明确标「未验证」。写一条自己骗自己的测试
// （比如拿 gua.ts 自己的数据去核对自己）没有意义，反而会造成已验证的假象。

// ───────────────────────── §16-10：编写层黑名单扫描（PRD §9.1/§9.2）─────────────────────────

/**
 * 编写层黑名单——覆盖 PRD §9.1「内容黑名单」+ §9.2「凶字专项纪律」点名的词。
 * 扫描对象是**真实导入的字符串值**，不是源码文本，因此「原文照登」的 `data/gua.ts`
 * （卦辞/爻辞里本就有「凶」）不在本文件的扫描范围内——那是引用层，红线只管编写层（§9.2-3）。
 */
const EDITORIAL_BLACKLIST = [
  "凶",
  "灾",
  "咎",
  "厉",
  "吝", // 原文判词字——编写层不得把这些字翻译成对用户的断语（PRD §9.2-3）
  "破财",
  "必须化解",
  "不化解",
  "转运", // 恐吓 / 诱导付费（铁律 §0-4）
  "注定",
  "一定会",
  "无法改变",
  "命该如此",
  "命中注定", // 命定论措辞（PRD §9.1）
  "死亡",
  "重病",
  "事故", // 灾难化的预言或暗示（PRD §9.1）
  "该分手",
  "该买入",
  "别做手术", // PRD §9.1 原句点名的具体行动建议
  "疾病",
  "官讼",
  "坟墓", // D9 明确不做的三类，编写层同样不该出现
] as const;

/** 六爻编写层目前分布在两个数据文件：64 卦白话疏解 + 8 条问事框架句/收尾语/动爻提示句。 */
function collectEditorialTexts(): Array<[string, string]> {
  const texts: Array<[string, string]> = [];
  for (const order of ALL_ORDERS) {
    texts.push([`GUA_READINGS[${order}].vernacular`, GUA_READINGS[order].vernacular]);
  }
  for (const topic of LIUYAO_TOPICS) {
    texts.push([`LIUYAO_TOPICS[${topic.key}].label`, topic.label]);
    texts.push([`LIUYAO_TOPICS[${topic.key}].hint`, topic.hint]);
    texts.push([`LIUYAO_TOPICS[${topic.key}].frameSentence`, topic.frameSentence]);
    texts.push([`LIUYAO_TOPICS[${topic.key}].sourceNote`, topic.sourceNote]);
  }
  texts.push(["TOPIC_SOURCE_NOTES.zhouli", TOPIC_SOURCE_NOTES.zhouli]);
  texts.push(["TOPIC_SOURCE_NOTES.meihua", TOPIC_SOURCE_NOTES.meihua]);
  texts.push(["MOVING_FRAMES.still", MOVING_FRAMES.still]);
  texts.push(["MOVING_FRAMES.moving", MOVING_FRAMES.moving]);
  texts.push(["TOPIC_CLOSING", TOPIC_CLOSING]);
  return texts;
}

describe("编写层黑名单扫描 — 0 命中（PRD §9.1/§9.2，§16-10）", () => {
  it.each(EDITORIAL_BLACKLIST)('全部编写层字段都不包含 "%s"', (word) => {
    const hits = collectEditorialTexts()
      .filter(([, text]) => text.includes(word))
      .map(([label, text]) => `${label}: "${text}"`);
    expect(hits, `命中 "${word}" 的字段`).toEqual([]);
  });
});

// ───────────────────────── §16-14：无冒充措辞（用神/世爻/六亲/世应/依火珠林断卦）─────────────────────────

describe("数据层无冒充措辞（PRD §7.3，§16-14）", () => {
  const FAKE_TERMS = ["用神", "世爻", "六亲", "世应", "依火珠林断卦", "六神"];

  it("编写层字段（64 卦白话 + 8 条问事文案）不含冒充纳甲断卦的措辞", () => {
    const hits: string[] = [];
    for (const [label, text] of collectEditorialTexts()) {
      for (const term of FAKE_TERMS) {
        if (text.includes(term)) hits.push(`${label} 含 "${term}"`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("引用层字段（64 卦卦辞/爻辞/卦名，均为先秦原文）同样不含这些措辞（纳甲六爻是汉代以后的体系）", () => {
    const hits: string[] = [];
    for (const h of HEXAGRAMS) {
      const fields: Array<[string, string]> = [
        [`order=${h.order}.name`, h.name],
        [`order=${h.order}.guaName`, h.guaName],
        [`order=${h.order}.judgment`, h.judgment],
        ...h.lines.map((l, i): [string, string] => [`order=${h.order}.lines[${i}]`, l]),
      ];
      for (const [label, text] of fields) {
        for (const term of FAKE_TERMS) {
          if (text.includes(term)) hits.push(`${label} 含 "${term}"`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

// ───────────────────────── §16-15/§16-16：注文存在性（数据层可验的那一半）─────────────────────────
//
// 「背为阳」注文、「不代为取断」注文按 PRD §4/§5.2/§5.4 是**页面文案**，本轮页面由 dev-page 负责、
// 尚未完成，因此这两条的「页面上是否真的显示」不在本文件验证范围。但 §5.4 给的「不代为取断」
// 短版文案就落在 `MOVING_FRAMES.moving`（数据层），这一句本文件可以验，顺手验一下。

describe("MOVING_FRAMES.moving — 「不代为取断」落地（PRD §5.4 D5，§16-16 的数据层部分）", () => {
  it("含「不代为取断」字样，且不写「所以该看第 X 爻」「以之卦为断」这类替用户取断的结论", () => {
    const text = MOVING_FRAMES.moving;
    expect(text).toContain("不代为取断");
    expect(text).not.toContain("所以该看");
    expect(text).not.toContain("以之卦为断");
  });
});

// ───────────────────────── §16-17：无「八命对应八卦」的暗示─────────────────────────

describe("无「八命对应八卦」的暗示（PRD §7.1 🚩，§16-17）", () => {
  it("LiuyaoTopic 不携带任何数字序号字段（不与经卦先天序共用编号）", () => {
    for (const topic of LIUYAO_TOPICS) {
      const numericKeys = Object.entries(topic)
        .filter(([, v]) => typeof v === "number")
        .map(([k]) => k);
      expect(numericKeys, `topic=${topic.key} 不应带任何数字字段`).toEqual([]);
    }
  });

  it("编写层字段不出现「八命对应八卦」「八命应八卦」这类暗示句", () => {
    const banned = ["八命对应八卦", "八命应八卦"];
    const hits: string[] = [];
    for (const [label, text] of collectEditorialTexts()) {
      for (const b of banned) {
        if (text.includes(b)) hits.push(`${label} 含 "${b}"`);
      }
    }
    expect(hits).toEqual([]);
  });
});

// ───────────────────────── §16-18：Tier B 三项降级标注 ─────────────────────────

describe("Tier B（《梅花易数》）三项分类的降级标注（PRD §7.1，§16-18）", () => {
  const TIER_B_KEYS: TopicKey[] = ["career", "wealth", "relationship"];

  it("Tier B 三项（事业/财运/感情）sourceTier 确为 meihua，其余五项为 zhouli", () => {
    for (const topic of LIUYAO_TOPICS) {
      const expected = TIER_B_KEYS.includes(topic.key) ? "meihua" : "zhouli";
      expect(topic.sourceTier, `topic=${topic.key}`).toBe(expected);
    }
  });

  it("Tier B 三项的 sourceNote 含「传邵雍撰，明清流传本」降级标注", () => {
    for (const key of TIER_B_KEYS) {
      const topic = LIUYAO_TOPICS.find((t) => t.key === key)!;
      expect(topic.sourceNote, `topic=${key}`).toContain("传邵雍撰，明清流传本");
    }
  });

  it("Tier B 的来源说明不与《易传》并称「经典」（权威等级不得被拉平）", () => {
    expect(TOPIC_SOURCE_NOTES.meihua).not.toContain("经典");
    expect(TOPIC_SOURCE_NOTES.meihua).toContain("权威等级低于经部文献");
  });
});

// ───────────────────────── §16-19：imagerySource 可回溯《说卦》语汇表 ─────────────────────────

/** 巽卦允许用「木」代「风」的五卦（《说卦》十一章「巽为木、为风」，PRD §16-19）。 */
const XUN_WOOD_EXCEPTION_ORDERS = new Set<GuaOrder>([28, 46, 48, 50, 53]); // 大過/升/井/鼎/漸

describe("imagerySource 可回溯《说卦》语汇表（PRD §8.2/§9.2-3，§16-19）", () => {
  const lexiconWords = new Set(Object.keys(SHUOGUA_LEXICON));

  it("每条 imagerySource 的每个词都 ⊆ SHUOGUA_LEXICON（不自造形容词）", () => {
    const offenders: string[] = [];
    for (const order of ALL_ORDERS) {
      for (const word of GUA_READINGS[order].imagerySource) {
        if (!lexiconWords.has(word)) offenders.push(`order=${order} word="${word}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("每条 imagerySource 都含其上下卦各自的自然象 + 卦德（巽卦在指定 5 卦可用「木」代「风」）", () => {
    const offenders: string[] = [];
    for (const order of ALL_ORDERS) {
      const hex = hexagramByOrder(order)!;
      const reading = GUA_READINGS[order];
      const isException = XUN_WOOD_EXCEPTION_ORDERS.has(order);
      for (const trigOrder of [hex.lowerOrder, hex.upperOrder] as TrigramOrder[]) {
        const trig = trigramByOrder(trigOrder);
        const acceptableNature = trig.name === "巽" && isException ? [trig.nature, "木"] : [trig.nature];
        const hasNature = reading.imagerySource.some((w) => acceptableNature.includes(w));
        const hasVirtue = reading.imagerySource.some((w) => w === trig.virtue);
        if (!hasNature) offenders.push(`order=${order} 缺自然象「${acceptableNature.join("/")}」（卦=${trig.name}）`);
        if (!hasVirtue) offenders.push(`order=${order} 缺卦德「${trig.virtue}」（卦=${trig.name}）`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("「木」代「风」只用在 PRD 点名的 5 卦（大過28/升46/井48/鼎50/漸53），其余含巽卦的卦仍用「风」", () => {
    const offenders: string[] = [];
    for (const order of ALL_ORDERS) {
      const hex = hexagramByOrder(order)!;
      const reading = GUA_READINGS[order];
      const involvesXun = hex.lowerOrder === 5 || hex.upperOrder === 5;
      if (!involvesXun) continue;
      const usesWood = reading.imagerySource.includes("木");
      const usesWind = reading.imagerySource.includes("风");
      const isException = XUN_WOOD_EXCEPTION_ORDERS.has(order);
      if (usesWood && !isException) offenders.push(`order=${order} 用了「木」但不在允许的 5 卦名单里`);
      if (!usesWind && !isException) offenders.push(`order=${order} 不在允许名单却缺「风」`);
    }
    expect(offenders).toEqual([]);
  });
});

// ───────────────────────── §16-20：分类清单无疾病/官讼/坟墓 ─────────────────────────

describe("分类清单无「疾病 / 官讼 / 坟墓」（PRD §7.1 / D9，§16-20）", () => {
  it("8 个问事分类的 key/label/hint/sourceNote/frameSentence 均不含这三个词", () => {
    const banned = ["疾病", "官讼", "坟墓"];
    const hits: string[] = [];
    for (const topic of LIUYAO_TOPICS) {
      const fields: Array<[string, string]> = [
        ["key", topic.key],
        ["label", topic.label],
        ["hint", topic.hint],
        ["sourceNote", topic.sourceNote],
        ["frameSentence", topic.frameSentence],
      ];
      for (const [field, text] of fields) {
        for (const b of banned) {
          if (text.includes(b)) hits.push(`topic=${topic.key}.${field} 含 "${b}"`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("分类清单长度恰为 8（PRD §7.1 Tier A 5 项 + Tier B 3 项）", () => {
    expect(LIUYAO_TOPICS).toHaveLength(8);
  });
});

// ───────────────────────── 补充：数据结构自洽（团队交接包点名）─────────────────────────

describe("GUA_READINGS 结构自洽（团队交接包点名的补充断言）", () => {
  it("键集合 == 1..64（无缺卦无多余）", () => {
    const keys = Object.keys(GUA_READINGS)
      .map(Number)
      .sort((a, b) => a - b);
    expect(keys).toEqual(ALL_ORDERS);
  });

  it("每条 order 字段与自己的键一致（防「键 5 存了 order 6 的内容」这种错位）", () => {
    for (const order of ALL_ORDERS) {
      expect(GUA_READINGS[order].order, `key=${order}`).toBe(order);
    }
  });

  it("每条 nameHint 严格 === 对应 gua.ts 的 name（防「配错卦」的错位，团队交接包点名的原始口径）", () => {
    // ⚠️ 复核记录：这条断言曾短暂弱化成「nameHint 包含 gua.ts 的 guaName」——起因是首版
    // `nameHint` 用繁体（如「乾為天」）而 `gua.ts.name` 是简体（如「乾为天」），严格相等在
    // 48/64 条上失败。team-lead 复核判定**这确实是缺陷**（只是根因在时序：`gua-readings.ts`
    // 写在「`name` 改简体」的裁决之前，两边错开了），要求**修根因、不迁就**——已派 dev-content
    // 把 64 条 nameHint 改成简体、与 gua.ts.name 逐字对齐，本断言相应收回严格相等。
    // 断言强度是资产，弱化后不该长期停留在弱化状态；此处即为收紧回来的记录。
    for (const order of ALL_ORDERS) {
      const hex = hexagramByOrder(order)!;
      expect(GUA_READINGS[order].nameHint, `order=${order}`).toBe(hex.name);
    }
  });

  it("64 段全部 placeholder === false（PRD 状态：64 段已全部写出、零占位）", () => {
    for (const order of ALL_ORDERS) {
      expect(GUA_READINGS[order].placeholder, `order=${order}`).toBe(false);
    }
  });

  // PRD §16-11 的人工签字已完成（Rick 2026-08-30，PR #18；复核范围与旁证见
  // `gua-readings.ts` 里 GUA_READINGS_SIGNOFF 上方的签字记录）。
  // 这条断言从 false 翻到 true 是**一次有据可查的状态变更**，不是把测试改绿：
  // 它继续钉住「这个标志不许被随手改动」——日后若有人大改文案却不重新签字，
  // 应当先把它改回 false，那时这条会红，提醒他补签。
  it("GUA_READINGS_SIGNOFF === true（PRD §16-11 人工逐条签字已完成，见 gua-readings.ts 签字记录）", () => {
    expect(GUA_READINGS_SIGNOFF).toBe(true);
  });
});

// ───────────────────────── 卦名义 = 典籍转述，不是本项目断言（铁律 §0-2，2026-08-30 dev-content 升级）─────────────────────────
//
// 背景：训解嵌在 `vernacular` 一整句话中间，光读字符串没法机器核对它是否仍与 `gua.ts` 一致——
// 这正是上一轮 `nameHint` 因 `gua.ts` 改用字而静默失效 48/64 的同一个形状。dev-content 把教训
// 变成了可断言的结构（`GuaReading.nameGloss: { quote, work }`），这里把结构和正文都钉住。
//
// ⚠️ 关于第 4 条「转述句式」的判据说明（team-lead 特别提醒的坑）：
// 少数条目在引文**之后**加了一句编辑性说明（16 豫「怠」、38 睽「乖」、58 兑「說」读悦、
// 59 涣「離」是离散、63 既济「濟」是渡、64 未济「窮」非今义穷困），这些是 Rick 批准保留的
// 防误读说明，不是违规。本文件**不试图分辨「附在引文后的说明」与「裸断言」**——那需要
// 语义判断，容易主观。改用两个不依赖语义、对这些编辑性说明天然免疫的结构信号：
//   ① vernacular 是否同时包含引文原文与出处书名（有 = 确有转述的文本证据）；
//   ② vernacular 是否含裸的等号「=」/「＝」（PRD 举的反例「夬 = 决断」正是这个符号）。
// 已用脚本核对：现有 64 段 vernacular 里 0 处含等号，上面点名的 6 处编辑性说明也不含
// 等号——所以这两条检查不会把它们误报成违规，符合 team-lead 的提醒。

/** 三卦刻意不训字：无妄(25)/大過(28)/明夷(36)——三源皆带判词，宁可留白（gua.ts/gua-readings.ts 文件头注释一致）。 */
const NO_GLOSS_ORDERS = new Set<GuaOrder>([25, 28, 36]);
/** 训解只会出自这三部之一——用于「没有训解的卦，正文也不该提到任何一部」的检查。 */
const GLOSS_WORKS = ["序卦傳", "雜卦傳", "周易正義"] as const;

describe("卦名义 = 典籍转述，不是本项目断言（PRD 铁律 §0-2，2026-08-30 数据升级）", () => {
  it("61 条 nameGloss.quote/work 与 gua.ts 的 nameGloss/nameGlossWork 逐字一致", () => {
    for (const order of ALL_ORDERS) {
      if (NO_GLOSS_ORDERS.has(order)) continue; // 这三卦另有专门的一条断言
      const hex = hexagramByOrder(order)!;
      const gloss = GUA_READINGS[order].nameGloss;
      expect(gloss, `order=${order} 应有 nameGloss`).toBeDefined();
      expect(gloss!.quote, `order=${order} quote`).toBe(hex.nameGloss);
      expect(gloss!.work, `order=${order} work`).toBe(hex.nameGlossWork);
    }
  });

  it("有 nameGloss 的 61 条，vernacular 同时包含引文原文与出处书名（防「结构化字段对了、正文里漂了」）", () => {
    for (const order of ALL_ORDERS) {
      if (NO_GLOSS_ORDERS.has(order)) continue;
      const reading = GUA_READINGS[order];
      const gloss = reading.nameGloss!;
      expect(reading.vernacular, `order=${order} 正文缺引文原文`).toContain(gloss.quote);
      expect(reading.vernacular, `order=${order} 正文缺出处书名`).toContain(gloss.work);
    }
  });

  it("不训字三卦（25无妄/28大过/36明夷）既无 nameGloss 字段，正文也不提任何训解出处（防「哪天有人手痒补一句」）", () => {
    for (const order of NO_GLOSS_ORDERS) {
      const reading = GUA_READINGS[order];
      expect(reading.nameGloss, `order=${order} 不该有 nameGloss`).toBeUndefined();
      for (const work of GLOSS_WORKS) {
        expect(reading.vernacular, `order=${order} 不该提到《${work}》`).not.toContain(work);
      }
    }
  });

  it("转述句式，不是「X = Y」式断言：64 段 vernacular 均不含裸等号（半角 = / 全角 ＝）", () => {
    const offenders: string[] = [];
    for (const order of ALL_ORDERS) {
      const text = GUA_READINGS[order].vernacular;
      if (text.includes("=") || text.includes("＝")) offenders.push(`order=${order}`);
    }
    expect(offenders).toEqual([]);
  });
});

// ───────────────────────── §16-21：无无前缀的 isOldYang（源码扫描，非数据/内容问题）─────────────────────────
//
// 这条本质是「代码里不该出现这个裸标识符」（PRD §5.3 实现陷阱），只能对源码文本扫描，不是
// 数据/内容问题——因此单独放在最后，并用最窄的判定方式：只找字面量 `isOldYang`
// （大小写敏感、不做前缀豁免，因为 PRD 原文就是「不许出现无前缀的 isOldYang」，
// 即这个标识符本身不该在这五个文件的任何地方出现，包括注释——出现了就说明有人正在
// 引入这个易混淆的命名，值得在评审时被看到）。

describe("代码扫描：无 isOldYang（PRD §5.3 实现陷阱 / §16-21）", () => {
  it("六爻五个源文件均不含字面量 isOldYang", () => {
    const files = [
      "../src/lib/liuyao.ts",
      "../src/data/trigrams.ts",
      "../src/data/gua.ts",
      "../src/data/gua-readings.ts",
      "../src/data/liuyao-topics.ts",
    ];
    const hits: string[] = [];
    for (const rel of files) {
      const text = readFileSync(new URL(rel, import.meta.url), "utf8");
      if (/isOldYang/.test(text)) hits.push(rel);
    }
    expect(hits, "含 isOldYang 字样的文件").toEqual([]);
  });
});
