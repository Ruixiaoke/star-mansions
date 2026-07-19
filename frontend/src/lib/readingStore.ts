/**
 * readingStore —— 测算记录存取接口（PRD §8/§9）。
 * 调后端 /api/history（Supabase 持久化，跨设备）；作用域由 authAdapter 的软会话 token 决定。
 * 隐私红线 §0-3：记录可删除（remove）。
 */
import type { BirthInput, Benming, Reading } from "../types/contract";
import { apiGet, apiPost, apiDelete } from "./api";
import { authAdapter } from "./authAdapter";

export const readingStore = {
  async save(entry: { input: BirthInput; solarDate: string; benming: Benming }): Promise<Reading> {
    const { reading } = await apiPost<{ reading: Reading }>(
      "/api/history",
      { input: entry.input, solarDate: entry.solarDate, benming: entry.benming },
      authAdapter.token(),
    );
    return reading;
  },

  async list(): Promise<Reading[]> {
    const { readings } = await apiGet<{ readings: Reading[] }>("/api/history", authAdapter.token());
    return readings;
  },

  async remove(id: string): Promise<void> {
    await apiDelete<{ ok: true }>(`/api/history?id=${encodeURIComponent(id)}`, authAdapter.token());
  },
};
