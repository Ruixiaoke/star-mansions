/**
 * 本地开发用最小 Express server —— 把与框架无关的 handlers 挂到 /api/* 路由。
 * 生产走 Vercel functions（backend/api/*.ts），两者复用同一组 handlers。
 * 起服务：npm -w backend run dev（tsx watch）。本地 env 由 dotenv 读 backend/.env。
 */
import "dotenv/config";
import express from "express";
import { corsHeaders } from "./cors";
import { handleCompute } from "./handlers/compute";
import { handleAuthLogin } from "./handlers/auth";
import { handleHistoryList, handleHistorySave, handleHistoryDelete } from "./handlers/history";
import { isDbEnabled } from "./lib/db";

const app = express();
app.use(express.json());

// CORS + 预检
app.use((req, res, next) => {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.origin))) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

/** 从 Authorization: Bearer <token> 取软会话 token（= user.id）。 */
function bearer(h: string | undefined): string | null {
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, db: isDbEnabled() }));

app.post("/api/compute", (req, res) => {
  const r = handleCompute(req.body);
  res.status(r.status).json(r.body);
});

app.post("/api/auth", async (req, res) => {
  const r = await handleAuthLogin(req.body);
  res.status(r.status).json(r.body);
});

app.get("/api/history", async (req, res) => {
  const r = await handleHistoryList(bearer(req.headers.authorization));
  res.status(r.status).json(r.body);
});

app.post("/api/history", async (req, res) => {
  const r = await handleHistorySave(bearer(req.headers.authorization), req.body);
  res.status(r.status).json(r.body);
});

app.delete("/api/history", async (req, res) => {
  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  const r = await handleHistoryDelete(bearer(req.headers.authorization), id);
  res.status(r.status).json(r.body);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(
    `[backend] dev server → http://localhost:${port}  (compute 真实；auth/history ${isDbEnabled() ? "→ Supabase" : "→ 内存 mock（未配 SUPABASE env）"}）`,
  );
});
