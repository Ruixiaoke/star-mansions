/**
 * 后端 API 的 fetch 封装。基地址来自 VITE_API_BASE（见 .env.example）。
 * 前端经此一根 HTTP 线（+ 后端 CORS）访问后端；不在前端跑测算。
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

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok || data === null) {
    const err = data as ApiError | null;
    throw new ApiClientError(err?.error ?? "HTTP_ERROR", err?.message ?? `请求失败（${res.status}）`);
  }
  return data as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("NETWORK_ERROR", `连不上后端（${API_BASE}）——后端起了吗？CORS 配了吗？`);
  }
  return parse<T>(res);
}

export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`);
  } catch {
    throw new ApiClientError("NETWORK_ERROR", `连不上后端（${API_BASE}）`);
  }
  return parse<T>(res);
}

export { API_BASE };
