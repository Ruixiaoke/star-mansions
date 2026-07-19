/**
 * /api/history 处理逻辑 —— 保存 / 回看 / 删除 Reading（PRD §8/§9；隐私红线 §0-3：可删除）。
 * 有 Supabase env → public.readings；无 env → 回落进程内内存（本地/单测）。
 * 作用域：按 auth（= 登录返回的 token = user.id）过滤；无 auth → 401（未登录不留存/不回看）。
 * ⚠️ 邮箱为软标识（PRD §8），此处按 user_id 作用域，不作强身份校验（MVP 刻意取舍）。
 */
import type { Reading, BirthInput, Benming } from "../types/contract";
import type { HandlerResult } from "./result";
import { getDb } from "../lib/db";

type Row = {
  id: string;
  user_id: string;
  input: BirthInput;
  solar_date: string;
  benming: Benming;
  created_at: string;
};

const rowToReading = (r: Row): Reading => ({
  id: r.id,
  userId: r.user_id,
  input: r.input,
  solarDate: r.solar_date,
  benming: r.benming,
  createdAt: r.created_at,
});

// 内存回落（无 Supabase env 时）——注意：Vercel serverless 不跨请求持久化，仅本地/单测用
const memStore: Reading[] = [];
let memSeq = 1;

const unauthorized = (): HandlerResult<never> => ({
  status: 401,
  body: { error: "UNAUTHORIZED", message: "请先登录" },
});

export async function handleHistoryList(auth: string | null): Promise<HandlerResult<{ readings: Reading[] }>> {
  if (!auth) return unauthorized();
  const db = getDb();
  if (!db) return { status: 200, body: { readings: memStore.filter((r) => r.userId === auth) } };

  const { data, error } = await db
    .from("readings")
    .select("id, user_id, input, solar_date, benming, created_at")
    .eq("user_id", auth)
    .order("created_at", { ascending: false });
  if (error) return { status: 500, body: { error: "DB_ERROR", message: error.message } };
  return { status: 200, body: { readings: (data as Row[]).map(rowToReading) } };
}

export async function handleHistorySave(
  auth: string | null,
  rawBody: unknown,
): Promise<HandlerResult<{ reading: Reading }>> {
  if (!auth) return unauthorized();
  if (typeof rawBody !== "object" || rawBody === null) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "请求体必须是 JSON 对象" } };
  }
  const o = rawBody as { input?: BirthInput; benming?: Benming; solarDate?: string };
  if (!o.input || !o.benming || !o.solarDate) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "需要 input / benming / solarDate 字段" } };
  }

  const db = getDb();
  if (!db) {
    const reading: Reading = {
      id: `r_${memSeq++}`,
      userId: auth,
      input: o.input,
      benming: o.benming,
      solarDate: o.solarDate,
      createdAt: new Date().toISOString(),
    };
    memStore.push(reading);
    return { status: 200, body: { reading } };
  }

  const { data, error } = await db
    .from("readings")
    .insert({ user_id: auth, input: o.input, solar_date: o.solarDate, benming: o.benming })
    .select("id, user_id, input, solar_date, benming, created_at")
    .single();
  if (error || !data) return { status: 500, body: { error: "DB_ERROR", message: error?.message ?? "无返回" } };
  return { status: 200, body: { reading: rowToReading(data as Row) } };
}

export async function handleHistoryDelete(
  auth: string | null,
  id: string | undefined,
): Promise<HandlerResult<{ ok: true }>> {
  if (!auth) return unauthorized();
  if (!id) return { status: 400, body: { error: "INVALID_INPUT", message: "需要记录 id" } };

  const db = getDb();
  if (!db) {
    const i = memStore.findIndex((r) => r.id === id && r.userId === auth);
    if (i >= 0) memStore.splice(i, 1);
    return { status: 200, body: { ok: true } };
  }

  const { error } = await db.from("readings").delete().eq("id", id).eq("user_id", auth);
  if (error) return { status: 500, body: { error: "DB_ERROR", message: error.message } };
  return { status: 200, body: { ok: true } };
}
