/**
 * CORS 头 —— 允许来源列表。
 * 默认放行本地 dev + 生产 Pages 域名；线上可用 ALLOWED_ORIGIN 环境变量覆盖/扩展（逗号分隔）。
 * L4「CORS 红灯实验」：先故意不配 → 前端跨域报错 → 再补上，红转绿。
 */
const DEFAULT_ALLOWED = "http://localhost:5173,https://ruixiaoke.github.io";

export function corsHeaders(requestOrigin: string | undefined): Record<string, string> {
  const allowedList = (process.env.ALLOWED_ORIGIN ?? DEFAULT_ALLOWED)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin =
    requestOrigin && allowedList.includes(requestOrigin) ? requestOrigin : allowedList[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
