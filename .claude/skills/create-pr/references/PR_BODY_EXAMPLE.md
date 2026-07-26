# PR body 填法基准（真实样本：PR #10）

下面是本仓 [PR #10](https://github.com/Ruixiaoke/star-mansions/pull/10) 的真实 body，
用来对齐**颗粒度**，不是用来照抄措辞的。写 body 时对照这几点：

- **Summary** 一句话，说这个 PR 干了什么，不铺垫背景。
- **Changes** 每条 = 改了什么 + 为什么 / 对齐哪条规则；一次重命名归一条，别拆成八条。
- **Design Note** 按模板注释的五点走（问题 / 影响范围 / 契约 / 风险 / 测试计划），每点一行。
- **Checklist** 勾了的补一句依据（「本地已过」），没勾的补一句原因（「N/A，未改样式」）。
  注意这份样本开 PR 时 CI 还没跑完，所以「CI 全绿」留空写了「待 PR 打开后确认」——
  本 Skill 的流程是**等 CI 绿了回填勾上**，比这份样本更进一步。
- **Evidence** 贴命令的真实输出，不编。

---

## Summary

新增 `.claude/` 项目级配置（权限基线 + skill 模版），并把 `docs/` 从扁平结构按产品/工程/设计拆成子文件夹。

## Related Issue

N/A

## Type

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code restructuring (no behaviour change)
- [x] `docs` — Documentation only
- [ ] `test` — New or updated tests
- [ ] `infra` — Infrastructure / DevOps / CI
- [x] `chore` — Maintenance

## Changes

- 新增 `.claude/settings.json`：权限基线 —— push / `gh pr merge` / vercel 部署等需确认，禁止 force-push 和读取 `.env`/密钥文件（对齐 CLAUDE.md §5「不自合并」、§0-3「密钥不进 git」）
- 新增 `.claude/skills/TEMPLATE.md`：SKILL.md 编写模版
- `.gitignore` 忽略 `.claude/settings.local.json`（个人本地覆盖，不共享）
- `docs/` 内部重组：`PRD.md` → `docs/prd/PRD.md`，`tokens.css` → `docs/design/tokens.css`，`API_CONTRACT.md` / `SCAFFOLD_PLAN.md` → `docs/technical/`，新增 `docs/INDEX.md` 作为总索引
- 同步修正因这次重组产生的死链引用：根 `README.md`、`frontend`/`backend` 的 `contract.ts` 头部注释、`docs/technical/SCAFFOLD_PLAN.md` 自引用、`.github/pull_request_template.md`

## Design Note

- 解决的问题：`.claude/` 目录此前不存在，缺少项目级权限/工具配置；`docs/` 之前是扁平结构，按类型分文件夹后更易导航
- 影响范围：仅工具配置 + 文档；`contract.ts` 两处改动只是注释里的路径引用，契约类型本身未变
- 契约 / API 改动：无实际契约变化，仅路径引用同步
- 风险：低 —— 纯文档搬移 + 路径修正 + 新增配置文件，无 frontend/backend 运行时逻辑改动
- 测试计划：本地跑 `npm run typecheck`、`npm run build` 全绿（见下方 Evidence）；未跑 `npm test`，因为没有改动后端测算/业务逻辑

## Checklist

- [ ] CI 全绿（`.github/workflows/ci.yml`：`npm ci` → `npm run typecheck` → `npm run build`）—— 待 PR 打开后 CI 跑完确认
- [x] 类型检查通过：`npm run typecheck`（backend + frontend `tsc --noEmit`）—— 本地已过
- [x] 构建通过：`npm run build`（backend `tsc` + frontend `vite build`）—— 本地已过
- [ ] 测试通过：`npm test`（后端 Vitest）—— N/A，未改后端测算/业务逻辑
- [x] 无硬编码密钥；`.env` 未入库（仅 `.env.example`）
- [ ] 前端只走 `tokens.css` 变量，无硬编码 hex / px —— N/A，未改样式
- [ ] 结果页 / About 免责声明仍在 —— N/A，未改相关页面
- [x] 前后端契约变更已同步 `docs/technical/API_CONTRACT.md` 与两侧类型 —— 仅路径引用同步，契约内容未变
- [x] 文档已更新（PRD / docs，若适用）—— 本 PR 主体即文档重组

## Screenshots / Evidence

本地验证输出：

```
$ npm run typecheck
> backend@0.0.0 typecheck / tsc --noEmit  ✔
> frontend@0.0.0 typecheck / tsc --noEmit  ✔

$ npm run build
> backend@0.0.0 build / tsc --noEmit  ✔
> frontend@0.0.0 build / tsc --noEmit && vite build
✓ 60 modules transformed.
✓ built in 350ms
```
