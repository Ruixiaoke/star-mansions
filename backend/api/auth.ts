/** Vercel serverless 入口：POST /api/auth（占位）。 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAuthLogin } from "../src/handlers/auth";
import { corsHeaders } from "../src/cors";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.origin))) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "请用 POST" });
    return;
  }
  const r = handleAuthLogin(req.body);
  res.status(r.status).json(r.body);
}
