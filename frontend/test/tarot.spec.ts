/**
 * 三张牌塔罗 —— 引擎单测（docs/prd/tarot-prd.md §6/§7/§9.4，验收 §15「抽牌逻辑」「输入校验」两组）。
 * 写法/目录约定对齐 backend/test/xiu.spec.ts、frontend/test/arithmetic.spec.ts（test/*.spec.ts + describe/it/expect）。
 *
 * ⚠️ 内容隔离（团队协作约束）：`data/tarot-readings.ts` 正被内容工位并发改写（78 张释义正在灌入）。
 * 本文件**不断言任何具体释义文案/关键词/sourceQuote 文本**，只断言结构性 / 统计性 / 规则性质
 * （数组长度、取值域、分布、幂等、拼接前缀、错误类型）——这样内容工位改文件不会让本文件偶发红。
 * `positionalText` 测试虽然读取了 `card.upright.byPosition` / `card.reversed.reversedLens`，
 * 但只做「自我引用」式比对（拿同一张卡自己的字段互相核对结构关系），不写死任何具体中文/英文字词，
 * 因此对内容工位的编辑天然免疫。
 *
 * 综合解读（§9.3 buildSummary）、内容与红线相关的验收条目**不在本文件范围**——
 * 团队分工里这一轮只做 §15「抽牌逻辑」+「输入校验」，见交付报告「没覆盖到的」一节。
 */
import { describe, it, expect, vi } from "vitest";
import {
  DECK_SIZE,
  POSITIONS,
  shuffle,
  shuffleCodeOf,
  drawCards,
  parseDrawInput,
  clearFieldError,
  errorMessage,
  cardOf,
  positionalText,
  type DrawInput,
  type DrawPick,
  type DrawResult,
  type Triple,
} from "../src/lib/tarot";

// ───────────────────────── 洗牌（PRD §6.1 / §15）─────────────────────────

describe("shuffle — 牌序是完整排列（PRD §15「洗牌结果是 1–78 的完整排列」）", () => {
  it("单次洗牌：order 长度为 78，排序后等于 1..78（无重复、无缺失）", () => {
    const deck = shuffle();
    expect(deck.order).toHaveLength(DECK_SIZE);
    const sorted = [...deck.order].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: DECK_SIZE }, (_, i) => i + 1));
  });

  it("重复跑 50 次洗牌，每次都必须是完整排列（不是偶然一次对了）", () => {
    for (let i = 0; i < 50; i++) {
      const deck = shuffle();
      const sorted = [...deck.order].sort((a, b) => a - b);
      expect(sorted).toEqual(Array.from({ length: DECK_SIZE }, (_, i2) => i2 + 1));
    }
  });
});

describe("shuffle — orientations 形状（PRD §15「orientations 长度恒为 78，取值只有 upright/reversed」）", () => {
  it("长度恒为 78，且每个元素只能是 upright 或 reversed", () => {
    const deck = shuffle();
    expect(deck.orientations).toHaveLength(DECK_SIZE);
    for (const o of deck.orientations) {
      expect(["upright", "reversed"]).toContain(o);
    }
  });

  it("order 与 orientations 等长且一一对应（PRD §11 数据模型）", () => {
    const deck = shuffle();
    expect(deck.orientations).toHaveLength(deck.order.length);
  });
});

// ───────────────────────── 大样本统计（PRD §15）─────────────────────────

/**
 * 只洗一次大样本，供下面三个统计断言共用（避免每个 it() 各自重跑一遍洗牌拖慢整体）。
 * N=15600=78×200：让「固定位置期望频次」凑成整数 200，容差写起来更直观。
 * 本地实测 15600 次 shuffle() 耗时约 120ms，远低于 vitest 默认 5000ms 超时，不需要单独调大 timeout。
 */
const SAMPLE_N = 15600;
const SAMPLE_DECKS = Array.from({ length: SAMPLE_N }, () => shuffle());

describe(`shuffle — 大样本分布（N=${SAMPLE_N}，PRD §15「大样本统计」）`, () => {
  it("78 张牌落在任一固定位置的频次大致均匀（抽查首位/次位/中位/倒二/末位）", () => {
    // 期望频次 = N/78 = 200；多项分布下单个格子的 std ≈ sqrt(N·p·(1-p)) ≈ 14。
    // 用 [0.5x, 1.5x] = [100, 300] 这个区间，偏离期望值 100，约 7 个标准差——
    // 松到几乎不会因抽样波动误报，但紧到能拦住 sort(()=>Math.random()-0.5) 那种
    // 经典有偏分布（该写法会让首尾位置的分布明显偏离均匀，偏差远超这个量级）。
    const expected = SAMPLE_N / DECK_SIZE;
    const lower = expected * 0.5;
    const upper = expected * 1.5;
    for (const posIndex of [0, 1, 38, 76, 77]) {
      const freq = new Map<number, number>();
      for (const deck of SAMPLE_DECKS) {
        const id = deck.order[posIndex];
        freq.set(id, (freq.get(id) ?? 0) + 1);
      }
      // 每张牌在这个位置上都至少露过面——真出现系统性偏置（某些牌永远上不了这个位置）会在这里先炸
      expect(freq.size, `posIndex=${posIndex} 覆盖的牌数`).toBe(DECK_SIZE);
      for (const [id, count] of freq) {
        expect(count, `posIndex=${posIndex} id=${id} 频次=${count}`).toBeGreaterThanOrEqual(lower);
        expect(count, `posIndex=${posIndex} id=${id} 频次=${count}`).toBeLessThanOrEqual(upper);
      }
    }
  });

  it("每个位置的逆位比例 ≈ 50%（容差 ±4 个百分点）", () => {
    // 单个位置逆位比例的 std = sqrt(0.25/N) ≈ 0.4%（N=15600）；±4pp ≈ 10 倍标准差，
    // 定得够松以避免偶发红，但如果实现把 50/50 写错成别的比例（比如手滑写成概率 1/3），
    // 偏差会是两位数个百分点，照样能被这条拦住。
    const tolerance = 0.04;
    for (const posIndex of [0, 1, 38, 76, 77]) {
      const reversedCount = SAMPLE_DECKS.filter((d) => d.orientations[posIndex] === "reversed").length;
      const ratio = reversedCount / SAMPLE_N;
      expect(ratio, `posIndex=${posIndex} 逆位比例=${ratio}`).toBeGreaterThan(0.5 - tolerance);
      expect(ratio, `posIndex=${posIndex} 逆位比例=${ratio}`).toBeLessThan(0.5 + tolerance);
    }
  });

  it("朝向与牌 id 之间无相关性：任意一张牌自己的逆位比例也 ≈ 50%", () => {
    // 78 张牌在每次洗牌里必然各出现恰好一次（一个排列），所以每张牌在 N 次洗牌里的样本量就是 N=15600，
    // 统计功效比「固定位置」那组更高：std = sqrt(0.25/15600) ≈ 0.4%，容差给 ±5pp（约 12 倍标准差）。
    // 如果朝向掷骰跟牌 id 挂钩（比如洗牌实现里意外用牌 id 做随机种子/取模），
    // 某几张牌的逆位比例会明显偏离 50%，这条断言负责拦住这种耦合。
    const tolerance = 0.05;
    const totalByCard = new Map<number, { total: number; reversed: number }>();
    for (const deck of SAMPLE_DECKS) {
      for (let i = 0; i < deck.order.length; i++) {
        const id = deck.order[i];
        const entry = totalByCard.get(id) ?? { total: 0, reversed: 0 };
        entry.total += 1;
        if (deck.orientations[i] === "reversed") entry.reversed += 1;
        totalByCard.set(id, entry);
      }
    }
    expect(totalByCard.size).toBe(DECK_SIZE);
    for (const [id, { total, reversed }] of totalByCard) {
      expect(total, `id=${id} 应在 N 次洗牌里各出现一次`).toBe(SAMPLE_N);
      const ratio = reversed / total;
      expect(ratio, `id=${id} 逆位比例=${ratio}`).toBeGreaterThan(0.5 - tolerance);
      expect(ratio, `id=${id} 逆位比例=${ratio}`).toBeLessThan(0.5 + tolerance);
    }
  });
});

// ───────────────────────── shuffleCode（PRD §6.2 / §15「重新洗牌」）─────────────────────────

describe("shuffleCodeOf — 短码同时代表牌序与全部朝向（PRD §6.2 / §15）", () => {
  it("两次独立洗牌的短码通常不同（78! 排列 × 2^78 朝向，撞车概率可忽略）", () => {
    const a = shuffle();
    const b = shuffle();
    expect(a.shuffleCode).not.toBe(b.shuffleCode);
  });

  it("只改牌序（其余不变）→ 短码变化", () => {
    const deck = shuffle();
    const swappedOrder = [...deck.order];
    [swappedOrder[0], swappedOrder[1]] = [swappedOrder[1], swappedOrder[0]];
    const changedCode = shuffleCodeOf(swappedOrder, deck.orientations);
    expect(changedCode).not.toBe(deck.shuffleCode);
  });

  it("只改一张牌的朝向（牌序不变）→ 短码变化", () => {
    const deck = shuffle();
    const flippedOrientations = [...deck.orientations];
    flippedOrientations[0] = flippedOrientations[0] === "upright" ? "reversed" : "upright";
    const changedCode = shuffleCodeOf(deck.order, flippedOrientations);
    expect(changedCode).not.toBe(deck.shuffleCode);
  });

  it("牌序与朝向都不变 → 短码不变（可重复计算、非一次性随机值）", () => {
    const deck = shuffle();
    expect(shuffleCodeOf(deck.order, deck.orientations)).toBe(deck.shuffleCode);
    expect(shuffleCodeOf(deck.order, deck.orientations)).toBe(deck.shuffleCode);
  });
});

// ───────────────────────── 抽牌：不二次掷骰（PRD §6.4 / §15）─────────────────────────

describe("drawCards — 抽牌不二次掷骰（PRD §6.4 / §15）", () => {
  it("翻出的朝向 === orientations[数字-1]，覆盖三个输入槽位与边界数字", () => {
    const deck = shuffle();
    const triples: DrawInput[] = [
      { n1: 1, n2: 2, n3: 3 }, // 边界：最小值落在第一槽
      { n1: 78, n2: 1, n3: 2 }, // 边界：最大值落在第一槽
      { n1: 40, n2: 78, n3: 1 }, // 最大值落在第二槽
      { n1: 5, n2: 60, n3: 12 }, // PRD §15 明确点名的样例组合
    ];
    for (const input of triples) {
      const result = drawCards(deck, input);
      const numbers: Triple<number> = [input.n1, input.n2, input.n3];
      result.picks.forEach((pick, i) => {
        expect(pick.orientation).toBe(deck.orientations[numbers[i] - 1]);
      });
    }
  });

  it("结构性证据：抽牌阶段完全不调用随机源（而不只是数值凑巧相等）", () => {
    const deck = shuffle();
    const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
    spy.mockClear();
    drawCards(deck, { n1: 5, n2: 60, n3: 12 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ───────────────────────── 幂等（PRD §6.4 / §15）─────────────────────────

describe("drawCards — 幂等（PRD §15「同一副牌序+同样数字→同样三张牌、同样正逆」）", () => {
  it("同一副牌序 + 同样三个数字 → 牌、顺序、正逆、shuffleCode 全部一致", () => {
    const deck = shuffle();
    const input: DrawInput = { n1: 7, n2: 21, n3: 63 };
    const r1 = drawCards(deck, input);
    const r2 = drawCards(deck, input);
    expect(r2.picks.map((p) => p.card.id)).toEqual(r1.picks.map((p) => p.card.id));
    expect(r2.picks.map((p) => p.orientation)).toEqual(r1.picks.map((p) => p.orientation));
    expect(r2.picks.map((p) => p.position)).toEqual(r1.picks.map((p) => p.position));
    expect(r2.shuffleCode).toBe(r1.shuffleCode);
  });

  it("同一副牌序下，改数字再改回来，结果与最初一致（PRD §15「改数字重抽」）", () => {
    const deck = shuffle();
    const original = drawCards(deck, { n1: 7, n2: 21, n3: 63 });
    drawCards(deck, { n1: 3, n2: 4, n3: 5 }); // 中途「改数字」——deck 是只读快照，不会被这次调用影响
    const again = drawCards(deck, { n1: 7, n2: 21, n3: 63 });
    expect(again.picks.map((p) => p.card.id)).toEqual(original.picks.map((p) => p.card.id));
    expect(again.picks.map((p) => p.orientation)).toEqual(original.picks.map((p) => p.orientation));
  });
});

// ───────────────────────── 输入顺序决定位置（PRD §15）─────────────────────────

describe("drawCards — 输入顺序决定位置（PRD §15「5/60/12 与 12/60/5」）", () => {
  it("三张牌（含朝向）集合相同，位置分配不同", () => {
    const deck = shuffle();
    const a = drawCards(deck, { n1: 5, n2: 60, n3: 12 });
    const b = drawCards(deck, { n1: 12, n2: 60, n3: 5 });

    const idsOf = (r: DrawResult) => [...r.picks.map((p) => p.card.id)].sort((x, y) => x - y);
    expect(idsOf(a)).toEqual(idsOf(b));

    // 输入顺序里第一、第三个数字互换，第二个（60）不变 → 位置 1/3 互换，位置 2 不变
    expect(a.picks[0].card.id).toBe(b.picks[2].card.id);
    expect(a.picks[2].card.id).toBe(b.picks[0].card.id);
    expect(a.picks[1].card.id).toBe(b.picks[1].card.id);
    // 同一副牌序下，同一张牌的朝向不因抽牌顺序而变
    expect(a.picks[0].orientation).toBe(b.picks[2].orientation);
    expect(a.picks[2].orientation).toBe(b.picks[0].orientation);
    expect(a.picks[1].orientation).toBe(b.picks[1].orientation);

    // 位置分配确实不同：a 的「过去」是 b 的「指引」，而不是巧合地也一样
    expect(a.picks[0].inputNumber).toBe(5);
    expect(b.picks[0].inputNumber).toBe(12);
  });
});

// ───────────────────────── 重新洗牌（PRD §15）─────────────────────────

describe("重新洗牌（PRD §15「短码变化；短码同时代表牌序+全部朝向」）", () => {
  it("重新洗牌后短码变化，抽同样三个数字通常得到不同的牌或朝向", () => {
    const before = shuffle();
    const after = shuffle();
    expect(after.shuffleCode).not.toBe(before.shuffleCode);

    // 「通常不同」不是「保证不同」——只断言短码这个可验证的强不变量，
    // 具体牌是否变化属于随机结果，本条不对其做强断言（避免用错误的方式测随机性）。
  });

  it("旧结果与新牌序不同屏：drawCards 只读 DeckOrder 快照，重新洗牌不会改写旧结果对象", () => {
    const deck1 = shuffle();
    const oldResult = drawCards(deck1, { n1: 5, n2: 60, n3: 12 });
    const oldSnapshot = JSON.parse(JSON.stringify(oldResult));
    shuffle(); // 模拟「重新洗牌」——生成新的 DeckOrder，但不应影响已经产出的 oldResult
    expect(oldResult).toEqual(oldSnapshot);
  });
});

// ───────────────────────── 输入校验（PRD §7 / §15）─────────────────────────

describe("errorMessage — 四类错误文案逐字对应 PRD §7.3 表格", () => {
  it("empty / decimal / invalid / range 四类文案", () => {
    expect(errorMessage(0, "empty")).toBe("请填写第一个数字");
    expect(errorMessage(1, "empty")).toBe("请填写第二个数字");
    expect(errorMessage(2, "empty")).toBe("请填写第三个数字");
    expect(errorMessage(0, "decimal")).toBe("请输入整数，不支持小数");
    expect(errorMessage(0, "invalid")).toBe("请输入 1–78 之间的整数");
    expect(errorMessage(0, "range")).toBe("数字要在 1–78 之间");
  });
});

describe("parseDrawInput — 输入校验全表（PRD §7.3 / §15）", () => {
  it("某个输入为空 → 不放行，对应框给「请填写第 N 个数字」，其余框不报错", () => {
    const r = parseDrawInput(["", "10", "20"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.errors.fields[0]).toBe(errorMessage(0, "empty"));
    expect(r.errors.fields[1]).toBeNull();
    expect(r.errors.fields[2]).toBeNull();
    expect(r.errors.flagged).toEqual([true, false, false]);
    expect(r.errors.form).toBeNull();
  });

  it("空值落在第二 / 第三个数字时，序数词跟着变", () => {
    const r2 = parseDrawInput(["1", "", "3"]);
    expect(r2.ok).toBe(false);
    if (r2.ok) throw new Error("unreachable");
    expect(r2.errors.fields).toEqual([null, errorMessage(1, "empty"), null]);

    const r3 = parseDrawInput(["1", "2", ""]);
    expect(r3.ok).toBe(false);
    if (r3.ok) throw new Error("unreachable");
    expect(r3.errors.fields).toEqual([null, null, errorMessage(2, "empty")]);
  });

  it.each([
    ["0", "数字要在 1–78 之间"],
    ["79", "数字要在 1–78 之间"],
    ["-3", "数字要在 1–78 之间"],
  ])("输入 %s → 不放行，提示「%s」", (raw, message) => {
    const r = parseDrawInput([raw, "10", "20"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.errors.fields[0]).toBe(message);
  });

  it("输入 1.5（小数）→ 不放行，提示「请输入整数，不支持小数」", () => {
    const r = parseDrawInput(["1.5", "10", "20"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.errors.fields[0]).toBe(errorMessage(0, "decimal"));
  });

  it.each([["abc"], ["!@#"], ["七"], ["壹"], ["一二三"]])(
    "输入字母/符号/中文「%s」→ 不放行，提示范围文案",
    (raw) => {
      const r = parseDrawInput([raw, "10", "20"]);
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error("unreachable");
      expect(r.errors.fields[0]).toBe(errorMessage(0, "invalid"));
    },
  );

  it("三个数字有重复（7/7/9）→ 表单级错误 + 两个相关输入框标错误态", () => {
    const r = parseDrawInput(["7", "7", "9"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.errors.form).toBe("三个数字不能重复，同一张牌不会被翻两次");
    expect(r.errors.flagged).toEqual([true, true, false]);
    // 数字本身都合法：逐框错误不应该被「重复」这个表单级错误顶替
    expect(r.errors.fields).toEqual([null, null, null]);
  });

  it("三个数字两两都重复（7/7/7）→ 三个框都标错误态", () => {
    const r = parseDrawInput(["7", "7", "7"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.errors.form).toBe("三个数字不能重复，同一张牌不会被翻两次");
    expect(r.errors.flagged).toEqual([true, true, true]);
  });

  it("前后有空格（` 07 `）自动 trim，前导零照收 → 按 7 处理，不报错", () => {
    expect(parseDrawInput([" 07 ", "10", "20"])).toEqual({ ok: true, input: { n1: 7, n2: 10, n3: 20 } });
  });

  it("全角数字（７）自动转半角 → 按 7 处理，不报错", () => {
    expect(parseDrawInput(["７", "10", "20"])).toEqual({ ok: true, input: { n1: 7, n2: 10, n3: 20 } });
  });

  it("合法且互不重复 → 放行，输入原样映射到 n1/n2/n3", () => {
    expect(parseDrawInput(["5", "60", "12"])).toEqual({ ok: true, input: { n1: 5, n2: 60, n3: 12 } });
  });
});

describe("clearFieldError — 修改报错输入框后错误立即消失（PRD §7.2 / §15）", () => {
  it("清除单框错误后，该框错误消失，其余框不受影响", () => {
    const r = parseDrawInput(["", "abc", "20"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    const cleared = clearFieldError(r.errors, 0);
    expect(cleared.fields[0]).toBeNull();
    expect(cleared.flagged[0]).toBe(false);
    expect(cleared.fields[1]).toBe(errorMessage(1, "invalid")); // 未清除的框不受影响
    expect(cleared.flagged[1]).toBe(true);
  });

  it("清除被「重复」牵连的框时，连表单级错误一起撤销（PRD §7.2）", () => {
    const r = parseDrawInput(["7", "7", "9"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    const cleared = clearFieldError(r.errors, 0);
    expect(cleared.form).toBeNull();
    expect(cleared.flagged).toEqual([false, false, false]);
    expect(cleared.fields).toEqual([null, null, null]);
  });

  it("未标错误的框调用 clearFieldError 是安全的空操作", () => {
    const r = parseDrawInput(["1", "2", "abc"]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    const cleared = clearFieldError(r.errors, 0); // 第 0 框本来就没错
    expect(cleared.fields[0]).toBeNull();
    expect(cleared.fields[2]).toBe(errorMessage(2, "invalid")); // 第 2 框错误原样保留
  });
});

// ───────────────────────── positionalText（PRD §9.4 / §15）─────────────────────────

describe("positionalText — 正位走 byPosition，逆位走 frame+reversedLens 拼接（PRD §9.4）", () => {
  // 用愚者（id=1，牌库骨架里真实存在的 id）取牌；不断言其具体文案内容，只做结构性/自我引用比对，
  // 因此不依赖内容工位当前往 tarot-readings.ts 里写的是占位还是定稿文本。
  const card = cardOf(1);

  it("正位：每个位置直接取该位置在 byPosition 里对应的那一段（结构比对，不认字面文案）", () => {
    for (const meta of POSITIONS) {
      const pick: DrawPick = { position: meta.index, inputNumber: 1, card, orientation: "upright" };
      expect(positionalText(pick)).toBe(card.upright.byPosition[meta.key]);
    }
  });

  it("逆位：结果 = 该位置的框架句 + reversedLens 拼接，且以框架句开头", () => {
    for (const meta of POSITIONS) {
      const pick: DrawPick = { position: meta.index, inputNumber: 1, card, orientation: "reversed" };
      const text = positionalText(pick);
      expect(text.startsWith(meta.frame)).toBe(true);
      expect(text).toBe(`${meta.frame}${card.reversed.reversedLens}`);
    }
  });

  it("三个位置各有不同的框架句，故逆位在三个位置上的呈现文字互不相同（引擎层规则，不依赖内容）", () => {
    const texts = POSITIONS.map((meta) =>
      positionalText({ position: meta.index, inputNumber: 1, card, orientation: "reversed" }),
    );
    expect(new Set(texts).size).toBe(3);
    // 三条框架句本身两两不同——这是引擎规则层的事实，PRD §9.4 表格定义的三句本就不同
    expect(new Set(POSITIONS.map((m) => m.frame)).size).toBe(3);
  });
});
