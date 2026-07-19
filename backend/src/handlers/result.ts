import type { ApiError } from "../types/contract";

/** 与框架无关的处理结果：HTTP 状态 + JSON 体（成功体或错误体）。 */
export interface HandlerResult<T> {
  status: number;
  body: T | ApiError;
}
