/**
 * 本命宿测算交叉校验（PRD §13 验收）。
 * 说明：外部「已知本命宿样本」的权威值不臆造 —— 见文末 it.todo，待 Rick 提供并人工核对。
 */
import { describe, it, expect } from "vitest";
import { Solar } from "lunar-javascript";
import { computeBenmingXiu } from "../src/lib/xiu";
import type { BirthInput } from "../src/types/contract";

describe("computeBenmingXiu — 本命宿测算", () => {
  it("公历与其对应农历，算出同一个本命宿（PRD §13 第 1 条）", () => {
    const bySolar = computeBenmingXiu({ calendar: "solar", year: 1998, month: 6, day: 15, hour: null });

    const l = Solar.fromYmd(1998, 6, 15).getLunar();
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
  });

  it("四象归类落在四象内，fullName = 宿+七政+动物", () => {
    const r = computeBenmingXiu({ calendar: "solar", year: 1998, month: 6, day: 15, hour: null });
    expect(["青龙", "朱雀", "白虎", "玄武"]).toContain(r.benming.siXiang);
    expect(r.benming.fullName).toBe(`${r.benming.xiu}${r.benming.zheng}${r.benming.animal}`);
  });

  it("时辰不确定（hour=null）→ timeZhi 为 null，仍照常出本命宿", () => {
    const r = computeBenmingXiu({ calendar: "solar", year: 1998, month: 6, day: 15, hour: null });
    expect(r.timeZhi).toBeNull();
    expect(r.benming.xiu).toBeTruthy();
  });

  it("给定时辰 → timeZhi 为地支（14 点 = 未时，探针实测）", () => {
    const r = computeBenmingXiu({ calendar: "solar", year: 1998, month: 6, day: 15, hour: 14 });
    expect(r.timeZhi).toBe("未");
  });

  // 🚨 上线前硬性验收（PRD §7/§13）：≥3 个「外部已知本命宿」样本交叉校验。
  //    不臆造预期值 —— 待 Rick 提供权威样本、人工核对后，改成真实断言。
  it.todo("≥3 个已知本命宿样本交叉校验（待提供权威样本）");
});
