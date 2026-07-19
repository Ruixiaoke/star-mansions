/**
 * 前后端接口契约类型（前端侧），对齐 docs/API_CONTRACT.md 与后端 backend/src/types/contract.ts。
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

export interface Reading {
  id: string;
  userId?: string;
  input: BirthInput;
  solarDate: string;
  benming: Benming;
  createdAt: string;
}
