/**
 * 前后端接口契约类型（后端侧）。唯一契约 SoT = docs/API_CONTRACT.md。
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
