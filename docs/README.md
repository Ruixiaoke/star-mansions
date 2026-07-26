# docs/ — 二十八星宿 App 文档 SoT

本地文档索引。本文件夹按产品、工程和设计类型组织项目资料。

## 核心 SoT
- [`prd/PRD.md`](./prd/PRD.md) — **产品** SoT：要做什么、边界、验收。
- [`../CLAUDE.md`](../CLAUDE.md) — **规则** SoT：铁律、技术栈、目录、纪律。
- [`design/tokens.css`](./design/tokens.css) — **视觉** SoT：颜色/字体/间距/圆角/阴影变量。

## 本文件夹
- [`technical/SCAFFOLD_PLAN.md`](./technical/SCAFFOLD_PLAN.md) — 脚手架方案：技术栈+理由、目录结构、前后端归属、占位清单、命令与本地联调、待确认决策点。
- [`technical/API_CONTRACT.md`](./technical/API_CONTRACT.md) — 前后端接口契约：每个端点的路径 / 入参 / 返回。前后端类型都对齐此文件。

## 架构一句话
前后端分离：`frontend/`（React+Vite → GitHub Pages）—— HTTP（`VITE_API_BASE`+CORS）——`backend/`（Vercel serverless，`lunar-javascript` 测算）。对齐 Vibe Coding L4。

## 当前进度
- [x] 读 PRD / CLAUDE / tokens，出 scaffold plan，归档 docs/。
- [x] Rick 确认方案 & 决策点（见 SCAFFOLD_PLAN §8「已拍板」）。
- [x] 生成最小可运行框架（一条真 Flow：生日 → /api/compute → 结果）。全绿：前后端 typecheck/build、后端测试、HTTP 冒烟。
- [ ] 后续：释义库补 28 宿真内容（标来源）、AI 生图、存储选型（PRD §15-a）、真后端接入、CLAUDE.md §1/§2/§3 对齐本架构。
