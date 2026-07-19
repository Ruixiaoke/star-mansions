# 二十八星宿测算 Web App

输入公历/农历生日 → 按《宿曜经》本命宿法（农历生日）算本命宿 → 展示形象、星图与七维解读；带邮箱登录。

> 定位：**传统文化 + 娱乐**向的自我认知工具，非命理预测服务。免责声明见结果页 / About。

## 架构（单仓 monorepo · 前后端分离）

```
star-mansions/
├─ frontend/   React 19 + Vite + TS    →  GitHub Pages
├─ backend/    Vercel serverless + 本地 Express  →  Vercel
├─ docs/       文档 SoT（PRD / 契约 / 方案 / tokens）
└─ CLAUDE.md   项目规则
```

前端经 HTTP（`VITE_API_BASE` + CORS）调后端 `/api/compute` 做测算（`lunar-javascript`）。
真相源：产品 = `docs/PRD.md`，视觉 = `docs/tokens.css`，规则 = `CLAUDE.md`，接口 = `docs/API_CONTRACT.md`。

## 快速开始

```bash
npm install                 # 根目录一次装好两个 workspace

cp frontend/.env.example frontend/.env
cp backend/.env.example  backend/.env

npm run dev                 # 同时起 后端(:3000) + 前端(:5173) 联调
```

浏览器打开 `http://localhost:5173` → 输入生日 → 出本命宿。

## 常用命令（根目录）

| 命令 | 作用 |
|------|------|
| `npm run dev` | concurrently 同起前后端 dev server |
| `npm run typecheck` | 前后端各跑 `tsc --noEmit` |
| `npm run build` | 前后端各自 build |
| `npm test` | 后端 Vitest（本命宿测算交叉校验） |

单独跑某端：`npm -w frontend run dev` / `npm -w backend run dev`。

## 部署

- 前端 → GitHub Pages（`frontend/vite.config.ts` 的 `base` 为仓库子路径）。
- 后端 → Vercel（`backend/` 为 Vercel 项目根，`api/*.ts` 自动路由）。
- 生产环境把前端 `VITE_API_BASE` 指向后端 Vercel 域名，后端 `ALLOWED_ORIGIN` 指向 Pages 域名。

## 铁律速记

密钥 / `.env` 绝不进 git · 测算走 `lunar-javascript` 不手搓表 · 结果页与 About 有显著免责声明 · 不制造焦虑 / 不诱导付费迷信。详见 `CLAUDE.md` §0。
