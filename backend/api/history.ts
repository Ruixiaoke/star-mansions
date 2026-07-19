/** Vercel serverless 入口：GET / POST / DELETE /api/history（Supabase 存取，按 Bearer token 作用域）。 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleHistoryList, handleHistorySave, handleHistoryDelete } from "../src/handlers/history";
import { corsHeaders } from "../src/cors";

/** 从 Authorization: Bearer <token> 取软会话 token（= user.id）。 */
function bearer(h: string | undefined): string | null {
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.origin))) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const auth = bearer(req.headers.authorization);

  if (req.method === "GET") {
    const r = await handleHistoryList(auth);
    res.status(r.status).json(r.body);
    return;
  }
  if (req.method === "POST") {
    const r = await handleHistorySave(auth, req.body);
    res.status(r.status).json(r.body);
    return;
  }
  if (req.method === "DELETE") {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    const r = await handleHistoryDelete(auth, id);
    res.status(r.status).json(r.body);
    return;
  }
  res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "用 GET / POST / DELETE" });
}
