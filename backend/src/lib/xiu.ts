/**
 * 本命宿测算引擎 —— 《宿曜经》本命宿（按农历生日）。PRD §7 / CLAUDE §3。
 * 可替换模块：换体系不影响 handler 与前端（DIP）。
 *
 * ⚠️ 本命宿 = 依《宿曜经》按「农历月+日」定（与年份、时辰无关），**不是** lunar.getXiu()（值日宿，另一概念）。
 * lunar-javascript 只负责公历↔农历换算与时辰地支；本命宿算法与禽星表见 ./xiuTable。
 */
import { Solar, Lunar } from "lunar-javascript";
import type { BirthInput, Benming } from "../types/contract";
import { siXiangOf, directionOf, qinXingOf, benmingXiuByLunar } from "./xiuTable";

export interface XiuComputed {
  benming: Benming;
  solarDate: string;
  lunarDate: string;
  timeZhi: string | null;
}

/** 把输入（公历/农历，含可选时辰）统一成 lunar-javascript 的 Lunar 对象。 */
function toLunar(input: BirthInput): Lunar {
  const h = input.hour ?? 0; // 时辰不确定按 0 时建对象，不影响按农历日期定的本命宿
  if (input.calendar === "solar") {
    return Solar.fromYmdHms(input.year, input.month, input.day, h, 0, 0).getLunar();
  }
  // 农历闰月：lunar-javascript 用负月份表示（如闰五月 = -5）
  const month = input.isLeapMonth ? -input.month : input.month;
  return Lunar.fromYmdHms(input.year, month, input.day, h, 0, 0);
}

export function computeBenmingXiu(input: BirthInput): XiuComputed {
  const lunar = toLunar(input);
  const lunarMonth = lunar.getMonth(); // 农历月（闰月为负）
  const lunarDay = lunar.getDay(); // 农历日

  // 《宿曜经》本命宿：按农历月+日定（见 xiuTable.benmingXiuByLunar）
  const xiu = benmingXiuByLunar(lunarMonth, lunarDay);

  const qin = qinXingOf(xiu);
  const siXiang = siXiangOf(xiu);
  const direction = directionOf(xiu);
  if (qin === null || siXiang === null || direction === null) {
    // 不臆造：算法给出定表之外的宿名时，报错而非猜测
    throw new Error(`未能归类的宿：「${xiu}」`);
  }

  const hasHour = input.hour !== undefined && input.hour !== null;

  return {
    benming: {
      xiu,
      zheng: qin.zheng,
      animal: qin.animal,
      fullName: `${xiu}${qin.zheng}${qin.animal}`,
      siXiang,
      direction,
    },
    solarDate: lunar.getSolar().toYmd(),
    lunarDate: lunar.toString(),
    timeZhi: hasHour ? lunar.getTimeZhi() : null,
  };
}
