# API 契约 — 前端 ↔ 后端

> 唯一契约 SoT。`frontend/src/types/contract.ts` 与 `backend/src/types/contract.ts` 都对齐本文件。
> Base URL：前端读 `VITE_API_BASE`（本地 `http://localhost:3000`，生产 = Vercel 域名）。
> 所有请求/响应 `Content-Type: application/json`。后端对 `ALLOWED_ORIGIN` 开 CORS（含预检 `OPTIONS`）。
> 状态：`/api/compute` = 真实；`/api/auth`、`/api/history` = 占位（scaffold 返回 mock）。

---

## 公共类型

```ts
type Calendar = "solar" | "lunar";

interface BirthInput {
  calendar: Calendar;
  year: number;            // 如 1998
  month: number;           // 1–12
  day: number;             // 1–31
  hour?: number | null;    // 0–23；省略/null = 时辰不确定
  isLeapMonth?: boolean;   // 仅农历闰月用；默认 false
}

interface Benming {
  xiu: string;             // 宿，如 "房"
  zheng: string;           // 七政，如 "日"
  animal: string;          // 动物，如 "兔"
  fullName: string;        // 组合名，如 "房日兔"
  siXiang: "青龙" | "朱雀" | "白虎" | "玄武";
  direction: "东方" | "南方" | "西方" | "北方";
}

interface ApiError {
  error: string;           // 机器可读码，如 "INVALID_INPUT"
  message: string;         // 人类可读说明
}
```

---

## 1. `POST /api/compute` — 本命宿测算（真实）

生日 → 本命宿身份。**只回宿的身份**；七大解读文案由前端拿 `benming.xiu` 去本地释义库 JSON 取。

**Request Body** — `BirthInput`
```json
{ "calendar": "solar", "year": 1990, "month": 5, "day": 4, "hour": 14, "isLeapMonth": false }
```

**Response 200**（示例为已交叉校验样本：农历四月初十 → 轸水蚓，见 PRD §13）
```json
{
  "input": { "calendar": "solar", "year": 1990, "month": 5, "day": 4, "hour": 14 },
  "solarDate": "1990-05-04",
  "lunarDate": "一九九〇年四月初十",
  "benming": {
    "xiu": "轸", "zheng": "水", "animal": "蚓",
    "fullName": "轸水蚓", "siXiang": "朱雀", "direction": "南方"
  },
  "timeZhi": "未",
  "disclaimer": "内容为传统文化 / 娱乐参考，不构成任何人生 / 医疗 / 投资 / 婚姻等决策建议。"
}
```
```ts
interface ComputeResponse {
  input: BirthInput;
  solarDate: string;          // 归一化公历 YYYY-MM-DD
  lunarDate: string;          // 展示用农历串
  benming: Benming;
  timeZhi: string | null;     // 时辰地支；hour 省略时 null（前端据此隐藏时辰辅助板块）
  disclaimer: string;         // 红线 §0-1：结果附免责
}
```

**Response 400** — `ApiError`
```json
{ "error": "INVALID_INPUT", "message": "day 超出该月范围" }
```

**实现要点**：本命宿依**《宿曜经》算法**（农历月+日：望宿表 + 27 宿序 + 顺数「农历日+13」，见 PRD §7），**不是** `lunar.getXiu()`（那是「值日宿」，另一个概念）。`lunar-javascript` 只做公历↔农历换算（`getMonth()/getDay()`）与时辰地支（`getTimeZhi()`）；七政/动物由固定禽星表给出。封装成可替换 `computeBenmingXiu(input)`；`test/xiu.spec.ts` 已用 12 个已知样本交叉校验（PRD §7/§13）。

---

## 2. `POST /api/auth` — 邮箱直登（占位）

只填邮箱即登录/建号（PRD §8，upsert）。**scaffold 返回 mock，不接真存储**；前端 `authAdapter` 亦可先走 localStorage。

**Request Body**
```json
{ "email": "user@example.com" }
```

**Response 200**
```json
{
  "user": { "id": "u_mock_1", "email": "user@example.com", "createdAt": "2026-07-19T00:00:00Z" },
  "token": "mock-session-token"
}
```
```ts
interface AuthResponse {
  user: { id: string; email: string; createdAt: string };
  token: string;              // 占位会话令牌
}
```
> ⚠️ 邮箱仅作软标识、未验证所有权（PRD §8）。敏感数据保护以「未登录不强制留存 + 可删除」为准（§12）。

---

## 3. `/api/history` — 测算记录（占位）

登录后保存 / 回看 `Reading`。**scaffold 用 mock / localStorage**。需 `Authorization: Bearer <token>`（占位阶段可忽略校验）。

```ts
interface Reading {
  id: string;
  userId?: string;
  input: BirthInput;
  solarDate: string;
  benming: Benming;
  createdAt: string;
}
```

### `GET /api/history` — 列出当前用户的记录
**Response 200**
```json
{ "readings": [ { "id": "r_1", "input": {"calendar":"solar","year":1998,"month":6,"day":15}, "solarDate":"1998-06-15", "benming": {"xiu":"房","zheng":"日","animal":"兔","fullName":"房日兔","siXiang":"青龙","direction":"东方"}, "createdAt":"2026-07-19T00:00:00Z" } ] }
```

### `POST /api/history` — 保存一条记录
**Request Body**
```json
{ "input": { "calendar":"solar","year":1998,"month":6,"day":15,"hour":14 }, "benming": { "xiu":"房","zheng":"日","animal":"兔","fullName":"房日兔","siXiang":"青龙","direction":"东方" }, "solarDate":"1998-06-15" }
```
**Response 200** — `{ "reading": Reading }`

### （后续）`DELETE /api/history/:id` — 删除记录；账号删除另设端点
> 隐私红线 §0-3 / §12：用户可删除自己的记录与账号。scaffold 阶段前端提供入口，后端占位。

---

## CORS 约定

- 允许来源：`ALLOWED_ORIGIN`（本地 `http://localhost:5173`；生产 = Pages 域名）。
- 允许方法：`GET, POST, DELETE, OPTIONS`；允许头：`Content-Type, Authorization`。
- 预检 `OPTIONS` 直接 204。
- L4「CORS 红灯实验」：先故意不配 CORS 看前端报错，再补上 → 红转绿。
