/**
 * authAdapter —— 登录接口（PRD §8：邮箱免验证直登 = 注册合一）。
 * login 调后端 /api/auth（对邮箱 upsert 到 Supabase），把 {user, token} 缓存到 localStorage 作软会话；
 * currentUser / token / logout 读本地缓存（同步，页面渲染用）。
 * 隐私红线 §0-3：可登出、可删记录/账号。
 */
import type { User, AuthResponse } from "../types/contract";
import { apiPost } from "./api";

const KEY = "sm.session";

interface Session {
  user: User;
  token: string;
}

function readSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export const authAdapter = {
  /** 填邮箱即登录 / 建号（后端对邮箱 upsert）。 */
  async login(email: string): Promise<User> {
    const trimmed = email.trim();
    if (!/.+@.+\..+/.test(trimmed)) throw new Error("请输入有效邮箱");
    const { user, token } = await apiPost<AuthResponse>("/api/auth", { email: trimmed });
    localStorage.setItem(KEY, JSON.stringify({ user, token }));
    return user;
  },

  logout(): void {
    localStorage.removeItem(KEY);
  },

  currentUser(): User | null {
    return readSession()?.user ?? null;
  },

  /** 软会话 token（history 端点鉴权用）。 */
  token(): string | null {
    return readSession()?.token ?? null;
  },
};
