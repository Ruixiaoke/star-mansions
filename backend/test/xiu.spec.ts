/**
 * 本命宿测算交叉校验（PRD §7 / §13 验收）——《宿曜经》本命宿。
 * 样本来自权威源：老黄历/查询站「本命星宿」字段 +《宿曜经》原文官方例子（见各用例注释）。
 */
import { describe, it, expect } from "vitest";
import { Solar } from "lunar-javascript";
import { computeBenmingXiu } from "../src/lib/xiu";
import { benmingXiuByLunar } from "../src/lib/xiuTable";
import type { BirthInput } from "../src/types/contract";

describe("benmingXiuByLunar —《宿曜经》按农历生日定本命宿", () => {
  // 12 个交叉校验样本（PRD §13）：农历(月,日) → 期望本命宿
  const CASES: [number, number, string, string][] = [
    [4, 10, "轸", "老黄历本命字段（1990/2005/2018 三年同值）"],
    [4, 14, "房", "老黄历本命字段"],
    [7, 15, "室", "查询站本命字段"],
    [10, 6, "虚", "查询站本命字段"],
    [1, 6, "昴", "查询站本命字段"],
    [9, 10, "室", "《宿曜经》官方例 A"],
    [7, 11, "斗", "《宿曜经》官方例 B"],
    [5, 5, "星", "文民站官方例"],
    [1, 1, "室", "万年历正月序"],
    [1, 2, "壁", "万年历正月序"],
    [1, 3, "奎", "万年历正月序"],
    [4, 15, "心", "望日应落回望宿（自洽）"],
  ];
  for (const [m, d, exp, src] of CASES) {
    it(`农历${m}月${d}日 → ${exp}（${src}）`, () => {
      expect(benmingXiuByLunar(m, d)).toBe(exp);
    });
  }

  it("恒不含「牛」宿（宿曜经 27 宿去牛）", () => {
    const seen = new Set<string>();
    for (let m = 1; m <= 12; m++) for (let d = 1; d <= 30; d++) seen.add(benmingXiuByLunar(m, d));
    expect(seen.has("牛")).toBe(false);
    expect(seen.size).toBe(27); // 覆盖 27 宿
  });

  it("非法农历月/日抛错（不臆造）", () => {
    expect(() => benmingXiuByLunar(13, 1)).toThrow();
    expect(() => benmingXiuByLunar(4, 31)).toThrow();
  });
});

describe("computeBenmingXiu — 端到端（公历/农历输入）", () => {
  it("本命宿与年份无关：农历四月初十在 1990/2005/2018 三年均为「轸水蚓」（PRD §13）", () => {
    for (const [y, mo, da] of [[1990, 5, 4], [2005, 5, 17], [2018, 5, 24]]) {
      const r = computeBenmingXiu({ calendar: "solar", year: y, month: mo, day: da, hour: null });
      expect(r.benming.fullName).toBe("轸水蚓");
      expect(r.benming.siXiang).toBe("朱雀");
    }
  });

  it("公历与其对应农历，算出同一个本命宿（PRD §13 第 1 条）", () => {
    const bySolar = computeBenmingXiu({ calendar: "solar", year: 1990, month: 5, day: 4, hour: null });
    const l = Solar.fromYmd(1990, 5, 4).getLunar();
    const m = l.getMonth(); // 闰月为负
    const lunarInput: BirthInput = {
      calendar: "lunar",
      year: l.getYear(),
      month: Math.abs(m),
      day: l.getDay(),
      hour: null,
      isLeapMonth: m < 0,
    };
    const byLunar = computeBenmingXiu(lunarInput);
    expect(byLunar.benming.xiu).toBe(bySolar.benming.xiu);
    expect(byLunar.benming.fullName).toBe("轸水蚓");
  });

  it("fullName = 宿+七政+动物，四象归类落在四象内", () => {
    const r = computeBenmingXiu({ calendar: "solar", year: 1990, month: 5, day: 4, hour: null });
    expect(["青龙", "朱雀", "白虎", "玄武"]).toContain(r.benming.siXiang);
    expect(r.benming.fullName).toBe(`${r.benming.xiu}${r.benming.zheng}${r.benming.animal}`);
  });

  it("时辰不确定（hour=null）→ timeZhi 为 null，仍照常出本命宿", () => {
    const r = computeBenmingXiu({ calendar: "solar", year: 1990, month: 5, day: 4, hour: null });
    expect(r.timeZhi).toBeNull();
    expect(r.benming.xiu).toBeTruthy();
  });

  it("给定时辰 → timeZhi 为地支（14 点 = 未时），且不改变本命宿", () => {
    const withHour = computeBenmingXiu({ calendar: "solar", year: 1990, month: 5, day: 4, hour: 14 });
    const noHour = computeBenmingXiu({ calendar: "solar", year: 1990, month: 5, day: 4, hour: null });
    expect(withHour.timeZhi).toBe("未");
    expect(withHour.benming.xiu).toBe(noHour.benming.xiu); // 时辰不改变本命宿
  });
});
