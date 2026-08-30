/**
 * /api/divination 处理逻辑 —— 保存 / 回看 / 删除卦例（六爻 PRD §11/§12/§14）。
 * 有 Supabase env → public.divinations；无 env → 回落进程内内存（本地/单测）。
 * 作用域：按 auth（= 登录返回的 token = user.id）过滤；无 auth → 401（未登录不留存/不回看）。
 * ⚠️ 隐私（六爻 PRD §14）：user_id + topic + created_at 合起来是行为画像 ——
 *    删除一律**物理删除**（不做软删标记）；日志里**不打印 topic 值**（本文件刻意不写任何 console 输出）。
 */
import type { DivinationRecord, DivinationKind, DivinationTopic } from "../types/contract";
import type { HandlerResult } from "./result";
import { getDb } from "../lib/db";

/**
 * 合法的所问事项（PRD §7.1）。后端不能 import 前端的 data/liuyao-topics.ts，故独立列一份 ——
 * **与那边的 TopicKey 必须同步，加分类时两处一起改**（同 kind 的道理：刻意让两处同步不可绕过）。
 * 为什么 API 层也要校验而不是「前端下拉框已经限住了」：绕过前端直接 POST 就能把自由文本写进
 * divinations.topic，而「枚举而非自由文本」是 PRD §14 的刻意隐私设计（§17：自由文本提问要先过隐私评估）。
 */
const TOPICS: readonly DivinationTopic[] = [
  "mou",
  "yu",
  "guo",
  "zhi",
  "zheng",
  "career",
  "wealth",
  "relationship",
];

const isTopic = (v: unknown): v is DivinationTopic => (TOPICS as readonly unknown[]).includes(v);

type Row = {
  id: string;
  user_id: string;
  kind: DivinationKind;
  topic: DivinationTopic;
  code: string;
  payload: unknown;
  created_at: string;
};

const COLUMNS = "id, user_id, kind, topic, code, payload, created_at";

const rowToDivination = (r: Row): DivinationRecord => ({
  id: r.id,
  userId: r.user_id,
  kind: r.kind,
  topic: r.topic,
  code: r.code,
  payload: r.payload,
  createdAt: r.created_at,
});

// 内存回落（无 Supabase env 时）——注意：Vercel serverless 不跨请求持久化，仅本地/单测用
const memStore: DivinationRecord[] = [];
let memSeq = 1;

const unauthorized = (): HandlerResult<never> => ({
  status: 401,
  body: { error: "UNAUTHORIZED", message: "请先登录" },
});

export async function handleDivinationList(
  auth: string | null,
  kind?: string,
): Promise<HandlerResult<{ divinations: DivinationRecord[] }>> {
  if (!auth) return unauthorized();
  const db = getDb();
  if (!db) {
    const list = memStore
      .filter((d) => d.userId === auth && (!kind || d.kind === kind))
      .slice()
      .reverse(); // 与 DB 侧一致：createdAt 倒序
    return { status: 200, body: { divinations: list } };
  }

  let query = db.from("divinations").select(COLUMNS).eq("user_id", auth);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return { status: 500, body: { error: "DB_ERROR", message: error.message } };
  return { status: 200, body: { divinations: (data as Row[]).map(rowToDivination) } };
}

export async function handleDivinationSave(
  auth: string | null,
  rawBody: unknown,
): Promise<HandlerResult<{ divination: DivinationRecord }>> {
  if (!auth) return unauthorized();
  if (typeof rawBody !== "object" || rawBody === null) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "请求体必须是 JSON 对象" } };
  }
  const o = rawBody as { kind?: unknown; topic?: unknown; code?: string; payload?: unknown };
  if (!o.kind || !o.topic || !o.code || o.payload === undefined || o.payload === null) {
    return { status: 400, body: { error: "INVALID_INPUT", message: "需要 kind / topic / code / payload 字段" } };
  }
  // kind 是字面量类型（DivinationKind）：校验过才敢当它用，否则「类型说的话」就是假的。
  // 将来加新玩法时，这里与 contract.ts 的 union 一起改（刻意让两处同步不可绕过）。
  if (o.kind !== "liuyao") {
    return { status: 400, body: { error: "INVALID_INPUT", message: '本期 kind 只接受 "liuyao"' } };
  }
  // topic 同理：枚举校验落在 API 层，前端下拉框只是第一道。
  // ⚠️ 错误信息里**不回显收到的 topic 值** —— 非法值可能正是用户手打的敏感自由文本（PRD §14），
  //    回显等于把它送进响应体与任何上游日志。只列合法值。
  if (!isTopic(o.topic)) {
    return {
      status: 400,
      body: { error: "INVALID_INPUT", message: `topic 只接受：${TOPICS.join(" / ")}` },
    };
  }

  const db = getDb();
  if (!db) {
    const divination: DivinationRecord = {
      id: `d_${memSeq++}`,
      userId: auth,
      kind: o.kind,
      topic: o.topic,
      code: o.code,
      payload: o.payload,
      createdAt: new Date().toISOString(),
    };
    memStore.push(divination);
    return { status: 200, body: { divination } };
  }

  const { data, error } = await db
    .from("divinations")
    .insert({ user_id: auth, kind: o.kind, topic: o.topic, code: o.code, payload: o.payload })
    .select(COLUMNS)
    .single();
  if (error || !data) return { status: 500, body: { error: "DB_ERROR", message: error?.message ?? "无返回" } };
  return { status: 200, body: { divination: rowToDivination(data as Row) } };
}

export async function handleDivinationDelete(
  auth: string | null,
  id: string | undefined,
): Promise<HandlerResult<{ ok: true }>> {
  if (!auth) return unauthorized();
  if (!id) return { status: 400, body: { error: "INVALID_INPUT", message: "需要卦例 id" } };

  const db = getDb();
  if (!db) {
    // 物理删除（PRD §14）：只删本人的记录，删不到就静默通过（不暴露他人记录是否存在）
    const i = memStore.findIndex((d) => d.id === id && d.userId === auth);
    if (i >= 0) memStore.splice(i, 1);
    return { status: 200, body: { ok: true } };
  }

  // .eq("user_id", auth) 不可省：否则任何 token 都能删他人卦例
  const { error } = await db.from("divinations").delete().eq("id", id).eq("user_id", auth);
  if (error) return { status: 500, body: { error: "DB_ERROR", message: error.message } };
  return { status: 200, body: { ok: true } };
}
