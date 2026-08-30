# API 契约 — 前端 ↔ 后端

> 唯一契约 SoT。`frontend/src/types/contract.ts` 与 `backend/src/types/contract.ts` 都对齐本文件。
> Base URL：前端读 `VITE_API_BASE`（本地 `http://localhost:3000`，生产 = Vercel 域名）。
> 所有请求/响应 `Content-Type: application/json`。后端对 `ALLOWED_ORIGIN` 开 CORS（含预检 `OPTIONS`）。
> 状态：`/api/compute`、`/api/auth`、`/api/history` 均已接真实存储（Supabase，PRD §15-a）；`/api/divination` 代码已就绪，**待在 Supabase 跑 `backend/db/schema.sql` 建 `divinations` 表后才在生产生效**（未建表就打真库会 500，见 §4 与部署纪律 §8-7）。未配置 Supabase env 时 auth/history/divination 回落内存 mock。

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

## 2. `POST /api/auth` — 邮箱直登（Supabase）

只填邮箱即登录/建号（PRD §8，对 `users` 表 upsert）。返回 `{ user, token }`，`token = user.id`（免验证直登的软会话）。
**存储 = Supabase（PRD §15-a）**；未配置 `SUPABASE_URL/SUPABASE_SECRET_KEY` 时后端回落内存 mock（本地/单测）。

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

## 3. `/api/history` — 测算记录（Supabase）

登录后保存 / 回看 / 删除 `Reading`（存 Supabase `readings` 表）。**需 `Authorization: Bearer <token>`**（token = 登录返回值，作用域到该用户）；缺失 → `401 UNAUTHORIZED`。未配置 Supabase env 时后端回落内存（serverless 不跨请求持久化，仅本地/单测）。

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

### `DELETE /api/history?id=<id>` — 删除一条记录
仅能删除本人（token 作用域）记录。**Response 200** — `{ "ok": true }`。
> 隐私红线 §0-3 / §12：用户可删除自己的记录。账号级删除（清空该用户全部记录 + users 行）后续另设端点。

---

## 4. `/api/divination` — 卦例记录（Supabase）

登录后保存 / 回看 / 删除一次起卦的结果（存 Supabase `divinations` 表，六爻 PRD §11/§12）。**需 `Authorization: Bearer <token>`**（token = 登录返回值，作用域到该用户）；缺失 → `401 UNAUTHORIZED`。未配置 Supabase env 时后端回落内存（serverless 不跨请求持久化，仅本地/单测）。

```ts
type DivinationKind = "liuyao";   // 本期恒为 "liuyao"；本表预留给将来别的玩法复用

// 所问事项（PRD §7.1）：Tier A =《周礼》八命 5 项，Tier B =《梅花易数》3 项。
// 与 frontend/src/data/liuyao-topics.ts 的 TopicKey 同集合，加分类时前端 data / 两侧 contract 一起改。
type DivinationTopic =
  | "mou" | "yu" | "guo" | "zhi" | "zheng"        // 谋 / 与 / 果 / 至 / 征
  | "career" | "wealth" | "relationship";        // 事业 / 财运 / 感情

interface DivinationRecord {
  id: string;
  userId: string;
  kind: DivinationKind;
  topic: DivinationTopic;  // 枚举值，非自由文本（PRD §14 隐私设计，API 层强制）
  code: string;            // 卦码，六个爻数，如 "987678"
  payload: unknown;        // 卦的完整快照（jsonb）
  createdAt: string;
}
```

### `POST /api/divination` — 保存一卦
**Request Body**
```json
{
  "kind": "liuyao",
  "topic": "career",
  "code": "987678",
  "payload": { "tosses": [], "yaos": [], "primaryOrder": 1, "changedOrder": 43, "movingPositions": [2] }
}
```
**Response 200** — `{ "divination": DivinationRecord }`
```json
{
  "divination": {
    "id": "d_1", "userId": "u_user@example.com", "kind": "liuyao",
    "topic": "career", "code": "987678",
    "payload": { "tosses": [], "yaos": [], "primaryOrder": 1, "changedOrder": 43, "movingPositions": [2] },
    "createdAt": "2026-08-30T00:00:00.000Z"
  }
}
```
四个字段全部必填（`payload` 显式传 `null`、`topic` 传 `""` 都算缺失）。两处枚举在 **API 层强制**，不是只靠前端表单：

- **`kind` 只接受 `"liuyao"`**，其他值一律 400。
- **`topic` 只接受上列 8 个值**，其他值（含自由文本、大小写变体、非字符串）一律 400。这是隐私控制而不只是格式校验：PRD §14 把「枚举而非自由文本」定为刻意设计，绕过前端直接 POST 不得把用户手打的私人处境写进 `divinations` 表（该表 `user_id + topic + created_at` 合起来构成行为画像）。要放开自由文本须先过一轮隐私评估（PRD §17）。

两者都与对应的字面量/联合类型对齐 —— 类型说只有这些值，运行时就得真的只收这些值；加分类 / 加玩法时类型与校验两处一起改。

**Response 400** — `ApiError`
```json
{ "error": "INVALID_INPUT", "message": "需要 kind / topic / code / payload 字段" }
```
```json
{ "error": "INVALID_INPUT", "message": "本期 kind 只接受 \"liuyao\"" }
```
```json
{ "error": "INVALID_INPUT", "message": "topic 只接受：mou / yu / guo / zhi / zheng / career / wealth / relationship" }
```
> 非法 `topic` 的错误信息**不回显收到的值**：那个值本身可能就是敏感自由文本，回显等于把它送进响应体与上游日志。
> `code` 后端**不校验格式**（不检查是否为六位 `6/7/8/9`）：起卦引擎在前端，本端点只存快照。这是刻意取舍，不是遗漏。

### `GET /api/divination` — 列出当前用户的卦例
按 `createdAt` 倒序。可选 query `?kind=liuyao` 按类型过滤。
**Response 200** — `{ "divinations": DivinationRecord[] }`

### `DELETE /api/divination?id=<id>` — 删除一条卦例
仅能删除本人（token 作用域）记录。**Response 200** — `{ "ok": true }`。
> 隐私红线 §0-3 / 六爻 PRD §14：**物理删除**，不做软删标记。`user_id + topic + created_at` 合起来构成行为画像，因此服务端日志不记录 `topic` 值。

**设计说明（为什么不复用 `/api/history`）**：现有 `readings` 表是二十八宿专用的，`benming` / `solar_date` 是**硬列**（见 `backend/db/schema.sql`），塞不进卦象数据。改现有表 = 动线上已有数据 + 动已发布契约；新增表与端点是**纯增量、零回归风险**，`/api/compute`、`/api/auth`、`/api/history` 行为不变。`kind` 列为将来别的玩法留位。
> **上线顺序（部署纪律 §8-7，反了会 500）**：**先**在 Supabase SQL Editor 跑 `backend/db/schema.sql` 建 `divinations` 表，**再**部署后端。

---

## CORS 约定

- 允许来源：`ALLOWED_ORIGIN`（本地 `http://localhost:5173`；生产 = Pages 域名）。
- 允许方法：`GET, POST, DELETE, OPTIONS`；允许头：`Content-Type, Authorization`。
- 预检 `OPTIONS` 直接 204。
- L4「CORS 红灯实验」：先故意不配 CORS 看前端报错，再补上 → 红转绿。
