/**
 * 三张牌塔罗 —— 内容与红线自动化验收（docs/prd/tarot-prd.md §9/§10/§15「内容与红线」组）。
 *
 * 范围衔接：`test/tarot.spec.ts`（引擎单测）覆盖 §15「抽牌逻辑」「输入校验」两组，
 * 明确把「内容与红线」组标记为"下一轮再做"——本文件就是那一轮，此时 78 张内容已由
 * 内容工位定稿（`data/tarot-readings.ts` 头部注释：「78 张全部定稿，placeholder 一律 false」）。
 *
 * 数据来源约定：
 *   - `data/tarot-readings.ts`  —— 待验证对象（78 张 × 正逆 = 156 条 sourceQuote + 编写层文案）
 *   - `test/fixtures/pkt-source.ts` —— 独立的原文对照 fixture（不依赖任何会话临时目录，
 *     内容与 `docs/external/tarot-rws-meanings.md` 同源，本文件顶部的交叉抽查已核对一致）
 *
 * 本文件只做**可脚本化**的红线检查：关键词黑名单扫描、逐字/省略号子序列匹配、结构不变量、
 * 统计性的开头多样性。**不做语义/语气的人工判断**（如"逆位是否真的读来不吓人"“指引位是否真的只是
 * 倾向而非断言"）——这类条目在 §15 表里逐条标注为「⚠️ 人工」，见交付报告。
 */
import { describe, it, expect } from "vitest";
import {
  READINGS,
  SOURCE_CITE,
  SOURCE_PKT,
  SUMMARY_PLACEHOLDER,
  SUMMARY_TEMPLATES,
} from "../src/data/tarot-readings";
import { DECK_SIZE, TAROT_DECK } from "../src/data/tarot-deck";
import { POSITIONS, positionalText, buildSummary, cardOf, shuffle, drawCards, type DrawPick, type Orientation } from "../src/lib/tarot";
import { PKT_SOURCE } from "./fixtures/pkt-source";

const ALL_IDS = Array.from({ length: DECK_SIZE }, (_, i) => i + 1);
const SIDES = ["upright", "reversed"] as const;

// ───────────────────────── SOURCE_PKT / SOURCE_CITE 一致性（team-lead 裁定 2） ─────────────────────────
//
// 团队裁定：`SOURCE_PKT`（数据层，存进每张牌的 `source`）与 `SOURCE_CITE`（展示层，页面署名
// 格式）是**有意分离**的两个常量，不算错误、不改代码。但年份「1910」与书名在两处各写了一遍，
// 属于「同一个事实的两份拷贝」，将来任一处漂移都不会被类型系统拦住——所以补一条断言，
// 从 `SOURCE_PKT` 里**解析**出年份和书名，再核对 `SOURCE_CITE` 是否仍然包含这两者。
// 刻意不把书名/年份写死成字面量：那样只是把「两处拷贝」变成「三处拷贝」，没有解决问题。

describe("SOURCE_PKT / SOURCE_CITE 一致性（数据层出处 vs 展示层署名，团队裁定「分离设计，年份/书名不得漂移」）", () => {
  it("SOURCE_CITE 包含 SOURCE_PKT 解析出的年份", () => {
    const yearMatch = SOURCE_PKT.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    expect(yearMatch, `SOURCE_PKT="${SOURCE_PKT}" 应能解析出一个四位年份`).not.toBeNull();
    expect(SOURCE_CITE).toContain(yearMatch![1]);
  });

  it("SOURCE_CITE 包含 SOURCE_PKT 解析出的书名（不写死书名字符串本身，直接从 SOURCE_PKT 派生）", () => {
    // SOURCE_PKT 形如 "A. E. Waite, The Pictorial Key to the Tarot, 1910"：
    // 书名是「第一个逗号之后」到「末尾年份前的逗号」之间的那一段。
    const match = SOURCE_PKT.match(/^[^,]+,\s*(.+?),\s*\d{4}\s*$/);
    expect(match, `SOURCE_PKT="${SOURCE_PKT}" 应能按 "作者, 书名, 年份" 的形状解析出书名`).not.toBeNull();
    const title = match![1];
    expect(title.length).toBeGreaterThan(0);
    expect(SOURCE_CITE).toContain(title);
  });
});

// ───────────────────────── 零占位 / 内容形状（PRD §9.1 / §15）─────────────────────────

describe("READINGS — 78 张零占位、内容形状齐全（PRD §15「零占位」）", () => {
  it("覆盖 id 1..78，无缺失无多余（牌库与释义库对齐）", () => {
    const ids = Object.keys(READINGS)
      .map(Number)
      .sort((a, b) => a - b);
    expect(ids).toEqual(ALL_IDS);
    expect(TAROT_DECK).toHaveLength(DECK_SIZE);
  });

  it("78 张全部 placeholder === false", () => {
    for (const id of ALL_IDS) {
      expect(READINGS[id].placeholder, `id=${id}`).toBe(false);
    }
  });

  it("78 张 source 字段统一指向 PKT 出处", () => {
    for (const id of ALL_IDS) {
      expect(READINGS[id].source, `id=${id}`).toBe(SOURCE_PKT);
    }
  });

  it("正位：3 个非空关键词 + 非空 meaning + 三段非空 byPosition（past/present/guidance）", () => {
    for (const id of ALL_IDS) {
      const u = READINGS[id].upright;
      expect(u.keywords, `id=${id}`).toHaveLength(3);
      for (const k of u.keywords) expect(k.trim().length, `id=${id} keyword="${k}"`).toBeGreaterThan(0);
      expect(u.meaning.trim().length, `id=${id}`).toBeGreaterThan(0);
      for (const key of ["past", "present", "guidance"] as const) {
        expect(u.byPosition[key].trim().length, `id=${id}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("逆位：3 个非空关键词 + 非空 meaning + 非空 reversedLens", () => {
    for (const id of ALL_IDS) {
      const r = READINGS[id].reversed;
      expect(r.keywords, `id=${id}`).toHaveLength(3);
      for (const k of r.keywords) expect(k.trim().length, `id=${id} keyword="${k}"`).toBeGreaterThan(0);
      expect(r.meaning.trim().length, `id=${id}`).toBeGreaterThan(0);
      expect(r.reversedLens.trim().length, `id=${id}`).toBeGreaterThan(0);
    }
  });

  it("内容量合计对上 PRD §9.1 重算表：468 关键词 / 156 释义 / 234 正位段 / 78 逆位视角段", () => {
    let keywordCount = 0;
    let meaningCount = 0;
    let positionSegmentCount = 0;
    let reversedLensCount = 0;
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        const c = READINGS[id][side];
        keywordCount += c.keywords.length;
        meaningCount += 1;
      }
      positionSegmentCount += 3; // past/present/guidance
      reversedLensCount += 1;
    }
    expect(keywordCount).toBe(468);
    expect(meaningCount).toBe(156);
    expect(positionSegmentCount).toBe(234);
    expect(reversedLensCount).toBe(78);
  });

  it("任何编写层字段都不残留占位标记「示例（占位）」或「待补」「待摘录」（78 张已定稿，不该有漏网的占位文案）", () => {
    const leaks: string[] = [];
    const markers = ["示例（占位）", "待补", "待摘录"];
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        const c = READINGS[id][side];
        const fields: [string, string][] = [
          ["meaning", c.meaning],
          ["kw0", c.keywords[0]],
          ["kw1", c.keywords[1]],
          ["kw2", c.keywords[2]],
        ];
        if (side === "upright") {
          const u = READINGS[id].upright;
          fields.push(["past", u.byPosition.past], ["present", u.byPosition.present], ["guidance", u.byPosition.guidance]);
        } else {
          fields.push(["reversedLens", READINGS[id].reversed.reversedLens]);
        }
        for (const [fname, text] of fields) {
          for (const m of markers) {
            if (text.includes(m)) leaks.push(`id=${id} ${side}.${fname} 含"${m}"`);
          }
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});

// ───────────────────────── sourceQuote 逐字核对（PRD §15）─────────────────────────

/**
 * 把摘录切成「省略号分隔的片段」，逐段要求在原文里**按顺序、逐字**找到（下标单调不减）。
 * 这不是简单的"包含"检查——它同时验证了：① 没有改写用词/标点；② 没有调换片段顺序；
 * ③ 省略号确实标在被删减的地方，而不是随手加的装饰。
 */
function ellipsisSegments(quote: string): string[] {
  return quote
    .split(/\s*…\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function matchesOriginalInOrder(quote: string, original: string): { ok: boolean; reason?: string } {
  const segments = ellipsisSegments(quote);
  if (segments.length === 0) return { ok: quote === "" };
  let cursor = 0;
  for (const seg of segments) {
    const idx = original.indexOf(seg, cursor);
    if (idx === -1) return { ok: false, reason: `片段未按顺序在原文中逐字找到: "${seg}"` };
    cursor = idx + seg.length;
  }
  return { ok: true };
}

describe("sourceQuote — 逐字对回原文（PRD §15「引用层逐条对得回原文」，全量而非抽查 20 条）", () => {
  it("PKT_SOURCE fixture 与 tarot-readings.ts 覆盖同一套 78 张 id", () => {
    const pktIds = Object.keys(PKT_SOURCE)
      .map(Number)
      .sort((a, b) => a - b);
    expect(pktIds).toEqual(ALL_IDS);
  });

  it.each(ALL_IDS)("id=%i：正位 sourceQuote 是原文的省略号子序列（或为空）", (id) => {
    const quote = READINGS[id].upright.sourceQuote;
    const original = PKT_SOURCE[id].upright;
    if (quote === "") return; // 空串的合法性由「empty-quote⇒note」那组单独断言
    const res = matchesOriginalInOrder(quote, original);
    expect(res.ok, `id=${id} upright: ${res.reason} | quote="${quote}"`).toBe(true);
  });

  it.each(ALL_IDS)("id=%i：逆位 sourceQuote 是原文的省略号子序列（或为空）", (id) => {
    const quote = READINGS[id].reversed.sourceQuote;
    const original = PKT_SOURCE[id].reversed;
    if (quote === "") return;
    expect(original, `id=${id} reversed: 摘录非空但 PKT_SOURCE 该朝向原文缺失`).not.toBeNull();
    const res = matchesOriginalInOrder(quote, original as string);
    expect(res.ok, `id=${id} reversed: ${res.reason} | quote="${quote}"`).toBe(true);
  });
});

// ───────────────────────── 留空必须有说明（PRD §12 / §15）─────────────────────────

describe("sourceQuote 留空 ⇒ 必须有 sourceQuoteNote（PRD §12「不能静默留白」）", () => {
  it("sourceQuote 为空的每一条都带非空 sourceQuoteNote，且提到「原文」", () => {
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        const c = READINGS[id][side];
        if (c.sourceQuote === "") {
          expect(c.sourceQuoteNote, `id=${id} ${side} 留空但无 note`).toBeTruthy();
          expect(c.sourceQuoteNote!.trim().length, `id=${id} ${side}`).toBeGreaterThan(0);
          expect(c.sourceQuoteNote!, `id=${id} ${side} note 应说明"原文"缘由`).toContain("原文");
        }
      }
    }
  });

  it("非空 sourceQuote 不应该配 sourceQuoteNote（note 是给「留白」用的，非空摘录不需要额外说明）", () => {
    const offenders: string[] = [];
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        const c = READINGS[id][side];
        if (c.sourceQuote !== "" && c.sourceQuoteNote) offenders.push(`id=${id} ${side}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("留空条目的集合恰好是 4 条（PRD v0.3 已知清单：太阳20/圣杯二38/宝剑五55/星币七71，均为逆位）", () => {
    const empties: string[] = [];
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        if (READINGS[id][side].sourceQuote === "") empties.push(`${id}-${side}`);
      }
    }
    expect(empties.sort()).toEqual(["20-reversed", "38-reversed", "55-reversed", "71-reversed"]);
  });

  it("圣杯二（id=38）逆位留空，且 PKT_SOURCE 确认该牌原文主条目本就没有逆位（PRD §9.2-5 特例）", () => {
    expect(READINGS[38].reversed.sourceQuote).toBe("");
    expect(PKT_SOURCE[38].reversed).toBeNull();
  });
});

// ───────────────────────── §4 追加条目排除检查（PRD §15）─────────────────────────

describe("§4 追加条目排除（PRD §9.2-1 只取 §2/§3 主条目）", () => {
  it("圣杯二逆位不得出现 §4 追加条目里那个孤零零的 \"Passion.\"", () => {
    const quote = READINGS[38].reversed.sourceQuote;
    expect(quote).toBe(""); // 本就该留空，§4 弃用后没有替代来源
    expect(quote.toLowerCase()).not.toContain("passion");
  });
});

// ───────────────────────── 红线扫描（PRD §10 / §15）─────────────────────────

describe("红线扫描 — 引用层（英文原文摘录，PRD §15「不出现灾难词与人物身份断言词」）", () => {
  // 这组词专门盯"引用层"（sourceQuote）：全部命中即代表红线筛选没做，或做漏了。
  const CITATION_BLACKLIST = ["calamity", "disaster", "mortality", "imprisonment", "ruin", "evil", "dark woman", "fair man"];

  it.each(CITATION_BLACKLIST)('全部 156 条 sourceQuote 都不包含 "%s"（大小写不敏感）', (word) => {
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        const q = READINGS[id][side].sourceQuote.toLowerCase();
        if (q.includes(word.toLowerCase())) hits.push(`id=${id} ${side}: "${READINGS[id][side].sourceQuote}"`);
      }
    }
    expect(hits, `命中 "${word}" 的条目`).toEqual([]);
  });
});

describe("红线扫描 — 编写层全库（PRD §10.1 黑名单，PRD §15）", () => {
  // §15 明确点名的中文黑名单词；不是 §10.1 全部条目的穷尽复现（语义类如"你该分手"无法靠词表抓），
  // 但这份词表命中即视为不通过，是硬门禁的一部分。
  const EDITORIAL_BLACKLIST = ["注定", "必然", "大凶", "破财", "血光", "化解", "转运", "买入", "卖出", "确诊", "寿命"];

  function collectEditorialFields(id: number): [string, string][] {
    const u = READINGS[id].upright;
    const r = READINGS[id].reversed;
    return [
      [`${id}-upright-meaning`, u.meaning],
      [`${id}-upright-kw0`, u.keywords[0]],
      [`${id}-upright-kw1`, u.keywords[1]],
      [`${id}-upright-kw2`, u.keywords[2]],
      [`${id}-upright-past`, u.byPosition.past],
      [`${id}-upright-present`, u.byPosition.present],
      [`${id}-upright-guidance`, u.byPosition.guidance],
      [`${id}-reversed-meaning`, r.meaning],
      [`${id}-reversed-kw0`, r.keywords[0]],
      [`${id}-reversed-kw1`, r.keywords[1]],
      [`${id}-reversed-kw2`, r.keywords[2]],
      [`${id}-reversed-reversedLens`, r.reversedLens],
    ];
  }

  it.each(EDITORIAL_BLACKLIST)('全部编写层字段（78 张 × 正逆 × 各字段）都不包含 "%s"', (word) => {
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      for (const [label, text] of collectEditorialFields(id)) {
        if (text.includes(word)) hits.push(`${label}: "${text}"`);
      }
    }
    expect(hits, `命中 "${word}" 的字段`).toEqual([]);
  });
});

// ↓↓↓ 补充（PRD §9.1「关键词禁字的判例」v0.3 补 · 编排者 2026-08-09 裁定）↓↓↓
//
// 上一轮报告里提过：id=51（宝剑一）/ id=53（宝剑三）的关键词含「说破」「说破了」，字面命中
// PRD §9.1「不用『凶』『劫』『破』这类字」，但语义是「挑明/讲清楚」，跟「破财」类凶义无关，
// 当时没有替 Rick 拍板，原样报了上去。现在 PRD 已经补了判例表（§9.1「关键词禁字的判例」）：
// 规则仍按**字形**扫描以保持可自动化，但把这两个词显式登记进白名单豁免，且要求
// 「新增豁免必须走同样流程：逐条列进这张表，不许在扫描器里加通配」——
// 这条测试把这个治理规则**变成硬门禁**：凶/劫/破 字形只要出现在 keywords 里，
// 就必须逐字匹配 PRD 判例表里登记的词，命中别的就当真违规拦下来。
describe("关键词禁字扫描（PRD §9.1 + 判例表 v0.3，keywords 专项——不同于 §10.1 的正文黑名单）", () => {
  const BANNED_CHARS = ["凶", "劫", "破"];
  /** PRD §9.1 判例表当前登记的豁免词——改这里前必须先改 PRD 那张表，不能私自扩大。 */
  const EXEMPT_KEYWORDS = new Set(["说破", "说破了"]);

  it("keywords 命中凶/劫/破字形时，必须整词落在 PRD 判例表白名单内，否则视为违规", () => {
    const violations: string[] = [];
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        for (const kw of READINGS[id][side].keywords) {
          const hitChar = BANNED_CHARS.find((ch) => kw.includes(ch));
          if (hitChar && !EXEMPT_KEYWORDS.has(kw)) {
            violations.push(`id=${id} ${side} keyword="${kw}" 命中「${hitChar}」且不在判例表白名单`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("判例表登记的两个豁免词确实只出现在 PRD 点名的宝剑一（id 51）/ 宝剑三（id 53）", () => {
    // 防止「白名单」被将来的编辑不知不觉地用到别的牌上——判例表是针对这两处具体出现的裁定，
    // 不是「说破」这个词从此在全库任何位置出现都自动免检。
    for (const id of ALL_IDS) {
      for (const side of SIDES) {
        for (const kw of READINGS[id][side].keywords) {
          if (EXEMPT_KEYWORDS.has(kw)) {
            expect([51, 53], `豁免词"${kw}"出现在 id=${id}，超出判例表登记范围`).toContain(id);
          }
        }
      }
    }
    expect(READINGS[51].upright.keywords).toContain("说破");
    expect(READINGS[53].upright.keywords).toContain("说破了");
  });
});

describe("红线扫描 — 逆位专项（PRD §10.2 逆位不当坏牌处理，PRD §15）", () => {
  const REVERSED_BLACKLIST = ["警告", "危险", "阻碍重重", "不宜", "凶", "失败告终"];

  function collectReversedFields(id: number): [string, string][] {
    const r = READINGS[id].reversed;
    return [
      [`${id}-meaning`, r.meaning],
      [`${id}-kw0`, r.keywords[0]],
      [`${id}-kw1`, r.keywords[1]],
      [`${id}-kw2`, r.keywords[2]],
      [`${id}-reversedLens`, r.reversedLens],
    ];
  }

  it.each(REVERSED_BLACKLIST)('全部 78 张逆位字段都不包含 "%s"', (word) => {
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      for (const [label, text] of collectReversedFields(id)) {
        if (text.includes(word)) hits.push(`${label}: "${text}"`);
      }
    }
    expect(hits, `命中 "${word}" 的字段`).toEqual([]);
  });

  it('"不二次掷骰式坏牌开头"检查：reversedLens 本身也不以逆位专项黑名单词起句（§10.2-3 禁止"逆位警告"句式的最直接落点）', () => {
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      const text = READINGS[id].reversed.reversedLens;
      for (const w of REVERSED_BLACKLIST) {
        if (text.startsWith(w)) hits.push(`id=${id} 以 "${w}" 开头`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("§9.4 reversedLens 写法约束（引擎位置框架句 + 内容 reversedLens 拼接，PRD §9.4/§15）", () => {
  it("reversedLens 不写死具体的位置标签（如「过去 · 背景」「第一个数字」），因为它在三个位置间共用", () => {
    // ⚠️ 范围说明：这里只查"显式位置标签/序数引用"这种铁定不该出现的写法。
    // 曾经试过更宽的裸字扫描（"过去"/"现在"/"指引"单字），命中 6 处，逐条读下来
    // 全部是"现在真正想要的是什么""转过去"这类日常语义用法，并非把内容写死给某个位置——
    // 那种程度的语气搭配问题需要人工读（已在 §15 覆盖表里标「⚠️ 人工」），不适合当自动化硬门禁，
    // 门禁放宽到"裸字"反而会产生大量假阳性、教会大家忽略这条检查。
    const POSITION_LABELS = [
      "过去 · 背景",
      "过去·背景",
      "现在 · 现状",
      "现在·现状",
      "指引 · 走向",
      "指引·走向",
      "第一个数字",
      "第二个数字",
      "第三个数字",
      "位置1",
      "位置2",
      "位置3",
      "位置一",
      "位置二",
      "位置三",
    ];
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      const text = READINGS[id].reversed.reversedLens;
      for (const label of POSITION_LABELS) {
        if (text.includes(label)) hits.push(`id=${id}: 含"${label}"`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("开头多样性：78 段 reversedLens 不是同一套模板批量替换出来的（前 2 字去重数量、单一开头重复次数都在合理范围）", () => {
    // 实测：73/78 的「前 2 字」互不相同，重复最多的开头也只出现 3 次——门禁定得比这松一截，
    // 既能拦住"复制黏贴同一个开场白稍改几个字"的批量生成痕迹，也不会因为个别巧合而误报。
    const openers = new Map<string, number>();
    for (const id of ALL_IDS) {
      const opener = READINGS[id].reversed.reversedLens.slice(0, 2);
      openers.set(opener, (openers.get(opener) ?? 0) + 1);
    }
    expect(openers.size).toBeGreaterThanOrEqual(50); // 实测 73
    const maxRepeat = Math.max(...openers.values());
    expect(maxRepeat).toBeLessThanOrEqual(8); // 实测 3
  });

  // ↓↓↓ 补充（team-lead 交接包 §9.4「血泪教训清单」原话点名的两条，前面的检查覆盖不到）↓↓↓
  //
  // 首批交付 22/22 条撞在「这张牌逆位时，……」开头，PRD §9.4 明确写了"硬规则"：禁止以
  // 复述朝向的话开头、禁止带位置指向词。上面「reversedLens 不写死具体的位置标签」那条
  // 查的是「过去 · 背景」这类**展示用的位置名**，跟这里要查的**朝向自指开头**/**时间指向词**
  // 是两件不同的事，不能互相替代，所以单独补两条断言、不改动前面已有的测试。

  it("78 条 reversedLens 无一以「这张牌逆位时」「逆位时」「逆位常被读成」开头（PRD §9.4 硬规则 2）", () => {
    const bannedPrefixes = ["这张牌逆位时", "逆位时", "逆位常被读成"];
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      const lens = READINGS[id].reversed.reversedLens;
      for (const p of bannedPrefixes) {
        if (lens.startsWith(p)) hits.push(`id=${id}: 以"${p}"开头 —— ${lens}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("78 条 reversedLens 不含位置指向词「未来」「接下来会」「过去曾经」（PRD §9.4 硬规则 3——同一段要能接三个位置的框架句）", () => {
    const positionalWords = ["未来", "接下来会", "过去曾经"];
    const hits: string[] = [];
    for (const id of ALL_IDS) {
      const lens = READINGS[id].reversed.reversedLens;
      for (const w of positionalWords) {
        if (lens.includes(w)) hits.push(`id=${id}: 含"${w}" —— ${lens}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

// ───────────────────────── positionalText 拼接精确性（全 78 张，PRD §9.4）─────────────────────────

describe("positionalText — 全 78 张的拼接精确性（不认字面文案，只认结构关系）", () => {
  it.each(ALL_IDS)("id=%i：正位三个位置分别精确等于 byPosition 对应字段", (id) => {
    const card = cardOf(id);
    for (const meta of POSITIONS) {
      const pick: DrawPick = { position: meta.index, inputNumber: 1, card, orientation: "upright" };
      expect(positionalText(pick)).toBe(card.upright.byPosition[meta.key]);
    }
  });

  it.each(ALL_IDS)("id=%i：逆位三个位置分别精确等于 frame + reversedLens（无多余/缺失字符）", (id) => {
    const card = cardOf(id);
    for (const meta of POSITIONS) {
      const pick: DrawPick = { position: meta.index, inputNumber: 1, card, orientation: "reversed" };
      expect(positionalText(pick)).toBe(`${meta.frame}${card.reversed.reversedLens}`);
    }
  });

  it("拼接卫生检查：reversedLens 不以空白字符开头（避免与 frame 结尾的破折号之间出现观感异常的空白）", () => {
    const offenders: string[] = [];
    for (const id of ALL_IDS) {
      const text = READINGS[id].reversed.reversedLens;
      if (/^\s/.test(text)) offenders.push(`id=${id}`);
    }
    expect(offenders).toEqual([]);
  });

  it("三条框架句本身互不相同（引擎规则层事实，PRD §9.4 表格定义）", () => {
    expect(new Set(POSITIONS.map((p) => p.frame)).size).toBe(3);
  });
});

// ───────────────────────── buildSummary 覆盖（规则选择，不测文案内容，PRD §9.3/§15）─────────────────────────

/** 直接拼一个 DrawPick，不经过 shuffle/drawCards——用于精确控制"逆位数量"等维度。 */
function pick(id: number, position: 1 | 2 | 3, orientation: Orientation): DrawPick {
  return { position, inputNumber: id, card: cardOf(id), orientation };
}

/** summary 不应留下未替换的模板占位符（如 `{cards}`）。 */
function hasUnresolvedTemplateBraces(s: string): boolean {
  return /\{[a-zA-Z]+\}/.test(s);
}

describe("buildSummary — 规则覆盖穷尽（只测结构，不测文案，PRD §9.3/§15）", () => {
  it("逆位数量 0/1/2/3 各自都能拼出非空、无残留占位符的综合解读", () => {
    // 用互不相同的大阿卡纳三张（1/2/3）承载逆位数量变化，只操纵 orientation 这一个维度
    const combos: Orientation[][] = [
      ["upright", "upright", "upright"], // 0 逆
      ["reversed", "upright", "upright"], // 1 逆
      ["reversed", "reversed", "upright"], // 2 逆
      ["reversed", "reversed", "reversed"], // 3 逆
    ];
    for (const orientations of combos) {
      const picks: [DrawPick, DrawPick, DrawPick] = [
        pick(1, 1, orientations[0]),
        pick(2, 2, orientations[1]),
        pick(3, 3, orientations[2]),
      ];
      const summary = buildSummary(picks);
      expect(summary.length, `orientations=${orientations}`).toBeGreaterThan(0);
      expect(hasUnresolvedTemplateBraces(summary), `orientations=${orientations} summary="${summary}"`).toBe(false);
    }
  });

  it("三张全正 与 三张全逆 两种极端：都非空、都不含残留占位符、且引用了各自对应的逆位模板句（自我引用，不写死文案）", () => {
    const allUp: [DrawPick, DrawPick, DrawPick] = [pick(1, 1, "upright"), pick(2, 2, "upright"), pick(3, 3, "upright")];
    const allDown: [DrawPick, DrawPick, DrawPick] = [pick(1, 1, "reversed"), pick(2, 2, "reversed"), pick(3, 3, "reversed")];

    const upSummary = buildSummary(allUp);
    const downSummary = buildSummary(allDown);

    expect(upSummary.length).toBeGreaterThan(0);
    expect(downSummary.length).toBeGreaterThan(0);
    expect(hasUnresolvedTemplateBraces(upSummary)).toBe(false);
    expect(hasUnresolvedTemplateBraces(downSummary)).toBe(false);

    // 自我引用比对：拿 SUMMARY_TEMPLATES 自己的 reversed[0]/[3] 模板句去核对确实用上了对应档位的句子，
    // 而不是断言具体中文——内容工位改措辞不会打破这条测试。reversed[0]/[3]（全正/全逆）这两档
    // 本就不含 {cards} 占位符（不点名具体某张牌），故这里不需要做占位符替换，可以直接整句比对。
    expect(SUMMARY_TEMPLATES.reversed[0]).not.toContain("{cards}");
    expect(SUMMARY_TEMPLATES.reversed[3]).not.toContain("{cards}");
    expect(upSummary).toContain(SUMMARY_TEMPLATES.reversed[0]);
    expect(downSummary).toContain(SUMMARY_TEMPLATES.reversed[3]);
  });

  it("20 个随机抽样组合都能生成非空、无残留占位符的综合解读（真实 shuffle+drawCards 路径）", () => {
    for (let trial = 0; trial < 20; trial++) {
      const deck = shuffle();
      // 随机生成三个互不相同的 1..78
      const nums = new Set<number>();
      while (nums.size < 3) nums.add(1 + Math.floor(Math.random() * DECK_SIZE));
      const [n1, n2, n3] = [...nums];
      const result = drawCards(deck, { n1, n2, n3 });
      expect(result.summary.length, `trial=${trial} nums=${n1},${n2},${n3}`).toBeGreaterThan(0);
      expect(hasUnresolvedTemplateBraces(result.summary), `trial=${trial} summary="${result.summary}"`).toBe(false);
    }
  });
});

describe("SUMMARY_TEMPLATES — 占位标志与正文自洽（已知未定稿状态，PRD §9.2-9）", () => {
  it("SUMMARY_PLACEHOLDER 与模板正文里是否还带「示例（占位）」标记保持一致", () => {
    // 这不是"必须为 false"的硬性验收断言——现状是 major 分支仍带占位前缀、SUMMARY_PLACEHOLDER=true，
    // 这属于内容工位自己在文件头注释里写明的已知未完成项，不是本文件要拦的 bug。
    // 这条测试拦的是"标志位和正文不同步"这种更隐蔽的错误：
    // 比如内容工位改完文案却忘了把 SUMMARY_PLACEHOLDER 一起置 false，或者反过来。
    const allBranches = [
      ...Object.values(SUMMARY_TEMPLATES.major),
      ...Object.values(SUMMARY_TEMPLATES.suit),
      ...Object.values(SUMMARY_TEMPLATES.court),
      ...Object.values(SUMMARY_TEMPLATES.reversed),
      SUMMARY_TEMPLATES.closing,
    ];
    const stillHasPlaceholderMarker = allBranches.some((s) => s.includes("示例（占位）"));
    expect(SUMMARY_PLACEHOLDER).toBe(stillHasPlaceholderMarker);
  });
});
