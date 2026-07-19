/** 入参校验：把未知 JSON 收敛成合法 BirthInput，否则返回错误。 */
import type { BirthInput, ApiError } from "../types/contract";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: ApiError };

function toInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;
}

function fail(message: string): Parsed<never> {
  return { ok: false, error: { error: "INVALID_INPUT", message } };
}

export function parseBirthInput(raw: unknown): Parsed<BirthInput> {
  if (typeof raw !== "object" || raw === null) return fail("请求体必须是 JSON 对象");
  const o = raw as Record<string, unknown>;

  if (o.calendar !== "solar" && o.calendar !== "lunar")
    return fail("calendar 必须是 'solar' 或 'lunar'");

  const year = toInt(o.year);
  const month = toInt(o.month);
  const day = toInt(o.day);
  if (year === null || year < 1900 || year > 2100) return fail("year 需在 1900–2100 之间");
  if (month === null || month < 1 || month > 12) return fail("month 需在 1–12 之间");
  if (day === null || day < 1 || day > 31) return fail("day 需在 1–31 之间");

  let hour: number | null = null;
  if (o.hour !== undefined && o.hour !== null) {
    const h = toInt(o.hour);
    if (h === null || h < 0 || h > 23) return fail("hour 需在 0–23 之间，或省略表示时辰不确定");
    hour = h;
  }

  const isLeapMonth = o.isLeapMonth === true;
  return { ok: true, value: { calendar: o.calendar, year, month, day, hour, isLeapMonth } };
}
