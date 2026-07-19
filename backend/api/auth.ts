/** Vercel serverless 入口：POST /api/auth（邮箱直登 = 注册合一，写 Supabase）。 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAuthLogin } from "../src/handlers/auth";
import { corsHeaders } from "../src/cors";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.origin))) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "请用 POST" });
    return;
  }
  const r = await handleAuthLogin(req.body);
  res.status(r.status).json(r.body);
}
