/**
 * 二十八宿 → 四象 / 方位 定表（传统定表，照 PRD §7）。
 * 前端主要用于展示（四象色、About 页说明）；测算身份以后端 /api/compute 返回为准。
 */
import type { SiXiang, Direction } from "../types/contract";

export interface XiangGroup {
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

export const SIXIANG_OF: Record<string, SiXiang> = Object.fromEntries(
  XIANG_GROUPS.flatMap((g) => g.xius.map((x) => [x, g.siXiang] as const)),
);
