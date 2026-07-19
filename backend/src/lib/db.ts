/**
 * Supabase 客户端（服务端专用）—— PRD §15-a 选定 Supabase。
 *
 * env-gated：无 SUPABASE_URL / SUPABASE_SECRET_KEY 时返回 null → handler 回落到内存 mock
 *   （本地无凭据 / 单测无需真库也能跑）。
 * ⚠️ 铁律 §0-3：只用 service secret key，仅在后端；绝不下发前端；密钥走 env（Vercel 项目 env / 本地 .env），不进 git。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/** 取 Supabase 客户端；未配置 env 时返回 null（调用方据此回落 mock）。 */
export function getDb(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  cached = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return cached;
}

export function isDbEnabled(): boolean {
  return getDb() !== null;
}
