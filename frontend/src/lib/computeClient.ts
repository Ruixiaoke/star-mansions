/**
 * 测算客户端 —— 可替换模块（PRD §7）。页面层只调这里，不直接碰 fetch/后端细节。
 * 真测算在后端 /api/compute（lunar-javascript）；此处仅发起 HTTP 调用。
 */
import type { BirthInput, ComputeResponse } from "../types/contract";
import { apiPost } from "./api";

export function computeBenmingXiu(input: BirthInput): Promise<ComputeResponse> {
  return apiPost<ComputeResponse>("/api/compute", input);
}
