/**
 * CORS 头 —— 允许 ALLOWED_ORIGIN（可逗号分隔多个来源）。
 * L4「CORS 红灯实验」：先故意不配 → 前端跨域报错 → 再补上，红转绿。
 */
export function corsHeaders(requestOrigin: string | undefined): Record<string, string> {
  const allowedList = (process.env.ALLOWED_ORIGIN ?? "http://localhost:5173")
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
