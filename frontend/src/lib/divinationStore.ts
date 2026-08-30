/**
 * divinationStore —— 卦例存取封装（六爻 PRD §11 / §14 · 产物 C5）。
 * 调后端 `/api/divination`（Supabase 持久化，跨设备）；作用域由 authAdapter 的软会话 token 决定。
 * 比照 `lib/readingStore.ts` 的分法：页面不直接 fetch，只经这一层。
 *
 * ⚠️ **未登录一律不发写请求**（PRD §16-28）：三个方法在没有 token 时**本地就抛**，请求不出门 ——
 *    未登录能完整起卦看结果，但不产生任何后端痕迹（铁律 §0-3「未登录不强制留存」）。
 *    抛的是 `ApiClientError`，页面按既有 `instanceof ApiClientError` 一路处理即可。
 * ⚠️ `kind` 是**字面量类型** `"liuyao"`（contract.ts 的 `DivinationKind`），不是 `string`：
 *    后端同样只收 `"liuyao"`，其余一律 400（见 API_CONTRACT §4）。将来加新玩法要同时改两处。
 * ⚠️ 隐私（PRD §14）：删除走 `DELETE`，服务端是**物理删除**、不做软删标记；
 *    本层不往 console 打 `topic` 值（`user_id + topic + created_at` 合起来即行为画像）。
 */
import type { DivinationKind, DivinationRecord, DivinationTopic } from "../types/contract";
import type { Toss, Yao, YaoPosition } from "./liuyao";
import { apiGet, apiPost, apiDelete, ApiClientError } from "./api";
import { authAdapter } from "./authAdapter";

/** 本期唯一的卦例类型。写成 `const` 而非裸字符串，赋给 `DivinationKind` 才不会退化成 `string`。 */
export const LIUYAO_KIND: DivinationKind = "liuyao";

/**
 * 存进 `DivinationRecord.payload` 的卦快照（对齐 API_CONTRACT §4 的示例字段）。
 * 卦码（`code`）已足以还原整卦（PRD §5.5），快照另存 `tosses` 是为了留下「这一卦是怎么掷出来的」，
 * 回看时**不重新掷**、也不重新算随机。
 */
export interface LiuyaoPayload {
  tosses: Toss[];
  yaos: Yao[];
  /** 本卦的通行本卦序 1–64。 */
  primaryOrder: number;
  /** 之卦卦序；**无动爻时为 `null`**（PRD §5.4，不造「同上」的空壳）。 */
  changedOrder: number | null;
  movingPositions: YaoPosition[];
}

/** 未登录时本地抛的错，与后端 401 同一个 code，页面不必分两路处理。 */
function requireToken(): string {
  const token = authAdapter.token();
  if (!token) throw new ApiClientError("UNAUTHORIZED", "请先登录后再保存卦例");
  return token;
}

export const divinationStore = {
  /**
   * `topic` 收 `DivinationTopic` 而不是 `string`（同 `kind` 的道理）：
   * 「枚举而非自由文本」是 PRD §14 的刻意隐私设计，API 层已补上运行时校验（非法 → 400）；
   * 这里收窄类型是它在前端的镜像 —— 否则本层只在**运行时**吃那个 400，
   * 类型系统拦不住「传任意字符串进来」的调用。收窄后整条链路闭环。
   */
  async save(entry: { topic: DivinationTopic; code: string; payload: LiuyaoPayload }): Promise<DivinationRecord> {
    const token = requireToken();
    const { divination } = await apiPost<{ divination: DivinationRecord }>(
      "/api/divination",
      { kind: LIUYAO_KIND, topic: entry.topic, code: entry.code, payload: entry.payload },
      token,
    );
    return divination;
  },

  /** 列出当前用户的卦例（后端按 createdAt 倒序）。默认只取六爻这一类。 */
  async list(kind: DivinationKind = LIUYAO_KIND): Promise<DivinationRecord[]> {
    const token = requireToken();
    const { divinations } = await apiGet<{ divinations: DivinationRecord[] }>(
      `/api/divination?kind=${encodeURIComponent(kind)}`,
      token,
    );
    return divinations;
  },

  async remove(id: string): Promise<void> {
    const token = requireToken();
    await apiDelete<{ ok: true }>(`/api/divination?id=${encodeURIComponent(id)}`, token);
  },
};
