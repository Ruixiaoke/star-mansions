/**
 * authAdapter —— 登录接口（PRD §8：邮箱免验证直登 = 注册合一）。
 * scaffold 占位：本地 localStorage mock，不发网络请求。
 * 真后端阶段把实现换成调用 /api/auth（接口不变，页面层无感）。
 */
import type { User } from "../types/contract";

const KEY = "sm.user";

export const authAdapter = {
  /** 填邮箱即登录 / 建号（对邮箱 upsert 的本地占位）。 */
  login(email: string): User {
    const trimmed = email.trim();
    if (!/.+@.+\..+/.test(trimmed)) throw new Error("请输入有效邮箱");
    const user: User = {
      id: `u_${encodeURIComponent(trimmed)}`,
      email: trimmed,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem(KEY);
  },

  currentUser(): User | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};
