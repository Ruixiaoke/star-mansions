## Summary

<!-- What does this PR do? One sentence. -->

## Related Issue

<!-- Link the GitHub Issue: Fixes #123 / Closes #123，没有就写 N/A -->

## Type

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code restructuring (no behaviour change)
- [ ] `docs` — Documentation only
- [ ] `test` — New or updated tests
- [ ] `infra` — Infrastructure / DevOps / CI
- [ ] `chore` — Maintenance

## Changes

<!-- Bullet list of what changed and why. -->

-

## Design Note

<!-- 非平凡改动请说明： -->
<!-- - 解决的问题 -->
<!-- - 影响范围（frontend / backend / 两者） -->
<!-- - 契约 / API 改动（同步 docs/API_CONTRACT.md 与前后端 types/contract.ts） -->
<!-- - 风险 -->
<!-- - 测试计划 -->

## Checklist

- [ ] CI 全绿（`.github/workflows/ci.yml`：`npm ci` → `npm run typecheck` → `npm run build`）
- [ ] 类型检查通过：`npm run typecheck`（backend + frontend `tsc --noEmit`）
- [ ] 构建通过：`npm run build`（backend `tsc` + frontend `vite build`）
- [ ] 测试通过：`npm test`（后端 Vitest）—— 若涉及测算 / 后端逻辑
- [ ] 无硬编码密钥；`.env` 未入库（仅 `.env.example`）
- [ ] 前端只走 `tokens.css` 变量，无硬编码 hex / px —— 若改样式（CLAUDE §4）
- [ ] 结果页 / About 免责声明仍在 —— 若改相关页（CLAUDE §0-1）
- [ ] 前后端契约变更已同步 `docs/API_CONTRACT.md` 与两侧类型 —— 若改接口
- [ ] 文档已更新（PRD / docs，若适用）

## Screenshots / Evidence

<!-- UI 改动贴前后截图；API 改动贴 curl / httpie 输出。 -->
