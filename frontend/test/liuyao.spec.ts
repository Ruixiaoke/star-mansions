/**
 * 六爻起卦引擎 —— 单测（docs/prd/liuyao-prd.md §5 引擎 / §6.3 数据门禁）。
 * 验收范围：PRD §16 第 1–8 条（引擎 + 64 卦数据门禁）。写法对齐 `test/tarot.spec.ts`：
 * test/*.spec.ts + describe/it/expect，只断言结构性/统计性/规则性质，不断言任何具体释义文案
 * （编写层内容与红线扫描见 `test/liuyao-content.spec.ts`，那一份才覆盖 §16 第 9–21 条）。
 *
 * ⚠️ 本文件只读被测代码，不修改任何产品代码（`src/lib/liuyao.ts` / `src/data/*.ts`）。
 * `lib/liuyao.ts` 按其文件末尾 TODO 注释「本轮刻意不 import `data/gua.ts`，避免撞车」，
 * 所以「六爻卦象 → 64 卦身份」这条接线在本文件里用 `hexagramKeyOf` + `data/gua.ts` 的
 * `hexagramByKey` 显式拼起来验证，不代表 `lib/liuyao.ts` 已经接了表（它确实还没接，这是已知状态）。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import {
  YAO_META,
  tossOnce,
  yaoValueOf,
  yaoFromValue,
  changedValueOf,
  guaCodeOf,
  guaShapeOf,
  castingFromTosses,
  yaosFromCode,
  castingFromCode,
  hexagramKeyOf,
  type Toss,
  type Yao,
  type YaoValue,
  type YaoPosition,
  type CoinFace,
  type Six,
} from "../src/lib/liuyao";
import { TRIGRAMS, trigramByOrder, trigramOrderOf, type TrigramOrder, type YinYang } from "../src/data/trigrams";
import { HEXAGRAMS, hexagramByOrder, hexagramByKey, type TrigramOrderKey } from "../src/data/gua";

// ───────────────────────── 大样本：四种爻象概率 + 三枚铜钱独立性（PRD §16-1 / §16-2）─────────────────────────

// 48000 = 8 × 6000：四种爻象 1/8、3/8、3/8、1/8 的期望频次都是整数，容差写起来更直观。
// dev-engine 实测 100 万次为 .1248/.3751/.3748/.1252（卡方 0.5661）；本文件样本量小一档，
// 容差相应放宽，仍足以拦住「概率写错」「联合查表」这类结构性错误。
const SAMPLE_N = 48000;
const SAMPLE_TOSSES: Toss[] = Array.from({ length: SAMPLE_N }, () => tossOnce(1));

describe(`tossOnce — 大样本分布（N=${SAMPLE_N}，PRD §16-1「四种爻象概率」）`, () => {
  it("爻数 6/9（交/重）各落在 1/8 附近、7/8（单/拆）各落在 3/8 附近（带容差，不写死等值）", () => {
    const counts: Record<YaoValue, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const t of SAMPLE_TOSSES) counts[t.value]++;
    const ratio = (v: YaoValue) => counts[v] / SAMPLE_N;

    expect(ratio(6), `6(交) 比例=${ratio(6)}`).toBeGreaterThan(0.125 - 0.02);
    expect(ratio(6), `6(交) 比例=${ratio(6)}`).toBeLessThan(0.125 + 0.02);
    expect(ratio(9), `9(重) 比例=${ratio(9)}`).toBeGreaterThan(0.125 - 0.02);
    expect(ratio(9), `9(重) 比例=${ratio(9)}`).toBeLessThan(0.125 + 0.02);
    expect(ratio(7), `7(单) 比例=${ratio(7)}`).toBeGreaterThan(0.375 - 0.03);
    expect(ratio(7), `7(单) 比例=${ratio(7)}`).toBeLessThan(0.375 + 0.03);
    expect(ratio(8), `8(拆) 比例=${ratio(8)}`).toBeGreaterThan(0.375 - 0.03);
    expect(ratio(8), `8(拆) 比例=${ratio(8)}`).toBeLessThan(0.375 + 0.03);
  });

  it("阳爻合计（7+9）≈ 1/2、动爻合计（6+9）≈ 1/4（PRD §5.2 推导值的交叉校验）", () => {
    const counts: Record<YaoValue, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const t of SAMPLE_TOSSES) counts[t.value]++;
    const yangRatio = (counts[7] + counts[9]) / SAMPLE_N;
    const movingRatio = (counts[6] + counts[9]) / SAMPLE_N;
    expect(yangRatio, `阳爻比例=${yangRatio}`).toBeGreaterThan(0.5 - 0.03);
    expect(yangRatio, `阳爻比例=${yangRatio}`).toBeLessThan(0.5 + 0.03);
    expect(movingRatio, `动爻比例=${movingRatio}`).toBeGreaterThan(0.25 - 0.03);
    expect(movingRatio, `动爻比例=${movingRatio}`).toBeLessThan(0.25 + 0.03);
  });
});

/**
 * 2×2 列联表的 Pearson χ²（独立性检验，df=1，两个边际比例都由样本估出）。
 * `table[i][j]` = 第一枚取第 i 态（0=back/1=char）且第二枚取第 j 态时的观测频数。
 *
 * ⚠️ 团队复核记录（2026-08-30，codex 独立复核指出，team-lead 验证成立）：本文件曾用
 * 「联合格比例落在 0.25±0.03」判定独立性，**这条容差在 N=48000 时宽达约 15 个标准差**——
 * codex 构造了一组三币联合分布（两两 Pearson χ² 高达 16.07/16.07/68.05，即显著相关）却能让
 * 四种爻象分布精确保持 1/8,3/8,3/8,1/8、单币边际比例落在 ±0.02 内、旧的联合格容差也全绿。
 * 「用例名承诺的强度没有兑现」——现改用列联表 χ² 检验，下面「独立性检验强度自检」那组用
 * 这组反例做了红灯实验：旧容差对它全绿、新 χ² 对它报红，证明这不是换了个写法而是真的更强。
 */
function chiSquare2x2(table: readonly [readonly [number, number], readonly [number, number]]): number {
  const [[n00, n01], [n10, n11]] = table;
  const total = n00 + n01 + n10 + n11;
  const row0 = n00 + n01;
  const row1 = n10 + n11;
  const col0 = n00 + n10;
  const col1 = n01 + n11;
  const cells: Array<[number, number]> = [
    [n00, (row0 * col0) / total],
    [n01, (row0 * col1) / total],
    [n10, (row1 * col0) / total],
    [n11, (row1 * col1) / total],
  ];
  return cells.reduce((sum, [observed, expected]) => sum + (observed - expected) ** 2 / expected, 0);
}

/** 把某一对铜钱位（0/1/2）在一批 Toss 上的取值配成 2×2 观测频数表（back=0, char=1）。 */
function contingencyTableOf(tosses: readonly Toss[], a: 0 | 1 | 2, b: 0 | 1 | 2): [[number, number], [number, number]] {
  const table: [[number, number], [number, number]] = [
    [0, 0],
    [0, 0],
  ];
  for (const t of tosses) {
    const row = t.coins[a] === "back" ? 0 : 1;
    const col = t.coins[b] === "back" ? 0 : 1;
    table[row][col]++;
  }
  return table;
}

/** df=1 时 χ² 的判定阈值：0.05 显著性水平的临界值是 3.841，取 16 留足抖动余量，
 *  同时仍能拦住 codex 反例的 16.07/16.07/68.05（team-lead 拍定的数值）。 */
const CHI_SQUARE_THRESHOLD = 16;

describe("tossOnce — 三枚铜钱独立性（PRD §16-2「任意两枚的联合分布无显著相关」）", () => {
  it("三枚铜钱各自 back/char ≈ 50/50（边际频率，本身没问题，只是不能替代独立性检验）", () => {
    for (const slot of [0, 1, 2] as const) {
      const backCount = SAMPLE_TOSSES.filter((t) => t.coins[slot] === "back").length;
      const ratio = backCount / SAMPLE_N;
      expect(ratio, `第 ${slot} 枚 back 比例=${ratio}`).toBeGreaterThan(0.5 - 0.02);
      expect(ratio, `第 ${slot} 枚 back 比例=${ratio}`).toBeLessThan(0.5 + 0.02);
    }
  });

  it("任意两枚的联合分布通过 2×2 列联表 Pearson χ² 独立性检验（df=1，阈值 16）", () => {
    const pairs: Array<[0 | 1 | 2, 0 | 1 | 2]> = [
      [0, 1],
      [1, 2],
      [0, 2],
    ];
    for (const [a, b] of pairs) {
      const chiSq = chiSquare2x2(contingencyTableOf(SAMPLE_TOSSES, a, b));
      expect(chiSq, `枚${a}×枚${b} 的 χ²=${chiSq}`).toBeLessThan(CHI_SQUARE_THRESHOLD);
    }
  });
});

// ───────────────────────── 独立性检验强度自检：codex 构造的相关性反例（2026-08-30 团队复核）─────────────────────────

/**
 * codex 独立复核构造、team-lead 复核过数学成立的反例：三币联合分布故意相关，
 * 但刻意保留「四种爻象分布精确 1/8,3/8,3/8,1/8」「单币边际比例落在旧 ±0.02 容差内」
 * 「旧的联合格 ±0.03 容差也全绿」——专门用来戳穿「样本大就等于测得准」的错觉。
 * 用固定配比（非随机抽样）构造，保证可重复、不依赖随机种子。
 */
function buildCorrelatedCounterexample(): Toss[] {
  // 8 种三币组合的目标概率（codex 给出，下面按 N=48000 换算成整数配额）：
  //   CCC .125 / BCC .144 / CBC .1155 / CCB .1155 / BBC .125 / BCB .125 / CBB .125 / BBB .125
  const spec: Array<{ pattern: [CoinFace, CoinFace, CoinFace]; count: number }> = [
    { pattern: ["char", "char", "char"], count: 6000 }, // CCC .125
    { pattern: ["back", "char", "char"], count: 6912 }, // BCC .144
    { pattern: ["char", "back", "char"], count: 5544 }, // CBC .1155
    { pattern: ["char", "char", "back"], count: 5544 }, // CCB .1155
    { pattern: ["back", "back", "char"], count: 6000 }, // BBC .125
    { pattern: ["back", "char", "back"], count: 6000 }, // BCB .125
    { pattern: ["char", "back", "back"], count: 6000 }, // CBB .125
    { pattern: ["back", "back", "back"], count: 6000 }, // BBB .125
  ];
  const total = spec.reduce((sum, s) => sum + s.count, 0);
  if (total !== SAMPLE_N) throw new Error(`反例配额加起来应为 ${SAMPLE_N}，实为 ${total}`);
  const tosses: Toss[] = [];
  for (const { pattern, count } of spec) {
    for (let i = 0; i < count; i++) {
      tosses.push({ index: 1, coins: pattern, value: yaoValueOf(pattern) });
    }
  }
  return tosses;
}

const CORRELATED_COUNTEREXAMPLE = buildCorrelatedCounterexample();

describe("红灯对照：codex 反例证明新 χ² 检验确实比旧容差更强（不是换了个写法）", () => {
  it("反例的四种爻象分布仍精确是 1/8,3/8,3/8,1/8（相关性藏在联合分布里，单看爻象概率看不出来）", () => {
    const counts: Record<YaoValue, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const t of CORRELATED_COUNTEREXAMPLE) counts[t.value]++;
    expect(counts[6] / SAMPLE_N).toBeCloseTo(0.125, 5);
    expect(counts[9] / SAMPLE_N).toBeCloseTo(0.125, 5);
    expect(counts[7] / SAMPLE_N).toBeCloseTo(0.375, 5);
    expect(counts[8] / SAMPLE_N).toBeCloseTo(0.375, 5);
  });

  it("对照组（旧容差）：单币边际 ±0.02、联合格 ±0.03 对这组反例全部通过——旧断言测不出问题", () => {
    for (const slot of [0, 1, 2] as const) {
      const ratio = CORRELATED_COUNTEREXAMPLE.filter((t) => t.coins[slot] === "back").length / SAMPLE_N;
      expect(ratio, `旧容差·第 ${slot} 枚 back 比例=${ratio}`).toBeGreaterThan(0.5 - 0.02);
      expect(ratio, `旧容差·第 ${slot} 枚 back 比例=${ratio}`).toBeLessThan(0.5 + 0.02);
    }
    const pairs: Array<[0 | 1 | 2, 0 | 1 | 2]> = [
      [0, 1],
      [1, 2],
      [0, 2],
    ];
    const faces: CoinFace[] = ["back", "char"];
    for (const [a, b] of pairs) {
      for (const fa of faces) {
        for (const fb of faces) {
          const ratio =
            CORRELATED_COUNTEREXAMPLE.filter((t) => t.coins[a] === fa && t.coins[b] === fb).length / SAMPLE_N;
          expect(ratio, `旧容差·枚${a}=${fa} 且 枚${b}=${fb}=${ratio}`).toBeGreaterThan(0.25 - 0.03);
          expect(ratio, `旧容差·枚${a}=${fa} 且 枚${b}=${fb}=${ratio}`).toBeLessThan(0.25 + 0.03);
        }
      }
    }
  });

  it("新断言（χ²<16）对同一组反例正确报红：三对 χ² 均 ≥ 16（实测约 16.07/16.07/68.05，与 team-lead 复核值一致）", () => {
    const chi01 = chiSquare2x2(contingencyTableOf(CORRELATED_COUNTEREXAMPLE, 0, 1));
    const chi12 = chiSquare2x2(contingencyTableOf(CORRELATED_COUNTEREXAMPLE, 1, 2));
    const chi02 = chiSquare2x2(contingencyTableOf(CORRELATED_COUNTEREXAMPLE, 0, 2));
    expect(chi01, `枚0×枚1 χ²=${chi01}`).toBeGreaterThanOrEqual(CHI_SQUARE_THRESHOLD);
    expect(chi12, `枚1×枚2 χ²=${chi12}`).toBeGreaterThanOrEqual(CHI_SQUARE_THRESHOLD);
    expect(chi02, `枚0×枚2 χ²=${chi02}`).toBeGreaterThanOrEqual(CHI_SQUARE_THRESHOLD);
    // 与团队复核的具体数值对上（容差 ±0.5，防止有人把公式改错了但凑巧还是超阈值）
    // 实测：χ²(枚0,枚1)=χ²(枚0,枚2)≈16.07，χ²(枚1,枚2)≈68.05——不是「三对里随便两对」，
    // 是「涉及枚0 的两对同为 16.07，不涉及枚0 的那一对是 68.05」，与反例配额的构造方式一致。
    expect(chi01).toBeCloseTo(16.07, 1);
    expect(chi02).toBeCloseTo(16.07, 1);
    expect(chi12).toBeCloseTo(68.05, 1);
  });
});

// ───────────────────────── 随机源（PRD §16-3）─────────────────────────

describe("随机源 —— crypto.getRandomValues，禁止 Math.random（PRD §16-3）", () => {
  it("反复调用 tossOnce 确实触发了 crypto.getRandomValues（结构性证据，不只是数值分布凑巧对）", () => {
    const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
    spy.mockClear();
    // 取数器缓冲区一次填 64 个 u32；连续调用足够多次，必然至少触发一次真实的系统调用。
    for (let i = 0; i < 200; i++) tossOnce(1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("本功能五个源文件的源码文本里不含字面量 Math.random（PRD §16-3 全仓扫描）", () => {
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
      if (/Math\.random/.test(text)) hits.push(rel);
    }
    expect(hits, "含 Math.random 字样的文件").toEqual([]);
  });
});

// ───────────────────────── 六掷自下而上（PRD §16-4）─────────────────────────

/** 按爻数构造一个语义自洽的 Toss（coins 按 YAO_META.backs 给出对应的背/字组合）。 */
function mkToss(index: YaoPosition, value: YaoValue): Toss {
  const backs = YAO_META[value].backs;
  const coins = [0, 1, 2].map((i) => (i < backs ? "back" : "char")) as [CoinFace, CoinFace, CoinFace];
  return { index, coins, value };
}

describe("六掷 → 一卦：第 1 掷 = 初爻（最下）、第 6 掷 = 上爻，内卦取 1/2/3、外卦取 4/5/6（PRD §16-4）", () => {
  it("值序列 778788（PRD §5.3 定向向量，下兑2 上震4）：position 与掷序一致、内外卦切分正确", () => {
    const values: Six<YaoValue> = [7, 7, 8, 7, 8, 8];
    const tosses = values.map((v, i) => mkToss((i + 1) as YaoPosition, v)) as Six<Toss>;
    const casting = castingFromTosses(tosses);

    // 第 N 掷就是第 N 爻：position 恰好等于「第几掷」（自下而上，不是反着来）
    casting.primary.yaos.forEach((yao, i) => expect(yao.position, `第 ${i + 1} 掷`).toBe(i + 1));

    expect(casting.primary.lower.order, "内卦（1/2/3 爻）").toBe(2); // 兑
    expect(casting.primary.upper.order, "外卦（4/5/6 爻）").toBe(4); // 震
    expect(casting.movingPositions).toEqual([]);
    expect(casting.changed).toBeNull();
  });

  it("同一串爻数，六爻整体倒过来会切出不同的内外卦（防「内外卦搞反」/「顺序倒着读」）", () => {
    const values: Six<YaoValue> = [7, 7, 8, 7, 8, 8];
    const forward = guaShapeOf(values.map((v, i) => yaoFromValue((i + 1) as YaoPosition, v)) as Six<Yao>);
    const reversedValues = [...values].reverse() as Six<YaoValue>;
    const backward = guaShapeOf(reversedValues.map((v, i) => yaoFromValue((i + 1) as YaoPosition, v)) as Six<Yao>);
    const same = backward.lower.order === forward.lower.order && backward.upper.order === forward.upper.order;
    expect(same, "正序与倒序切出的内外卦不应相同").toBe(false);
  });
});

// ───────────────────────── 动爻 → 之卦（PRD §16-5 / §16-6，定向向量）─────────────────────────

describe("changedValueOf — 重变拆、交变单，少阳少阴不变（PRD §5.4 / §16-5）", () => {
  it("9→8（重变拆）、6→7（交变单）、7→7、8→8（少阳少阴不变，非动爻恒等映射）", () => {
    expect(changedValueOf(9)).toBe(8);
    expect(changedValueOf(6)).toBe(7);
    expect(changedValueOf(7)).toBe(7);
    expect(changedValueOf(8)).toBe(8);
  });
});

describe("castingFromCode — 四条已核对定向向量（PRD §5.3/§5.4；引擎工位与编排者独立复算一致）", () => {
  it("777777 → 下乾1 上乾1，无动爻，之卦 null", () => {
    const c = castingFromCode("777777")!;
    expect(c.primary.lower.order).toBe(1);
    expect(c.primary.upper.order).toBe(1);
    expect(c.movingPositions).toEqual([]);
    expect(c.changed).toBeNull();
  });

  it("999999 → 下乾 上乾，动爻 1..6，之卦 888888（下坤上坤）", () => {
    const c = castingFromCode("999999")!;
    expect(c.primary.lower.order).toBe(1);
    expect(c.primary.upper.order).toBe(1);
    expect(c.movingPositions).toEqual([1, 2, 3, 4, 5, 6]);
    expect(c.changed).not.toBeNull();
    expect(c.changed!.lower.order).toBe(8);
    expect(c.changed!.upper.order).toBe(8);
    expect(c.changed!.code).toBe("888888");
  });

  it("778788 → 下兑2 上震4，无动爻，之卦 null", () => {
    const c = castingFromCode("778788")!;
    expect(c.primary.lower.order).toBe(2);
    expect(c.primary.upper.order).toBe(4);
    expect(c.movingPositions).toEqual([]);
    expect(c.changed).toBeNull();
  });

  it("987678 → 下离3 上坎6，动爻[1,4]，之卦 887778（下艮上兑）", () => {
    const c = castingFromCode("987678")!;
    expect(c.primary.lower.order).toBe(3);
    expect(c.primary.upper.order).toBe(6);
    expect(c.movingPositions).toEqual([1, 4]);
    expect(c.changed).not.toBeNull();
    expect(c.changed!.lower.order).toBe(7);
    expect(c.changed!.upper.order).toBe(2);
    expect(c.changed!.code).toBe("887778");
  });
});

describe("无动爻时 changed 恒为 null（PRD §16-6「不是空壳」）", () => {
  it("changed 严格 === null（用 toBeNull，不是 toBeFalsy/toBeUndefined 那种松检查）", () => {
    expect(castingFromCode("777777")!.changed).toBeNull();
    expect(castingFromCode("778788")!.changed).toBeNull();
  });
});

// ───────────────────────── 卦码往返（PRD §16-7）─────────────────────────

describe("卦码往返一致（PRD §5.5 / §16-7）", () => {
  it("真实随机起卦 30 次：guaCodeOf → yaosFromCode → castingFromCode，卦象前后一致", () => {
    for (let trial = 0; trial < 30; trial++) {
      const tosses = Array.from({ length: 6 }, (_, i) => tossOnce((i + 1) as YaoPosition)) as Six<Toss>;
      const casting = castingFromTosses(tosses);
      const code = casting.primary.code;

      const restoredYaos = yaosFromCode(code)!;
      expect(guaCodeOf(restoredYaos), `trial=${trial}`).toBe(code);

      const restoredCasting = castingFromCode(code)!;
      expect(restoredCasting.primary.lower.order, `trial=${trial} 下卦`).toBe(casting.primary.lower.order);
      expect(restoredCasting.primary.upper.order, `trial=${trial} 上卦`).toBe(casting.primary.upper.order);
      expect(restoredCasting.movingPositions, `trial=${trial} 动爻`).toEqual(casting.movingPositions);
    }
  });

  it("非法卦码（长度不对 / 含非法数字 / 含字母 / 空串）一律返回 null，不抛不猜", () => {
    const invalids = ["12345", "1234567", "abcdef", "98765a", "", "0000000", "555555"];
    for (const code of invalids) {
      expect(yaosFromCode(code), `code="${code}"`).toBeNull();
      expect(castingFromCode(code), `code="${code}"`).toBeNull();
    }
  });
});

// ───────────────────────── §6.3 数据校验门禁（PRD §16-8，五条断言固化）─────────────────────────

describe("data/gua.ts — §6.3 五条数据断言（PRD §16-8，防手滑改坏表）", () => {
  it("卦序集合 == 1..64", () => {
    const orders = HEXAGRAMS.map((h) => h.order).sort((a, b) => a - b);
    expect(orders).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
  });

  it("卦序 n 对应的卦画 == Unicode U+4DC0 + n − 1（64/64）", () => {
    for (const h of HEXAGRAMS) {
      expect(h.symbol.codePointAt(0), `order=${h.order} symbol=${h.symbol}`).toBe(0x4dc0 + h.order - 1);
    }
  });

  it("64 个 (下卦, 上卦) 组合互异且覆盖 8×8", () => {
    const keys = new Set(HEXAGRAMS.map((h) => `${h.lowerOrder}-${h.upperOrder}`));
    expect(keys.size).toBe(64);
    for (let lower = 1; lower <= 8; lower++) {
      for (let upper = 1; upper <= 8; upper++) {
        expect(keys.has(`${lower}-${upper}`), `缺 (下${lower},上${upper})`).toBe(true);
      }
    }
  });

  it("每卦卦辞非空 + 恰好 6 条非空爻辞", () => {
    for (const h of HEXAGRAMS) {
      expect(h.judgment.trim().length, `order=${h.order} 卦辞`).toBeGreaterThan(0);
      expect(h.lines, `order=${h.order} 爻辞条数`).toHaveLength(6);
      for (const line of h.lines) expect(line.trim().length, `order=${h.order} 爻辞`).toBeGreaterThan(0);
    }
  });

  it("hexagramByKey 8×8 往返自洽：查回来的卦其 lowerOrder/upperOrder 与查询键一致", () => {
    for (let lower = 1; lower <= 8; lower++) {
      for (let upper = 1; upper <= 8; upper++) {
        const h = hexagramByKey({ lower: lower as TrigramOrderKey, upper: upper as TrigramOrderKey });
        expect(h.lowerOrder, `查 (下${lower},上${upper})`).toBe(lower);
        expect(h.upperOrder, `查 (下${lower},上${upper})`).toBe(upper);
      }
    }
  });
});

// ───────────────────────── lib ↔ data 接线（PRD §16-8 附加 · 四条定向向量落到真实卦名）─────────────────────────

describe("hexagramKeyOf + hexagramByKey 对接：四条定向向量落到真实卦名（编排者独立核对过的卦序）", () => {
  it("777777→乾为天(1)；999999→乾为天(1)/之卦坤为地(2)；778788→雷泽归妹(54)；987678→水火既济(63)/之卦泽山咸(31)", () => {
    const cases: Array<{ code: string; primaryOrder: number; primaryName: string; changedOrder: number | null; changedName?: string }> = [
      { code: "777777", primaryOrder: 1, primaryName: "乾为天", changedOrder: null },
      { code: "999999", primaryOrder: 1, primaryName: "乾为天", changedOrder: 2, changedName: "坤为地" },
      { code: "778788", primaryOrder: 54, primaryName: "雷泽归妹", changedOrder: null },
      { code: "987678", primaryOrder: 63, primaryName: "水火既济", changedOrder: 31, changedName: "泽山咸" },
    ];
    for (const c of cases) {
      const casting = castingFromCode(c.code)!;
      const primaryKey = hexagramKeyOf(casting.primary) as { lower: TrigramOrderKey; upper: TrigramOrderKey };
      const primaryHex = hexagramByKey(primaryKey);
      expect(primaryHex.order, `code=${c.code} 本卦卦序`).toBe(c.primaryOrder);
      expect(primaryHex.name, `code=${c.code} 本卦名`).toBe(c.primaryName);

      if (casting.changed === null) {
        expect(c.changedOrder, `code=${c.code} 期望无之卦`).toBeNull();
      } else {
        const changedKey = hexagramKeyOf(casting.changed) as { lower: TrigramOrderKey; upper: TrigramOrderKey };
        const changedHex = hexagramByKey(changedKey);
        expect(changedHex.order, `code=${c.code} 之卦卦序`).toBe(c.changedOrder);
        expect(changedHex.name, `code=${c.code} 之卦名`).toBe(c.changedName);
      }
    }
  });
});

// ───────────────────────── 方向性：内外卦不可互换（编排者点名的结构断言）─────────────────────────

describe("方向性：(下卦,上卦) 与 (上卦,下卦) 是两个不同的卦（专治「内外卦搞反」）", () => {
  it("下离(3)上坎(6) → 第 63 卦（水火既济）；下坎(6)上离(3) → 第 64 卦（火水未济），两者不同", () => {
    const a = hexagramByKey({ lower: 3, upper: 6 });
    const b = hexagramByKey({ lower: 6, upper: 3 });
    expect(a.order).toBe(63);
    expect(b.order).toBe(64);
    expect(a.order).not.toBe(b.order);
  });
});

// ───────────────────────── 综卦/错卦成对 32/32（编排者点名的全量结构自洽断言）─────────────────────────

/** 一个经卦「三爻顺序整体颠倒」（初↔上互换、二不动）——用于推导综卦。 */
function reverseTrigramLines(order: TrigramOrder): TrigramOrder {
  const [l0, l1, l2] = trigramByOrder(order).lines;
  return trigramOrderOf([l2, l1, l0]);
}

/** 一个经卦「逐爻阴阳互换」——用于推导错卦。 */
function invertTrigramLines(order: TrigramOrder): TrigramOrder {
  const flip = (l: YinYang): YinYang => (l === "yang" ? "yin" : "yang");
  const [l0, l1, l2] = trigramByOrder(order).lines;
  return trigramOrderOf([flip(l0), flip(l1), flip(l2)]);
}

/** 综卦即自身的四对——这四对必须改走错卦，而不是综卦（PRD §16-8 附加点名）。 */
const SELF_REVERSE_FIRST_ORDERS = new Set([1, 27, 29, 61]); // 乾(1)/颐(27)/坎(29)/中孚(61)——每对里序数较小的一个

describe("综卦/错卦成对 32/32（只用 order + (lowerOrder,upperOrder) 验证，不依赖卦辞/爻辞原文）", () => {
  it("通行本卦序两两成对：第 2k 卦 = 第 2k−1 卦的综卦；四对自综改走错卦（乾坤/颐大过/坎离/中孚小过）", () => {
    for (let k = 1; k <= 32; k++) {
      const first = hexagramByOrder(2 * k - 1)!;
      const second = hexagramByOrder(2 * k)!;

      // 综卦（整卦上下颠倒）：新下卦 = 原上卦三爻颠倒，新上卦 = 原下卦三爻颠倒
      const zongLower = reverseTrigramLines(first.upperOrder as TrigramOrder);
      const zongUpper = reverseTrigramLines(first.lowerOrder as TrigramOrder);
      const isZongPair = zongLower === second.lowerOrder && zongUpper === second.upperOrder;

      if (SELF_REVERSE_FIRST_ORDERS.has(first.order)) {
        expect(isZongPair, `order=${first.order}/${second.order}：自综卦不该恰好等于下一卦（那样就不需要改走错卦了）`).toBe(false);
        const cuoLower = invertTrigramLines(first.lowerOrder as TrigramOrder);
        const cuoUpper = invertTrigramLines(first.upperOrder as TrigramOrder);
        expect(cuoLower, `order=${first.order}/${second.order} 错卦下卦`).toBe(second.lowerOrder);
        expect(cuoUpper, `order=${first.order}/${second.order} 错卦上卦`).toBe(second.upperOrder);
      } else {
        expect(isZongPair, `order=${first.order}/${second.order} 应互为综卦`).toBe(true);
      }
    }
  });

  it("四个「自综」标记点确实名副其实：乾(1)/颐(27)/坎(29)/中孚(61) 综卦算出来都等于自身", () => {
    for (const order of SELF_REVERSE_FIRST_ORDERS) {
      const first = hexagramByOrder(order)!;
      const zongLower = reverseTrigramLines(first.upperOrder as TrigramOrder);
      const zongUpper = reverseTrigramLines(first.lowerOrder as TrigramOrder);
      expect(zongLower, `order=${order} 综卦下卦`).toBe(first.lowerOrder);
      expect(zongUpper, `order=${order} 综卦上卦`).toBe(first.upperOrder);
    }
  });
});

// ───────────────────────── gua.ts 繁简分层：正向断言，不只是注释（team-lead 2026-08-30 追加）─────────────────────────
//
// 设计：`Hexagram.name` 是**派生显示名**，恒为简体；`Hexagram.lower`/`upper` 是**引用层**，
// 抄自源页「離下坎上」标注，恒保持源文繁体（含 兌/離，与 `trigrams.ts` 的简体 兑/离 不同）。
// 这是刻意分层，不是「统一简繁时漏改了一半」——gua.ts 文件头与字段注释已经写清楚，但注释
// 拦不住手快的人，这里补三条断言把设计钉死：①name 无繁体残留 ②lower/upper 恒源文形态、
// 且与 trigrams.ts 的简体名刻意不同 ③按 lower/upper 字符串去 trigrams.ts 查表会静默失败，
// 用真实数据演示「所以必须用数字键」，而不是只在注释里断言。

describe("gua.ts 的 name（简体）与 lower/upper（引用层原文繁体）—— 分层设计，正向断言", () => {
  it("64 条 name 全部是简体：不含 guaName 阵营特有的繁体字，也不含自然象词的繁体形（PRD 交接包 dev-data 补的坑）", () => {
    // 黑名单两段拼起来：
    //   ① 逐字核对自 64 条 guaName 拼接后的字符集——只收「确有不同简体写法」的字，
    //      同形字（乾坤屯蒙需比…）不收，收了也是白收（对断言没有任何判别力，等于永真）。
    //   ② 「澤/風」——name 是「上卦自然象+下卦自然象+卦名」拼出来的（如「泽天夬」），
    //      自然象来自 `trigrams.ts` 的简体 nature 栏；guaName 从不含自然象词，
    //      所以①漏了这两个字，得单独补，否则「泽」被误写成「澤」这类残留测不出来。
    const TRADITIONAL_ONLY_CHARS = [
      "訟", "師", "謙", "隨", "蠱", "臨", "觀", "賁", "剝", "復", "頤", "過",
      "離", "恆", "遯", "壯", "晉", "損", "漸", "歸", "豐", "兌", "渙", "節", "濟",
      "澤", "風",
    ] as const;
    const offenders: string[] = [];
    for (const h of HEXAGRAMS) {
      for (const ch of TRADITIONAL_ONLY_CHARS) {
        if (h.name.includes(ch)) offenders.push(`order=${h.order} name="${h.name}" 含繁体字「${ch}」`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("lower/upper 恒为源文形态：8 种经卦名字符串里含「兌」「離」，不含简体的「兑」「离」", () => {
    const usedNames = new Set(HEXAGRAMS.flatMap((h) => [h.lower, h.upper]));
    expect(usedNames.size, "经卦名字符串应恰好 8 种（先天序 1–8 各一种源文写法）").toBe(8);
    expect(usedNames.has("兌"), "应含源文繁体「兌」").toBe(true);
    expect(usedNames.has("離"), "应含源文繁体「離」").toBe(true);
    expect(usedNames.has("兑"), "不该出现简体「兑」——那是 trigrams.ts 的写法，混进 gua.ts 就是漏改").toBe(false);
    expect(usedNames.has("离"), "不该出现简体「离」——同上").toBe(false);
  });

  it("对照 trigrams.ts：兌≠兑、離≠离，两者用字不同是刻意的分层设计（不是「统一简繁时漏改了一半」）", () => {
    const guaTrigramNames = new Set(HEXAGRAMS.flatMap((h) => [h.lower, h.upper]));
    const simplifiedNames = new Set(TRIGRAMS.map((t) => t.name));
    // 六个同形字（乾坤震巽坎艮）两边都有；「兌」只在 gua.ts 一侧出现，「兑」只在 trigrams.ts 一侧出现
    const onlyInGua = [...guaTrigramNames].filter((n) => !simplifiedNames.has(n)).sort();
    const onlyInTrigrams = [...simplifiedNames].filter((n) => !guaTrigramNames.has(n)).sort();
    expect(onlyInGua).toEqual(["兌", "離"].sort());
    expect(onlyInTrigrams).toEqual(["兑", "离"].sort());
  });
});

describe("防呆：按 lower/upper 字符串去 trigrams.ts 查表会静默失败——所以查表必须走数字键（gua.ts §80-82 注释的可执行版本）", () => {
  it("凡 lower/upper 为「兌」或「離」的卦（实测 28/64，占 44%），用字符串去 TRIGRAMS 里找会查不到（返回 undefined）", () => {
    // ⚠️ 下面 `TRIGRAMS.find(t => t.name === h.lower)` 是刻意演示的反面写法——
    // 不是本项目真正会用的代码路径（真代码经 `trigramByOrder(h.lowerOrder)` 走数字键）。
    const affected = HEXAGRAMS.filter((h) => [h.lower, h.upper].some((n) => n === "兌" || n === "離"));
    expect(affected.length, "含兌/離的卦，与 gua.ts 注释里记的实测数一致").toBe(28);
    for (const h of affected) {
      if (h.lower === "兌" || h.lower === "離") {
        expect(TRIGRAMS.find((t) => t.name === h.lower), `order=${h.order} lower="${h.lower}" 字符串查表应静默失败`).toBeUndefined();
      }
      if (h.upper === "兌" || h.upper === "離") {
        expect(TRIGRAMS.find((t) => t.name === h.upper), `order=${h.order} upper="${h.upper}" 字符串查表应静默失败`).toBeUndefined();
      }
    }
  });

  it("对照组：改用 lowerOrder/upperOrder 数字键查表——64/64 全部命中，证明「必须用数字键」这条路径是通的", () => {
    for (const h of HEXAGRAMS) {
      expect(trigramByOrder(h.lowerOrder as TrigramOrder).order, `order=${h.order} 下卦`).toBe(h.lowerOrder);
      expect(trigramByOrder(h.upperOrder as TrigramOrder).order, `order=${h.order} 上卦`).toBe(h.upperOrder);
    }
  });
});
