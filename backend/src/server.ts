/**
 * 本地开发用最小 Express server —— 把与框架无关的 handlers 挂到 /api/* 路由。
 * 生产走 Vercel functions（backend/api/*.ts），两者复用同一组 handlers。
 * 起服务：npm -w backend run dev（tsx watch）。
 */
import express from "express";
import { corsHeaders } from "./cors";
import { handleCompute } from "./handlers/compute";
import { handleAuthLogin } from "./handlers/auth";
import { handleHistoryList, handleHistorySave } from "./handlers/history";

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

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/compute", (req, res) => {
  const r = handleCompute(req.body);
  res.status(r.status).json(r.body);
});

app.post("/api/auth", (req, res) => {
  const r = handleAuthLogin(req.body);
  res.status(r.status).json(r.body);
});

app.get("/api/history", (_req, res) => {
  const r = handleHistoryList();
  res.status(r.status).json(r.body);
});

app.post("/api/history", (req, res) => {
  const r = handleHistorySave(req.body);
  res.status(r.status).json(r.body);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`[backend] dev server → http://localhost:${port}  (真实端点：POST /api/compute)`);
});
