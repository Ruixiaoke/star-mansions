/**
 * /api/history 处理逻辑 —— 占位（PRD §8/§9：保存 / 回看 Reading）。
 * scaffold 用进程内内存存储；真实现走 §15-a 存储选型（Supabase / Vercel PG·KV）。
 * ⚠️ 内存存储在 Vercel serverless 上不跨请求持久化，仅供本地 dev 演示占位。
 */
import type { Reading, BirthInput, Benming } from "../types/contract";
import type { HandlerResult } from "./result";

const store: Reading[] = [];
let seq = 1;

export function handleHistoryList(): HandlerResult<{ readings: Reading[] }> {
  return { status: 200, body: { readings: store } };
}

export function handleHistorySave(rawBody: unknown): HandlerResult<{ reading: Reading }> {
  if (typeof rawBody !== "object" || rawBody === null) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "请求体必须是 JSON 对象" } };
  }
  const o = rawBody as { input?: BirthInput; benming?: Benming; solarDate?: string };
  if (!o.input || !o.benming || !o.solarDate) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "需要 input / benming / solarDate 字段" } };
  }
  const reading: Reading = {
    id: `r_${seq++}`,
    input: o.input,
    benming: o.benming,
    solarDate: o.solarDate,
    createdAt: new Date().toISOString(),
  };
  store.push(reading);
  return { status: 200, body: { reading } };
}
