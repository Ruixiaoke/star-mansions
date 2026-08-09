/**
 * arithmetic.ts 冒烟测试 —— 证明 frontend vitest harness 能跑，顺带覆盖一段
 * 目前零覆盖的纯逻辑（docs/prd/addition-subtraction-prd.md §4/§5）。
 * 写法/目录约定对齐 backend/test/xiu.spec.ts（test/*.spec.ts + describe/it/expect）。
 */
import { describe, it, expect } from "vitest";
import { parseIntegerInput, evaluate, formatExpression } from "../src/lib/arithmetic";

describe("parseIntegerInput — 输入校验（PRD §5 场景表）", () => {
  it("合法整数（含全角数字/正负号）解析为 bigint", () => {
    expect(parseIntegerInput("42")).toEqual({ ok: true, value: 42n });
    expect(parseIntegerInput("－３")).toEqual({ ok: true, value: -3n }); // 全角负号+数字
    expect(parseIntegerInput("  7  ")).toEqual({ ok: true, value: 7n }); // 前后空格忽略
  });

  it("空输入 → empty；小数 → decimal；其余非法 → invalid", () => {
    expect(parseIntegerInput("")).toEqual({ ok: false, error: "empty" });
    expect(parseIntegerInput("3.14")).toEqual({ ok: false, error: "decimal" });
    expect(parseIntegerInput("abc")).toEqual({ ok: false, error: "invalid" });
  });
});

describe("evaluate — 提交入口（PRD §4.4）", () => {
  it("两侧合法才计算，算式与结果一致", () => {
    const r = evaluate("5", "3", "add");
    expect(r).toEqual({ ok: true, value: 8n, expression: "5 + 3 = 8" });
  });

  it("任一非法则不计算，返回逐字段错误", () => {
    const r = evaluate("", "3.5", "sub");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.a).toBe("请输入整数 A");
      expect(r.errors.b).toBe("请输入整数，不支持小数");
    }
  });
});

describe("formatExpression — 负数第二操作数加括号（PRD §4.5）", () => {
  it("第二项为负时加括号，避免双符号连写", () => {
    expect(formatExpression(5n, -3n, "sub")).toBe("5 − (-3) = 8");
  });

  it("第二项非负则不加括号", () => {
    expect(formatExpression(5n, 8n, "sub")).toBe("5 − 8 = -3");
  });
});
