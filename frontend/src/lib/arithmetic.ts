/**
 * 加减法计算器的纯逻辑（docs/prd/addition-subtraction-prd.md §4/§5）。
 * 与 UI 解耦：页面只负责渲染，校验与计算全在这里，便于单测与复核。
 * 用 bigint 承载数值，避免超大整数走 Number 丢精度（PRD §2「计算结果准确」）。
 */

export type Operator = "add" | "sub";

/** 三类输入错误（PRD §5 的场景表）。 */
export type ParseErrorKind = "empty" | "decimal" | "invalid";

export type ParseResult =
  | { ok: true; value: bigint }
  | { ok: false; error: ParseErrorKind };

/** 运算符号：减法用数学减号 U+2212（PRD §4.5 的算式示例 `5 − 8 = -3`）。 */
export const OPERATOR_SIGN: Record<Operator, string> = { add: "+", sub: "−" };

const INTEGER_RE = /^[+-]?\d+$/;
const DECIMAL_RE = /^[+-]?(?:\d+\.\d*|\.\d+)$/;

/** 全角符号 → 半角（全角数字另走码位偏移）。 */
const FULLWIDTH_SIGN: Record<string, string> = { "＋": "+", "－": "-", "−": "-", "．": "." };

/**
 * 归一化：trim 掉前后空格（含全角空格，PRD §5「自动忽略前后空格」），
 * 并把中文输入法常打出的全角数字/正负号折成半角 —— 它们语义上就是整数，
 * 判成「非法字符」会误伤。U+2212「−」也一并接受（结果区正是用它显示减号）。
 */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[＋－−．]/g, (c) => FULLWIDTH_SIGN[c]);
}

/** 解析单个整数输入：忽略前后空格，区分「空 / 小数 / 非法」（PRD §5）。 */
export function parseIntegerInput(raw: string): ParseResult {
  const s = normalize(raw);
  if (s === "") return { ok: false, error: "empty" };
  if (INTEGER_RE.test(s)) return { ok: true, value: BigInt(s.replace(/^\+/, "")) };
  if (DECIMAL_RE.test(s)) return { ok: false, error: "decimal" };
  return { ok: false, error: "invalid" };
}

/** 错误提示文案（PRD §5 表格逐字对应）。 */
export function errorMessage(field: "A" | "B", error: ParseErrorKind): string {
  switch (error) {
    case "empty":
      return `请输入整数 ${field}`;
    case "decimal":
      return "请输入整数，不支持小数";
    case "invalid":
      return "请输入有效的整数";
  }
}

export function compute(a: bigint, b: bigint, op: Operator): bigint {
  return op === "add" ? a + b : a - b;
}

/** 第二个操作数为负时加括号，避免 `5 − -3` 这种双符号连写；首项为负无歧义，不加。 */
function operand(v: bigint): string {
  return v < 0n ? `(${v})` : `${v}`;
}

/** 完整算式，如 `5 + 3 = 8` / `5 − 8 = -3` / `5 − (-3) = 8`（PRD §4.5）。 */
export function formatExpression(a: bigint, b: bigint, op: Operator): string {
  return `${a} ${OPERATOR_SIGN[op]} ${operand(b)} = ${compute(a, b, op)}`;
}

export type EvaluateResult =
  | { ok: true; value: bigint; expression: string }
  | { ok: false; errors: { a?: string; b?: string } };

/**
 * 页面提交时的唯一入口：两个输入都合法才计算；
 * 任一非法则**不计算**，返回逐字段错误提示（PRD §4.4）。
 */
export function evaluate(rawA: string, rawB: string, op: Operator): EvaluateResult {
  const a = parseIntegerInput(rawA);
  const b = parseIntegerInput(rawB);

  if (!a.ok || !b.ok) {
    return {
      ok: false,
      errors: {
        ...(a.ok ? {} : { a: errorMessage("A", a.error) }),
        ...(b.ok ? {} : { b: errorMessage("B", b.error) }),
      },
    };
  }

  return {
    ok: true,
    value: compute(a.value, b.value, op),
    expression: formatExpression(a.value, b.value, op),
  };
}
