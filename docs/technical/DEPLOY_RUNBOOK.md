# 部署 Runbook（backend → Vercel · frontend → GitHub Pages）

> 本文是 `CLAUDE.md §8` 的操作化展开：§8 说「为什么」，本文说「按什么顺序敲」。
> 两者冲突时以 `CLAUDE.md §8` 为准。

## 后端上线前检查

1. **确认函数产物是 CommonJS**（踩过一次全站 500）：
   ```
   npx tsc -p backend/tsconfig.json --noEmit false --outDir /tmp/emitcheck
   grep -rl "^import " /tmp/emitcheck/api/ && echo "❌ 产物是 ESM，改 backend/tsconfig.json" || echo "✅ CJS"
   ```
2. **Node 版本锁 22** —— `backend/package.json` 与根 `package.json` 的 `engines.node` 都要是 `22.x`。
3. **env 顺序不能反** —— 先在 Supabase SQL Editor 跑 `backend/db/schema.sql` 建表，
   **再**在 Vercel 配 `SUPABASE_URL` / `SUPABASE_SECRET_KEY`。反了会让 `/api/auth`、`/api/history` 500。

## 前端上线前检查

- 仓库变量 `VITE_API_BASE` 必须已设为后端生产域名；Pages workflow 里有 guard，空值直接失败。
- 换前端域名时，同步改 `backend/src/cors.ts` 的默认放行来源。

## 验证不了的东西

预览部署有 Deployment Protection（401），黑盒 `curl` 验不了。所以靠上面第 1 条本地 emit 验证，
合并后再用生产域名实测 —— 不要用「Vercel 显示绿」当成「函数能跑」。
