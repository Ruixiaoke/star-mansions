/**
 * lunar-javascript（6tail, MIT）无自带类型，这里声明本项目实际用到的最小表面。
 * 方法名已用探针实测核对（见 worklog）；仅在后端使用（前端经 /api/compute 调用）。
 */
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getLunar(): Lunar;
    toYmd(): string;
  }
  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar;
    getSolar(): Solar;
    getXiu(): string;
    getZheng(): string;
    getAnimal(): string;
    getTimeZhi(): string;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toString(): string;
  }
}
