/**
 * 后端 API 的 fetch 封装。基地址来自 VITE_API_BASE（见 .env.example）。
 * 前端经此一根 HTTP 线（+ 后端 CORS）访问后端；不在前端跑测算。
 * 需登录的端点（history）带 Authorization: Bearer <token>（token = 登录返回的软会话）。
 */
import type { ApiError } from "../types/contract";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok || data === null) {
    const err = data as ApiError | null;
    throw new ApiClientError(err?.error ?? "HTTP_ERROR", err?.message ?? `请求失败（${res.status}）`);
  }
  return data as T;
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("NETWORK_ERROR", `连不上后端（${API_BASE}）——后端起了吗？CORS 配了吗？`);
  }
  return parse<T>(res);
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders(token) } });
  } catch {
    throw new ApiClientError("NETWORK_ERROR", `连不上后端（${API_BASE}）`);
  }
  return parse<T>(res);
}

export async function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: { ...authHeaders(token) } });
  } catch {
    throw new ApiClientError("NETWORK_ERROR", `连不上后端（${API_BASE}）`);
  }
  return parse<T>(res);
}

export { API_BASE };
