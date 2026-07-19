/**
 * /api/auth 处理逻辑 —— 占位（PRD §8：邮箱免验证直登 = 注册合一，对邮箱 upsert）。
 * scaffold 阶段不接真存储，回 mock user + token；真后端（§15-a）再替换。
 * ⚠️ 邮箱仅作软标识、未验证所有权；敏感数据保护以「未登录不强制留存 + 可删除」为准。
 */
import type { AuthResponse } from "../types/contract";
import type { HandlerResult } from "./result";

export function handleAuthLogin(rawBody: unknown): HandlerResult<AuthResponse> {
  const email =
    typeof rawBody === "object" && rawBody !== null
      ? (rawBody as Record<string, unknown>).email
      : undefined;

  if (typeof email !== "string" || !/.+@.+\..+/.test(email)) {
    return { status: 400, body: { error: "INVALID_EMAIL", message: "需要有效的邮箱地址" } };
  }

  return {
    status: 200,
    body: {
      user: { id: `u_${encodeURIComponent(email)}`, email, createdAt: new Date().toISOString() },
      token: "mock-session-token",
    },
  };
}
