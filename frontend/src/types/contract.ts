/**
 * 前后端接口契约类型（前端侧），对齐 docs/technical/API_CONTRACT.md 与后端 backend/src/types/contract.ts。
 */

export type Calendar = "solar" | "lunar";
export type SiXiang = "青龙" | "朱雀" | "白虎" | "玄武";
export type Direction = "东方" | "南方" | "西方" | "北方";

export interface BirthInput {
  calendar: Calendar;
  year: number;
  month: number;
  day: number;
  hour?: number | null;
  isLeapMonth?: boolean;
}

export interface Benming {
  xiu: string;
  zheng: string;
  animal: string;
  fullName: string;
  siXiang: SiXiang;
  direction: Direction;
}

export interface ComputeResponse {
  input: BirthInput;
  solarDate: string;
  lunarDate: string;
  benming: Benming;
  timeZhi: string | null;
  disclaimer: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Reading {
  id: string;
  userId?: string;
  input: BirthInput;
  solarDate: string;
  benming: Benming;
  createdAt: string;
}

/** 卦例类型；本期恒为 "liuyao"（六爻 PRD §11） */
export type DivinationKind = "liuyao";

/**
 * 所问事项（六爻 PRD §7.1）。与 src/data/liuyao-topics.ts 的 TopicKey 同集合，
 * 后端 backend/src/types/contract.ts 另存一份（不能跨端 import），加分类时三处一起改。
 * 枚举而非 string 是隐私设计（PRD §14）：不允许自由文本落库。
 */
export type DivinationTopic =
  | "mou"
  | "yu"
  | "guo"
  | "zhi"
  | "zheng"
  | "career"
  | "wealth"
  | "relationship";

export interface DivinationRecord {
  id: string;
  userId: string;
  kind: DivinationKind;
  topic: DivinationTopic;
  /** 卦码，六个爻数，如 "987678" */
  code: string;
  payload: unknown;
  createdAt: string;
}
