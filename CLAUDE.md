# CLAUDE.md — 二十八星宿 App · 项目规则

> 任何 AI（Claude Code / Cursor）在本项目动手前，先读这份 + `PRD.md` + `tokens.css`。
> 三层真相源：**产品的 SoT = `PRD.md`**；**视觉的 SoT = `tokens.css`**；**规则 = 本文件**。
> 定位一句话：输入公历/农历生日 → 按中国二十八宿值日法算本命宿 → 展示形象、星图与七维解读；带邮箱登录。

---

## 0. 铁律（红线，绝不违反）

1. **文化娱乐定位**：结果页与 About 页必须有**显著免责声明** —— 内容为传统文化 / 娱乐参考，不构成人生、医疗、投资、婚姻等任何决策建议。
2. **不臆造**：
   - 测算**不手写值日表**，一律走 `lunar-javascript`（见 §3），上线前用 ≥3 个已知本命宿样本**交叉校验**。
   - 释义文案**基于可查传统资料整理、标注来源**，不由 AI 现编冒充权威（可 AI 起草，但须核对出处、人工定稿）。
3. **隐私**：生日 + 邮箱是敏感信息 —— 告知用途、未登录不强制留存、登录用户可删除记录与账号、不外发不售卖。**密钥 / `.env` 绝不提交进 git。**
4. **不制造焦虑 / 不诱导付费迷信**：禁止「命中注定破财 / 必须化解」式恐吓文案（MVP 也不含付费）。
5. **素材合规**：AI 生成图选**可商用**模型/授权并记录来源，不盗用他人素材。

> 铁律与用户当次指令冲突时：先指出冲突，再请示，不默默执行。

---

## 1. 技术栈（保持极简）

| 项 | 选择 |
|----|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite（静态前端，可上 GitHub Pages / Vercel）|
| 样式 | **纯 CSS + `tokens.css` 变量**（见 §4 设计宪法），不引 UI 组件库 |
| 历法/测算 | **`lunar-javascript`（6tail, MIT）** —— 公历↔农历 + 值日二十八宿 |
| 后端 | **同仓 Vercel Functions（`api/`）** 当 API 层；auth 用 Supabase Auth / Auth.js，存储用 Supabase/Vercel Postgres·KV；前端只依赖 `authAdapter` + `readingStore` 接口 |

新增任何 npm 依赖需有充分理由并说明。不另起独立后端服务（后端 = 同一 Vercel 项目的 `api/` Functions；MVP 先接口 + mock）。

---

## 2. 目录结构（scaffold 时按此）

```
src/
├─ pages/         # Landing / Result / Login / History / About
├─ components/    # BirthdayInput / XiuBadge / StarMap / XiuHero / AnalysisSection / ResultCard / AuthForm ...
├─ data/          # xiu.ts（28 宿定表）+ readings.ts（释义库 JSON，先示例后全真）
├─ lib/
│  ├─ xiu.ts      # computeBenmingXiu(input) → { xiu, zheng, animal, siXiang, timeZhi? }（封装 lunar-javascript）
│  ├─ auth.ts     # authAdapter：login / logout / currentUser
│  └─ store.ts    # readingStore：save / list（存/取测算记录）
├─ styles/
│  └─ tokens.css  # 视觉 SoT（由根目录 tokens.css 迁入 / 引用）
├─ App.tsx
└─ main.tsx
api/              # Vercel Serverless Functions（后端 API：保存/读取 Reading、auth 回调）—— 真后端阶段加
public/
PRD.md · CLAUDE.md · README.md · package.json · vite.config.ts
```

- 根目录的 `PRD.md` / `CLAUDE.md` / `tokens.css` 是输入包；scaffold 时把 `tokens.css` 接进 `src/styles/` 并全局引入。

---

## 3. 本命宿测算（核心引擎）

- **只用 `lunar-javascript`**，不手写值日序/锚定日/农历换算表：
  ```
  Solar.fromYmd(y,m,d).getLunar()  // 农历输入用 Lunar.fromYmd(...)
    → lunar.getXiu()    // 宿（如 "房"）
    → lunar.getZheng()  // 七政（日/月/火/水/木/金/土）
    → lunar.getAnimal() // 动物（如 "兔"）
    → lunar.getTimeZhi()// 时辰地支（时辰辅助板块用）
  ```
- 封装成**可替换模块** `computeBenmingXiu(input)`，页面层不直接调库。
- 本命宿按「日」定；**时辰不改变本命宿**，只驱动「时辰辅助」板块。时辰选「不确定」→ 隐藏该板块，照常出本命宿。
- 上线前交叉校验 ≥3 样本（PRD §13 验收）。

---

## 4. 设计宪法（视觉铁律）

1. **一切颜色/字体/间距/圆角/边框/阴影只走 `var(--...)`**，禁止在组件里手写 hex / px 魔法值。
2. 四象分类色用变量：组件挂 `data-xiang="青龙|朱雀|白虎|玄武"`，取 `var(--xiang)`；不硬编码四色。
3. 主强调只有**鎏金**（`--color-gold`）一个；四象色是分类语义色，不当主强调乱用。
4. 本项目刻意为**东方夜空单主题**（墨蓝底 + 鎏金 + 楷体大字），不做浅色版；动画尊重 `prefers-reduced-motion`。
5. 视觉基准 = 原型 `star-mansions`（已认可）。要改风格 → 改 `tokens.css`，不在页面里各改各的。

---

## 5. 交付 / 工程口径（Vibe Coding）

- **你不背命令**：git、CI、部署都用「对 Agent 说人话 → Agent 执行 → 你 review + 验证」的方式，不手敲/手写 YAML。
- 代码、`PRD.md`、`CLAUDE.md`、`tokens.css` 放**同一个 GitHub repo**。
- push 前四查：密钥没进 git / README 能启动 / 三份 SoT 与代码同 repo / 初始 commit 能 build。
- CI 最小即可（install → typecheck → build）；用「红灯实验」确认它真能拦坏代码。
- 部署：GitHub Pages + Vercel（Vercel 用官方 Git 集成出 Preview/Production）。

---

## 6. Scaffold 纪律（第一次生成时）

1. 先读 `PRD.md` / `CLAUDE.md` / `tokens.css`，**先出 scaffold plan，我确认后再生成代码**。
2. 先搭骨架（目录 / 路由 / 占位 / 脚本）+ **一个真实核心 Flow**（输入生日 → 出本命宿 → 看结果），别一次做完整产品。
3. 涉及登录 / 后端的部分先做 `authAdapter` + `readingStore` 接口 + placeholder（本地存储/mock），真后端（同仓 `api/` Vercel Functions）留到下一步。
4. 本地 `install / typecheck / build` 三条全绿、页面已接 `tokens.css`，才算 scaffold 过关。

---

## 7. 内容 / 数据纪律

- 28 宿定表（宿·四象·七政·动物，如「房日兔」「心月狐」）是传统定表，照真；参见 `PRD.md §7`。
- 释义库（`XiuEntry` × 28，每宿九类内容 + 时辰辅助）：MVP 上**全真内容**、标来源；未定稿的一律显式标「示例（占位）」，不冒充定论。
- 图（形象/星图）AI 生成，统一画风；**星图按装饰/示意处理，不宣称天文精确**。

---

## 8. 部署纪律 / Deploy（Vercel 后端 · 血泪教训）

> **as-built 架构**：`frontend/`（Vite → GitHub Pages）+ `backend/`（Vercel serverless functions），经 `VITE_API_BASE` + CORS 连接。与 §1/§2 早期「同仓 Vercel Functions」描述有出入 —— **以本节 + 实际代码为准**（§1/§2/§3 的 monorepo / 前端测算描述属历史，尚未回填）。
> 后端上 Vercel 踩过的坑，**改部署配置前先读本节**。

1. **Vercel 函数产物必须是 CommonJS。** `backend/tsconfig.json` 用 `"module": "CommonJS"` + `"moduleResolution": "Node"`；**不要**用 `ESNext`/`Bundler`，也**不要**在 `backend/package.json` 写 `"type": "module"`。否则 @vercel/node 产出的 `.js` 里是 ESM `import`，被 Node 当 CJS 加载 → `SyntaxError: Cannot use import statement outside a module` → 所有函数 `FUNCTION_INVOCATION_FAILED`（500）。
   - 关键：@vercel/node **按本仓 `backend/tsconfig.json` 编译**函数，`module` 字段直接决定产物是 `import` 还是 `require`。

2. **「构建成功」≠「函数能跑」。** Vercel 部署状态绿只代表 build 过；运行时可能仍崩。**上线前本地 emit 验证产物格式**，别赌部署周期：
   ```
   npx tsc -p backend/tsconfig.json --noEmit false --outDir <tmp>
   # 确认 <tmp>/api/*.js 里是 require(...)、没有裸 import，再部署
   ```

3. **Node 版本锁 22。** `backend/package.json` + 根 `package.json` 加 `"engines": { "node": "22.x" }`（Vercel 不收 24.x；`engines.node` 优先于 dashboard 设置）。

4. **预览部署默认有 Deployment Protection（401）。** 预览 URL 被 Vercel 认证墙挡，黑盒 `curl` 验证不了 → 靠第 2 条「本地 emit 验证」+ 合并后「生产域名实测」。生产域名不被这层挡（返回真结果而非 401）。

5. **CORS 允许来源。** `backend/src/cors.ts` 默认放行 localhost + 生产 Pages 域名（`https://ruixiaoke.github.io`）；后端 `ALLOWED_ORIGIN`（Vercel 项目 env）可覆盖 / 扩展（逗号分隔多个）。换前端域名时同步改这里的默认值。浏览器 fetch 抛 `NETWORK_ERROR`「连不上后端」多半就是 CORS（curl 能通、浏览器被挡）。

6. **地址不硬编码。** GitHub 仓库变量 `VITE_API_BASE` = 后端生产域名，Pages 构建时注入；密钥 / URL 不进代码（§0-3）。Pages 部署 workflow 里加 guard：变量为空则直接失败，避免线上前端静默打 localhost。

---

*本文件随项目演进更新；改铁律（§0）需 Rick 明确确认。*
