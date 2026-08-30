/**
 * 前后端接口契约类型（后端侧）。唯一契约 SoT = docs/technical/API_CONTRACT.md。
 * 前端 frontend/src/types/contract.ts 与本文件保持一致。
 */

export type Calendar = "solar" | "lunar";
export type SiXiang = "青龙" | "朱雀" | "白虎" | "玄武";
export type Direction = "东方" | "南方" | "西方" | "北方";

/** 生日输入（年月日 + 可选时辰） */
export interface BirthInput {
  calendar: Calendar;
  year: number;
  month: number;
  day: number;
  /** 0–23；省略 / null = 时辰不确定 */
  hour?: number | null;
  /** 仅农历闰月用；默认 false */
  isLeapMonth?: boolean;
}

/** 本命宿身份（后端只回身份，释义文案由前端本地库渲染） */
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
  /** 时辰地支；hour 省略时为 null（前端据此隐藏时辰辅助板块） */
  timeZhi: string | null;
  /** 红线 §0-1：结果附免责 */
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

/** 卦例类型；本期恒为 "liuyao"（六爻 PRD §11：divinations 表预留给将来别的玩法复用） */
export type DivinationKind = "liuyao";

/**
 * 所问事项（六爻 PRD §7.1）：Tier A =《周礼》八命 5 项，Tier B =《梅花易数》3 项。
 * ⚠️ 与 frontend/src/data/liuyao-topics.ts 的 TopicKey 是同一集合，后端不能跨端 import 故各存一份；
 *    **加 / 改分类时两处一起改**（漏改后端会把合法分类 400 掉）。
 * 定成枚举而非 string 是隐私设计（PRD §14）：topic 会连同 user_id + created_at 落库构成行为画像，
 * 不允许自由文本（PRD §17 把自由文本提问列为 Out of Scope，要加须先过隐私评估）。
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

/** 一条卦例记录（六爻 PRD §11/§12；payload = 卦的完整快照，存 jsonb） */
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
