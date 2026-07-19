/**
 * 二十八宿定表 + 《宿曜经》本命宿算法数据（传统定表 / 典籍原文，非 AI 现编）。
 *
 * ⚠️ 值日宿 ≠ 本命宿：老黄历「值日星宿」逐日轮值、逐年变（= lunar.getXiu()）；
 *    本项目要的是《宿曜经》按农历生日定的「本命宿」（与年份无关）。见 PRD §7 更正框 / CLAUDE §3。
 */
import type { SiXiang, Direction } from "../types/contract";

interface XiangGroup {
  siXiang: SiXiang;
  direction: Direction;
  xius: string[];
}

export const XIANG_GROUPS: XiangGroup[] = [
  { siXiang: "青龙", direction: "东方", xius: ["角", "亢", "氐", "房", "心", "尾", "箕"] },
  { siXiang: "玄武", direction: "北方", xius: ["斗", "牛", "女", "虚", "危", "室", "壁"] },
  { siXiang: "白虎", direction: "西方", xius: ["奎", "娄", "胃", "昴", "毕", "觜", "参"] },
  { siXiang: "朱雀", direction: "南方", xius: ["井", "鬼", "柳", "星", "张", "翼", "轸"] },
];

const bySiXiang = new Map<string, SiXiang>();
const byDirection = new Map<string, Direction>();
for (const g of XIANG_GROUPS) {
  for (const x of g.xius) {
    bySiXiang.set(x, g.siXiang);
    byDirection.set(x, g.direction);
  }
}

export function siXiangOf(xiu: string): SiXiang | null {
  return bySiXiang.get(xiu) ?? null;
}

export function directionOf(xiu: string): Direction | null {
  return byDirection.get(xiu) ?? null;
}

/**
 * 禽星表：宿 → { 七政(七曜), 动物 }（传统定表，如「房日兔」「轸水蚓」）。
 * 本命宿的七政/动物由此表给出，**不**用 lunar.getZheng()/getAnimal()（那是值日宿的属性）。
 */
export interface QinXing {
  zheng: string;
  animal: string;
}
export const QINXING: Record<string, QinXing> = {
  角: { zheng: "木", animal: "蛟" }, 亢: { zheng: "金", animal: "龙" }, 氐: { zheng: "土", animal: "貉" },
  房: { zheng: "日", animal: "兔" }, 心: { zheng: "月", animal: "狐" }, 尾: { zheng: "火", animal: "虎" },
  箕: { zheng: "水", animal: "豹" }, 斗: { zheng: "木", animal: "獬" }, 牛: { zheng: "金", animal: "牛" },
  女: { zheng: "土", animal: "蝠" }, 虚: { zheng: "日", animal: "鼠" }, 危: { zheng: "月", animal: "燕" },
  室: { zheng: "火", animal: "猪" }, 壁: { zheng: "水", animal: "貐" }, 奎: { zheng: "木", animal: "狼" },
  娄: { zheng: "金", animal: "狗" }, 胃: { zheng: "土", animal: "雉" }, 昴: { zheng: "日", animal: "鸡" },
  毕: { zheng: "月", animal: "乌" }, 觜: { zheng: "火", animal: "猴" }, 参: { zheng: "水", animal: "猿" },
  井: { zheng: "木", animal: "犴" }, 鬼: { zheng: "金", animal: "羊" }, 柳: { zheng: "土", animal: "獐" },
  星: { zheng: "日", animal: "马" }, 张: { zheng: "月", animal: "鹿" }, 翼: { zheng: "火", animal: "蛇" },
  轸: { zheng: "水", animal: "蚓" },
};

export function qinXingOf(xiu: string): QinXing | null {
  return QINXING[xiu] ?? null;
}

// ── 《宿曜经》本命宿算法 ──────────────────────────────────────────────
//
// 原文：「先下生日数，又虚加十三讫，即从彼生月望宿，用上位数顺除，数尽则止，即得彼人所属命宿。」
//   → 命宿 = 从「生月望宿」起（望宿计为第 1 位），按 27 宿序（娄首、去牛）顺数「农历日 + 13」位。
//
// 交叉校验（PRD §13）：农历四月初十=轸（1990/2005/2018 三年同值）、四月十四=房、七月十五=室、
//   十月初六=虚、正月初六=昴；《宿曜经》官方例：九月初十=室、七月十一=斗、五月初五=星；
//   万年历正月序：初一室·初二壁·初三奎。共 12 样本全部命中。

/** 27 宿序（娄首、去「牛」宿——印度尊牛，牛宿不值日；故本命宿恒不含牛）。 */
export const SUYAO_ORDER27: string[] = [
  "娄", "胃", "昴", "毕", "觜", "参", "井", "鬼", "柳", "星", "张", "翼", "轸",
  "角", "亢", "氐", "房", "心", "尾", "箕", "斗", "女", "虚", "危", "室", "壁", "奎",
];

/** 每农历月的「望宿」（十五之宿）：正月翼 … 腊月星。 */
export const WANG_XIU: Record<number, string> = {
  1: "翼", 2: "角", 3: "氐", 4: "心", 5: "箕", 6: "女",
  7: "室", 8: "娄", 9: "昴", 10: "觜", 11: "鬼", 12: "星",
};

/**
 * 依《宿曜经》按农历「月+日」求本命宿。
 * @param lunarMonth 农历月（闰月为负，按同名本月处理，见 PRD §15-d 待确认）
 * @param lunarDay   农历日（1–30）
 */
export function benmingXiuByLunar(lunarMonth: number, lunarDay: number): string {
  const month = Math.abs(lunarMonth); // 闰月负数 → 同名本月
  const wang = WANG_XIU[month];
  if (!wang) throw new Error(`非法农历月：${lunarMonth}`);
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30)
    throw new Error(`非法农历日：${lunarDay}`);
  const start = SUYAO_ORDER27.indexOf(wang);
  const idx = (start + (lunarDay + 13) - 1) % SUYAO_ORDER27.length;
  return SUYAO_ORDER27[idx];
}
