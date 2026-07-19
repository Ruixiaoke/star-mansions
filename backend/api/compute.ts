/** Vercel serverless 入口：POST /api/compute（薄壳，转调与框架无关的 handler）。 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCompute } from "../src/handlers/compute";
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
  const r = handleCompute(req.body);
  res.status(r.status).json(r.body);
}
