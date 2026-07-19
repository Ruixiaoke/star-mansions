/**
 * 本命宿测算引擎 —— 唯一封装 lunar-javascript 的地方（PRD §7 / CLAUDE §3）。
 * 可替换模块：换库 / 换体系不影响 handler 与前端（DIP）。
 *
 * 本命宿按「日」定；时辰不改变本命宿，只驱动前端「时辰辅助」板块。
 */
import { Solar, Lunar } from "lunar-javascript";
import type { BirthInput, Benming } from "../types/contract";
import { siXiangOf, directionOf } from "./xiuTable";

export interface XiuComputed {
  benming: Benming;
  solarDate: string;
  lunarDate: string;
  timeZhi: string | null;
}

/** 把输入（公历/农历，含可选时辰）统一成 lunar-javascript 的 Lunar 对象。 */
function toLunar(input: BirthInput): Lunar {
  const h = input.hour ?? 0; // 时辰不确定按 0 时建对象，不影响按「日」定的本命宿
  if (input.calendar === "solar") {
    return Solar.fromYmdHms(input.year, input.month, input.day, h, 0, 0).getLunar();
  }
  // 农历闰月：lunar-javascript 用负月份表示（如闰五月 = -5）
  const month = input.isLeapMonth ? -input.month : input.month;
  return Lunar.fromYmdHms(input.year, month, input.day, h, 0, 0);
}

export function computeBenmingXiu(input: BirthInput): XiuComputed {
  const lunar = toLunar(input);
  const xiu = lunar.getXiu();

  const siXiang = siXiangOf(xiu);
  const direction = directionOf(xiu);
  if (siXiang === null || direction === null) {
    // 不臆造：库给出定表之外的宿名时，报错而非猜测归类
    throw new Error(`未能归类的宿：「${xiu}」`);
  }

  const zheng = lunar.getZheng();
  const animal = lunar.getAnimal();
  const hasHour = input.hour !== undefined && input.hour !== null;

  return {
    benming: {
      xiu,
      zheng,
      animal,
      fullName: `${xiu}${zheng}${animal}`,
      siXiang,
      direction,
    },
    solarDate: lunar.getSolar().toYmd(),
    lunarDate: lunar.toString(),
    timeZhi: hasHour ? lunar.getTimeZhi() : null,
  };
}
