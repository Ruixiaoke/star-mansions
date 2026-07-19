/**
 * /api/auth 处理逻辑 —— 邮箱免验证直登 = 注册合一（PRD §8，对邮箱 upsert）。
 * 有 Supabase env → 写入 public.users；无 env → 回落内存 mock（本地/单测）。
 * ⚠️ 邮箱仅作软标识、未验证所有权；敏感数据保护以「未登录不强制留存 + 可删除」为准（§12）。
 * token = user.id（免验证直登下的软会话；history 端点据此作用域）。
 */
import type { AuthResponse, User } from "../types/contract";
import type { HandlerResult } from "./result";
import { getDb } from "../lib/db";

function emailToId(email: string): string {
  return `u_${encodeURIComponent(email)}`;
}

export async function handleAuthLogin(rawBody: unknown): Promise<HandlerResult<AuthResponse>> {
  const email =
    typeof rawBody === "object" && rawBody !== null
      ? (rawBody as Record<string, unknown>).email
      : undefined;

  if (typeof email !== "string" || !/.+@.+\..+/.test(email.trim())) {
    return { status: 400, body: { error: "INVALID_EMAIL", message: "需要有效的邮箱地址" } };
  }
  const trimmed = email.trim();
  const id = emailToId(trimmed);

  const db = getDb();
  if (!db) {
    // 无凭据：内存 mock（本地/单测）
    const user: User = { id, email: trimmed, createdAt: new Date().toISOString() };
    return { status: 200, body: { user, token: id } };
  }

  // upsert：首次填入 = 建号，再填 = 登录同一账号（PRD §8）
  const { data, error } = await db
    .from("users")
    .upsert({ id, email: trimmed }, { onConflict: "id" })
    .select("id, email, created_at")
    .single();

  if (error || !data) {
    return { status: 500, body: { error: "DB_ERROR", message: `登录失败：${error?.message ?? "无返回"}` } };
  }

  const user: User = { id: data.id, email: data.email, createdAt: data.created_at };
  return { status: 200, body: { user, token: user.id } };
}
