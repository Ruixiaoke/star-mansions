# gh（GitHub CLI）

- **置信度**：**已验证** —— 全部结论出自官方 manual，并用本地 `gh 2.95.0` 真实输出交叉核对
- **类型**：CLI
- **版本 / endpoint 版本**：本地 `gh version 2.95.0 (2026-06-17)`；官方 manual 页面**不带版本号**（只反映最新版）〔来源：`gh --version` · 本地真实输出〕
- **官方文档**：<https://cli.github.com/manual/>（抓取日期 2026-07-26）
- **最后核对**：2026-07-26

## 为什么用它
用 GitHub 官方 CLI 做工具开发（脚本 / 自动化 / gh 扩展），比手写 REST 调用省掉鉴权、分页、repo 推断。
**替代方案**：直接 `curl` GitHub REST —— 要自己管 token 与分页；Octokit（JS SDK）—— 引 npm 依赖且需 §1 理由，做「命令行工具」时 `gh api` 更轻。**注**：本项目已在用 `gh`（`.claude/skills/create-pr`），不新增依赖。

## 安装 / 接入
本机已装（`gh 2.95.0`）。鉴权走 `gh auth login`，或在 CI 用环境变量（下表）。

## 鉴权与环境变量
| 变量名 | 用途（官方原文摘要） | 归属 |
|--------|------|------|
| `GH_TOKEN` / `GITHUB_TOKEN` | 「an authentication token that will be used when a command targets either `github.com` or a subdomain of `ghe.com`」，按此优先级取 | CI / 本地 shell |
| `GH_ENTERPRISE_TOKEN` / `GITHUB_ENTERPRISE_TOKEN` | 目标为 GHES 主机时的 token | 不适用本项目 |
| `GH_REPO` | 「specify the GitHub repository in the `[HOST/]OWNER/REPO` format」，覆盖当前目录推断 | 脚本内 |
| `GH_HOST` | 指定 GitHub 主机名 | 不适用本项目 |
| `GH_DEBUG` | 「set to a truthy value to enable verbose output on standard error. Set to `api` to additionally log details of HTTP traffic」 | 调试用 |
| `GH_PROMPT_DISABLED` | 「set to any value to disable interactive prompting」—— **脚本里必设**，否则会卡在交互 | 脚本 / CI |
| `GH_PAGER` | 分页程序；脚本里设空可避免被 pager 吞输出 | 脚本 |
| `GH_FORCE_TTY` | 「force terminal-style output even when the output is redirected」 | 仅需要彩色/表格时 |
| `NO_COLOR` | 任意值 → 不输出 ANSI 颜色 | CI 日志 |
〔来源：<https://cli.github.com/manual/gh_help_environment> · 官方文档 · 2026-07-26〕
⚠️ 只写变量**名**；token 值绝不进代码 / 文档 / 日志（CLAUDE.md §0-3）。

## 核心用法速查

### 1. `gh api` — 打任意 REST / GraphQL 端点
`gh api <endpoint> [flags]`　「Makes an authenticated HTTP request to the GitHub API and prints the response.」
端点为 API v3 路径，或 `graphql` 走 v4；`{owner}` `{repo}` `{branch}` 会被当前目录 repo（或 `GH_REPO`）替换。
〔来源：<https://cli.github.com/manual/gh_api> · 官方文档；本地 `gh api --help` 一致 · 本地真实输出〕

常用 flag（官方原文）：`-X/--method`（默认 GET，带参数时默认 POST）、`-f/--raw-field key=value`（字符串参数）、`-F/--field key=value`（带类型，支持 `@<path>` / `@-` 读文件或 stdin）、`--input <file>`（请求体，`-` = stdin）、`-H/--header key:value`、`--paginate`（「Make additional HTTP requests to fetch all pages of results」）、`--slurp`（「Use with "--paginate" to return an array of all pages」）、`-q/--jq`、`-t/--template`、`--cache <duration>`（如 `1h`）、`-i/--include`、`--silent`、`--verbose`、`--hostname`、`-p/--preview`。

```bash
gh api repos/{owner}/{repo}/releases
gh api repos/{owner}/{repo}/issues/123/comments -f body='Hi from CLI'
gh api -X GET search/issues -f q='repo:cli/cli is:open remote'
gh api repos/{owner}/{repo}/issues --jq '.[].title'
gh api --paginate --slurp repos/{owner}/{repo}/commits   # 全部页合成一个数组
```

### 2. 内建命令的结构化输出 —— `--json` / `--jq` / `--template`
- 「Some commands support passing the `--json` flag」；`--json` 需**逗号分隔的字段列表**。
- **字段名怎么查**：「To view the possible JSON field names for a command omit the string argument to the `--json` flag」——
  本地实测 `gh pr list --json` → 输出 `Specify one or more comma-separated fields for --json:` + 字段清单（`additions` / `assignees` / `author` / `autoMergeRequest` / `baseRefName` …）〔本地真实输出〕
- `--jq`（jq 语法）与 `--template`（Go template）**必须先给 `--json`**。
- template 可用函数：`autocolor` `color` `join` `pluck` `tablerow` `tablerender` `timeago` `timefmt` `truncate` `hyperlink`，另有 Sprig 的 `contains` / `hasPrefix` / `hasSuffix` / `regexMatch`。
〔来源：<https://cli.github.com/manual/gh_help_formatting> · 官方文档 · 2026-07-26〕

```bash
gh pr list --json number,title,author --jq '.[].author.login'
```

### 3. 退出码（写脚本判分支用）
`0` 成功 · `1` 失败 · `2` 被取消 · `4` 需要鉴权。个别命令可能有额外码。
〔来源：<https://cli.github.com/manual/gh_help_exit-codes> · 官方文档 · 2026-07-26〕

### 4. 做 gh 扩展（自研工具的推荐形态）
`gh extension create [<name>] [flags]`，唯一 flag `--precompiled string`（「Possible values: go, other」）。
三种形态：交互创建 / 脚本型（`gh extension create foobar`）/ 预编译（`--precompiled=go` 或 `other`）。
〔来源：<https://cli.github.com/manual/gh_extension_create> · 官方文档；本地 `gh extension create --help` 一致 · 本地真实输出〕

## 常见坑与限制
- **`gh api` 没有 `--json` flag**（只有 `-q/--jq` 和 `-t/--template`）。本地实测 `gh api --json` → `unknown flag: --json`。`--json` 是 `gh pr list` 这类内建命令的 flag。〔本地真实输出 · 已排除某二手摘要的错误说法〕
- 脚本里务必 `GH_PROMPT_DISABLED=1`，否则命令可能停在交互提示；输出被重定向时默认无颜色/非表格样式（要样式才设 `GH_FORCE_TTY`）。
- `--paginate` 只是「顺序多打几次 HTTP」；不加 `--slurp` 时是**多段 JSON 拼接**而非单个数组，`jq` 处理前要注意。
- PowerShell 下含 `{...}` 的端点需加引号（官方明确提醒）。
- 顶层命令组见 manual 首页（`api` `auth` `pr` `issue` `run` `repo` `release` `workflow` `search` `extension` `project` `ruleset` `variable` `secret` …）。

## 版本兼容与破坏性变更
**未知 —— 未读 CHANGELOG / releases**。官方 manual 页面无版本标注，写的是最新版行为；本卡片行为均已在 `2.95.0` 本地复核。各 flag（如 `--slurp`）的**最低可用版本未查**。

## 本项目内的使用位置
- `.claude/skills/create-pr/`（开 PR 流程）
- 本会话用过：`gh pr list` / `gh pr create --body-file`

## 未解决问题
- [ ] #1 `--slurp` 等 flag 的最低 gh 版本未查 —— 需要：cli/cli releases / CHANGELOG
- [ ] #2 扩展仓库是否**必须**以 `gh-` 前缀命名：`gh_extension_create` 官方页面**未明说**（「推断，未证实」）—— 需要：`gh extension` 组页面或官方扩展开发指南
- [ ] #3 API 限流 / 配额数值未查（`gh api` 页面未列）—— 需要：docs.github.com REST 限流页
- [ ] #4 GraphQL（`gh api graphql`）的参数写法未逐条核对 —— 需要：官方 `gh api` 页 GraphQL 段落细读

## 来源清单
| # | URL 或本地路径 | 抓取日期 | 来源等级 |
|---|----------------|----------|----------|
| 1 | <https://cli.github.com/manual/> | 2026-07-26 | 官方文档 |
| 2 | <https://cli.github.com/manual/gh_api> | 2026-07-26 | 官方文档 |
| 3 | <https://cli.github.com/manual/gh_help_environment> | 2026-07-26 | 官方文档 |
| 4 | <https://cli.github.com/manual/gh_help_formatting> | 2026-07-26 | 官方文档 |
| 5 | <https://cli.github.com/manual/gh_help_exit-codes> | 2026-07-26 | 官方文档 |
| 6 | <https://cli.github.com/manual/gh_extension_create> | 2026-07-26 | 官方文档 |
| 7 | 本地 `gh --version` / `gh api --help` / `gh pr list --json` / `gh extension create --help` 输出 | 2026-07-26 | 本地真实输出（官方仓库产物级） |
