# Scaffold Plan — 二十八星宿测算 Web App

> 状态：**待 Rick 确认**（确认前不生成任何可运行代码）
> 日期：2026-07-19
> 输入包 SoT：`PRD.md`（产品）· `CLAUDE.md`（规则）· `tokens.css`（视觉）
> 架构基线：**前后端分离** —— `frontend/` → GitHub Pages，`backend/` → Vercel serverless，中间一根 HTTP 线（`VITE_API_BASE` + CORS）。对齐 Vibe Coding L4。

---

## 0. 与现有 SoT 的分歧（需 Rick 拍板）

本方案按 Rick 当次指令做前后端分离，与现有文档有三处刻意分歧，**开工前请确认**：

| # | 分歧点 | 现有 SoT | 本方案 | 建议 |
|---|--------|----------|--------|------|
| D1 | 仓库形态 | `CLAUDE.md` §1/§2：monorepo（`src/` + 同仓 `api/`），"不另起独立后端服务" | `frontend/` + `backend/` 两个独立子项目，各自 `.env.example`、各自部署 | 采分离；**同步改 `CLAUDE.md` §1/§2** 以免规则漂移 |
| D2 | 测算跑在哪 | `CLAUDE.md` §3 / `PRD.md` §7：`computeBenmingXiu` 在前端 `src/lib/xiu.ts` | 真测算（`lunar-javascript`）在**后端** `/api/compute`；前端只留调用封装 | 采后端（L4「主线唯一必做真 endpoint」）；前端封装同名可替换模块 |
| D3 | 部署目标 | `CLAUDE.md` §5：GitHub Pages + Vercel | 前端 Pages、后端 Vercel（职责更明确） | 一致，无需改，仅细化 |

> 其余 §0 铁律（免责声明 / 不臆造 / 隐私 / 不制造焦虑 / 素材合规）本方案全部保留，不动。

---

## 1. 技术栈与理由

### 前端 `frontend/`（→ GitHub Pages）
| 项 | 选择 | 理由 |
|----|------|------|
| 框架 | React 19 + TypeScript | `CLAUDE.md` §1 指定 |
| 构建 | Vite | §1 指定；静态产物直接上 Pages |
| 路由 | `react-router-dom`（**HashRouter**） | 5 个页面需路由；HashRouter 在 Pages 子路径下零服务端配置即可用（避开刷新 404）。**唯一新增运行时依赖，理由充分** |
| 样式 | 纯 CSS + `tokens.css` 变量 | §4 设计宪法；**不引 UI 组件库** |
| 数据 | 静态 JSON（释义库）+ `fetch` 调后端 | 释义库是静态内容（PRD §9），测算走 HTTP |

### 后端 `backend/`（→ Vercel serverless）
| 项 | 选择 | 理由 |
|----|------|------|
| 运行时 | Node + TypeScript | 与前端同语言，Rick 熟 |
| 部署 | Vercel Serverless Functions（`api/*.ts`） | `CLAUDE.md` §1 指定 API 层；L4「后端→Vercel serverless」 |
| 历法/测算 | **`lunar-javascript`（6tail, MIT）** | §3/§7 硬指定；公历↔农历 + 值日宿一库搞定，不手搓表 |
| 本地开发 | 最小 Express server 复用同一组 handler | 见 §6；**零 Vercel 账号即可本地联调**，同一 handler 又能作 Vercel function 部署 |
| 测试 | Vitest | 交叉校验 ≥3 样本（PRD §13） |

> **依赖纪律（`CLAUDE.md` §1）**：新增运行时依赖仅 `react-router-dom`（前端）、`lunar-javascript`（后端）。其余为工具链（vite / vitest / tsx / express 仅本地 dev）。

---

## 2. 目录结构

```
star-mansions/
├─ docs/                       # 本地文档 SoT（本次归档）
│  ├─ README.md                # 文档索引 + SoT 地图
│  ├─ SCAFFOLD_PLAN.md         # 本文件
│  └─ API_CONTRACT.md          # 前后端接口契约
│
├─ frontend/                   # → GitHub Pages
│  ├─ .env.example             # VITE_API_BASE
│  ├─ package.json
│  ├─ vite.config.ts           # base:'/star-mansions/'（Pages 子路径）
│  ├─ tsconfig.json
│  ├─ index.html
│  ├─ public/
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx               # HashRouter + 路由表
│     ├─ pages/                # Landing / Result / Login / History / About
│     ├─ components/           # BirthdayInput / XiuBadge / StarMap / XiuHero /
│     │                        # AnalysisSection / ResultCard / AuthForm / HistoryList
│     ├─ data/
│     │  ├─ xiu.ts             # 28 宿定表（宿·四象·七政·动物，传统定表）
│     │  └─ readings.ts        # 释义库（scaffold: 1–2 条示例，显式标「示例（占位）」）
│     ├─ lib/
│     │  ├─ api.ts             # fetch 封装，读 VITE_API_BASE
│     │  ├─ computeClient.ts   # computeBenmingXiu(input) → 调 POST /api/compute（可替换模块）
│     │  ├─ authAdapter.ts     # login/logout/currentUser（scaffold = localStorage mock）
│     │  └─ readingStore.ts    # save/list（scaffold = localStorage mock）
│     ├─ types/contract.ts     # 与后端契约对应的 TS 类型（前端侧）
│     └─ styles/
│        └─ tokens.css         # 从根 tokens.css 迁入，全局引入
│
├─ backend/                    # → Vercel serverless
│  ├─ .env.example             # ALLOWED_ORIGIN,（SUPABASE_* 占位）
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vercel.json              # functions / rewrites（可选）
│  ├─ api/                     # Vercel function 入口（薄壳，转调 handlers）
│  │  ├─ compute.ts            # POST /api/compute（真实）
│  │  ├─ auth.ts               # POST /api/auth（占位）
│  │  └─ history.ts            # GET/POST /api/history（占位）
│  ├─ src/
│  │  ├─ handlers/             # 与框架无关的处理函数（compute / auth / history）
│  │  ├─ lib/xiu.ts            # 值日宿封装 lunar-javascript（可替换模块）
│  │  ├─ cors.ts              # CORS helper（读 ALLOWED_ORIGIN）
│  │  ├─ types/contract.ts     # 契约类型（后端侧）
│  │  └─ server.ts             # 本地 dev 最小 Express server（import 同一 handlers）
│  └─ test/
│     └─ xiu.spec.ts           # ≥3 已知样本交叉校验（PRD §13）
│
├─ package.json                # 根：concurrently 一键起前后端联调 + 汇总脚本
├─ .gitignore                  # 确保 frontend/.env、backend/.env 被忽略
├─ PRD.md · CLAUDE.md · tokens.css   # 三份 SoT 保留根目录（被 §2 约定引用，不搬动）
└─ README.md                   # 顶层启动说明
```

> **契约类型为何两侧各一份**：保持 `frontend/`、`backend/` 完全独立、可各自部署（不引 shared 包耦合）。以 `docs/API_CONTRACT.md` 为唯一契约 SoT，两侧类型对齐它。（后续若嫌重复，可再抽 `shared/` 包——非 MVP。）

---

## 3. PRD 需求：前端 / 后端归属

| PRD 条目 | 前端 `frontend/` | 后端 `backend/` |
|----------|------------------|------------------|
| §4 核心 Flow（输入生日→出宿→看解读） | 主导：输入 UI + 结果渲染 | 提供 `/api/compute` |
| §5 页面 Landing/Result/Login/History/About | ✅ 全部 | — |
| §6 组件 | ✅ 全部 | — |
| §7 值日法测算（`lunar-javascript`） | 调用封装 `computeClient` | ✅ 真实测算 `/api/compute` |
| §7/§13 ≥3 样本交叉校验 | — | ✅ Vitest 测试 |
| §8 邮箱直登（authAdapter） | ✅ 接口 + scaffold localStorage mock | `/api/auth`（占位，课后接 Supabase） |
| §8/§9 保存/回看 Reading（readingStore） | ✅ 接口 + scaffold localStorage mock | `/api/history`（占位） |
| §9 数据模型 XiuEntry/User/Reading | XiuEntry 静态 JSON | User/Reading 存储（占位，§15-a 选型） |
| §10 释义库内容（28×九类） | ✅ 静态 JSON（scaffold 占位，正式为内容工作量） | — |
| §10 形象图/星图（AI 生成） | ✅ 展示（scaffold 用占位块） | — |
| §11 tokens 视觉 | ✅ 全部 | — |
| §12 免责声明 / 隐私 / 可删除 | ✅ Result & About 显著免责；删除入口 | 删除记录/账号 API（占位） |
| CORS / API_BASE 连接 | 读 `VITE_API_BASE` | ✅ CORS 允许前端来源 |

---

## 4. 前后端 API 契约（摘要，详见 `API_CONTRACT.md`）

Base：`VITE_API_BASE`（本地 `http://localhost:3000`，生产 = Vercel 域名）。所有响应 `application/json`；后端对前端来源开 CORS。

| 端点 | 方法 | 状态 | 用途 |
|------|------|------|------|
| `/api/compute` | POST | **真实** | 生日 → 本命宿身份（宿/七政/动物/四象/时辰地支） |
| `/api/auth` | POST | 占位 | 邮箱直登 upsert（返回 mock user + token） |
| `/api/history` | GET / POST | 占位 | 列出 / 保存 Reading |

**`POST /api/compute` 请求**
```json
{ "calendar": "solar", "year": 1998, "month": 6, "day": 15, "hour": 14, "isLeapMonth": false }
```
`calendar`: `"solar"|"lunar"`；`hour` 省略/null = 时辰不确定；`isLeapMonth` 仅农历闰月。

**`POST /api/compute` 响应 200**
```json
{
  "input": { "calendar": "solar", "year": 1998, "month": 6, "day": 15, "hour": 14 },
  "solarDate": "1998-06-15",
  "lunarDate": "一九九八年五月廿一",
  "benming": {
    "xiu": "房", "zheng": "日", "animal": "兔",
    "fullName": "房日兔", "siXiang": "青龙", "direction": "东方"
  },
  "timeZhi": "未",
  "disclaimer": "内容为传统文化 / 娱乐参考，不构成任何人生 / 医疗 / 投资 / 婚姻等决策建议。"
}
```
> 注：`/api/compute` 只回**宿的身份**；七大解读板块文案由前端拿 `benming.xiu` 去本地释义库 JSON 取（PRD §9「前端可直接读 JSON」）。清晰切分：动态计算=后端，静态内容=前端。

错误 400：`{ "error": "INVALID_INPUT", "message": "..." }`

---

## 5. 哪些先做占位（scaffold 只打通一条真 Flow）

> 唯一打通的真链路 = **BirthdayInput → `POST /api/compute` → Result 渲染**（跨 HTTP 线，含 CORS）。其余占位。

| 模块 | scaffold 状态 |
|------|---------------|
| `/api/compute` + `lunar-javascript` | ✅ **真实**（scaffold 核心） |
| 交叉校验测试（≥3 样本） | ✅ **真实**（红线 §7） |
| 释义库 `readings.ts` | ⏳ 占位：1–2 条示例，显式标「示例（占位）」；全 28 宿真内容 = 后续内容工作量（PRD §10 决策4） |
| 形象图 / 星图 | ⏳ 占位块 / 简单 SVG；AI 生图后续（PRD §10 决策5） |
| `authAdapter` / `readingStore` | ⏳ 前端 localStorage mock；后端 `/api/auth`、`/api/history` = stub 返回 mock |
| Login / History / About 页 | ⏳ 骨架（可导航，内容占位；About 先放真免责文案） |
| ResultCard 分享卡 | ⏳ 占位（截图分享后续） |
| 存储选型（Supabase / Vercel PG·KV） | ⏳ 不进 scaffold（PRD §15-a 待定） |

---

## 6. 命令 & 本地联调

### 各自独立
**frontend/**
- `npm install`
- `npm run dev` → Vite（`http://localhost:5173`）
- `npm run typecheck` → `tsc --noEmit`
- `npm run build` → `tsc -b && vite build` → `frontend/dist`
- `npm run preview` → 本地预览产物

**backend/**
- `npm install`
- `npm run dev` → 最小 Express server（`http://localhost:3000`，import `src/handlers/*`）
- `npm run typecheck` → `tsc --noEmit`
- `npm run build` → `tsc --noEmit`（Vercel 部署时自行构建 functions）
- `npm test` → Vitest（≥3 样本交叉校验）

### 根目录一键联调
根 `package.json` 用 `concurrently`（唯一根依赖）同时起两端；两个子项目仍独立可 build / 部署。
- `npm install` → 装根依赖（并可 postinstall 递归装两端，或手动分别装）
- `npm run dev` → `concurrently "npm --prefix frontend run dev" "npm --prefix backend run dev"`
- `npm run typecheck` → 前后端各跑一遍
- `npm run build` → 前后端各 build

**联调连线**：`frontend/.env` 里 `VITE_API_BASE=http://localhost:3000`；后端 `.env` 里 `ALLOWED_ORIGIN=http://localhost:5173`。前端 `fetch(`${VITE_API_BASE}/api/compute`)`，后端 CORS 放行该来源。

> **本地后端跑法（决策点，见 §8-b）**：默认最小 Express server（零 Vercel 账号、启动快、可读）。备选 `vercel dev`（生产 100% 一致，但需 Vercel CLI 且可能要登录/link，直播课有摩擦）。同一组 handler 两种入口都能跑。

### 部署（本方案不在 scaffold 执行，仅记口径）
- 前端：GitHub Pages（`vite.config.ts` 的 `base:'/star-mansions/'` 是关键坑）。
- 后端：Vercel（`api/*.ts` 自动路由）。前端生产 `VITE_API_BASE` 指向 Vercel 域名；后端 `ALLOWED_ORIGIN` 指向 Pages 域名。

---

## 7. `.env.example`（密钥绝不进 git — 铁律 §0-3）

**frontend/.env.example**
```
# 前端调用后端的基地址（本地联调=本地后端；生产=Vercel 部署域名）
VITE_API_BASE=http://localhost:3000
```

**backend/.env.example**
```
# CORS 允许的前端来源（本地 Vite / 生产 Pages 域名）
ALLOWED_ORIGIN=http://localhost:5173
# 存储（占位，scaffold 阶段不需要真值；§15-a 选型后再启用）
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```
> `.gitignore` 需覆盖 `frontend/.env`、`backend/.env`（scaffold 时四查之一）。

---

## 8. 决策记录（Rick 已拍板 · 2026-07-19）

- **a. 架构**：✅ 前后端分离 + 测算落后端 `/api/compute`。**单仓 monorepo + npm workspaces（`frontend` + `backend` 两包）**，非 `src/ + api/` 单包。
- **b. 本地后端跑法**：✅ 最小 Express server（`backend/src/server.ts`），零 Vercel 账号即可联调；生产走 Vercel functions（同一组 handler）。
- **c. 根目录组织**：✅ npm workspaces（根 `npm install` 一次装两端；根脚本用 `npm -w` 转发）。
- **d. SoT 位置**：✅ `PRD.md`、`tokens.css` 搬进 `docs/`（tokens 另迁一份进 `frontend/src/styles/`）；`CLAUDE.md` **保留根目录**（进项目先读的规则文件 + 被 aios 内核引用）。
- **e. CLAUDE.md 规则文档**：⏸️ **暂不改**（Rick 定）。故 `CLAUDE.md` §1/§2（monorepo `src/+api/`）、§3 / PRD §7（测算在前端）与本实现存在**已知、刻意的短期漂移**，待后续统一更新时对齐。
- **f. PRD §15 遗留**（不阻塞）：存储选型 a、时辰维度 b、生图模型 c —— 留待后续。
- **g. ⚠️ 事故留痕**：清理旧后台 agent 进程时，一条过宽的进程过滤误杀了 3 个 `claude.exe`（含 daemon supervisor 35628、及另 2 个会话 30928/38360）。本 session 未受影响；daemon 可重启；如你有其他 star-mansions 会话被中断，即由此。

---

## 9. Scaffold 过关标准（确认后生成时对照）

- [ ] `frontend` / `backend` 各自 `install / typecheck / build` 三条全绿。
- [ ] 后端 `npm test` 交叉校验 ≥3 已知样本通过（PRD §13）。
- [ ] 根 `npm run dev` 同起两端；浏览器输入生日 → 经 `/api/compute` → Result 出本命宿（一条真 Flow 通）。
- [ ] 前端全程用 `tokens.css` 变量，接入无硬编码色值。
- [ ] Result / About 有显著免责声明（红线 §0-1 / §12）。
- [ ] 无密钥进 git；`.env.example` 齐全、`.env` 被忽略。
