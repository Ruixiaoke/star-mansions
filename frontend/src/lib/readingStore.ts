/**
 * readingStore —— 测算记录存取接口（PRD §8/§9）。
 * scaffold 占位：本地 localStorage mock。真后端阶段换成调用 /api/history（接口不变）。
 * 隐私红线 §0-3：记录可删除。
 */
import type { BirthInput, Benming, Reading } from "../types/contract";

const KEY = "sm.readings";

function readAll(): Reading[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Reading[];
  } catch {
    return [];
  }
}

function writeAll(list: Reading[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const readingStore = {
  save(entry: { input: BirthInput; solarDate: string; benming: Benming; userId?: string }): Reading {
    const list = readAll();
    const reading: Reading = {
      id: `r_${Date.now()}_${list.length}`,
      input: entry.input,
      solarDate: entry.solarDate,
      benming: entry.benming,
      userId: entry.userId,
      createdAt: new Date().toISOString(),
    };
    writeAll([reading, ...list]);
    return reading;
  },

  list(userId?: string): Reading[] {
    const all = readAll();
    return userId ? all.filter((r) => r.userId === userId) : all;
  },

  remove(id: string): void {
    writeAll(readAll().filter((r) => r.id !== id));
  },
};
