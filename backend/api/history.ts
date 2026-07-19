/** Vercel serverless 入口：GET / POST /api/history（占位）。 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleHistoryList, handleHistorySave } from "../src/handlers/history";
import { corsHeaders } from "../src/cors";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.origin))) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method === "GET") {
    const r = handleHistoryList();
    res.status(r.status).json(r.body);
    return;
  }
  if (req.method === "POST") {
    const r = handleHistorySave(req.body);
    res.status(r.status).json(r.body);
    return;
  }
  res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "用 GET 或 POST" });
}
