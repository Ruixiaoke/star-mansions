# docs/external/ — 外部资料查证卡片索引

本文件夹放**仓库外部对象**的查证卡片：npm 依赖 / 第三方 HTTP API / MCP server / CLI 工具 / 外部数据源。
一个外部对象一张卡片（`<kebab-case-名称>.md`），**不合并写**。

- 写卡片的流程与纪律：[`.claude/skills/external-docs-search/SKILL.md`](../../.claude/skills/external-docs-search/SKILL.md)
- 模板：[依赖/API/MCP/CLI](../../.claude/skills/external-docs-search/templates/DEPENDENCY.md) · [数据源](../../.claude/skills/external-docs-search/templates/DATA.md)

## 用法

1. **先查这张表**。已有卡片且**版本匹配**、**抓取日期在 90 天内** → 直接读卡片，不联网。
2. 缺失或过期 → 跑 Skill（联网查官方文档 → 填模板 → 落盘 → 回来加/改这里一行）。
3. 编码时**只依据卡片里标为「已验证」的内容**；「部分验证 / 未验证」的部分先回报用户，不许自行补全。

置信度取值：`已验证` · `部分验证` · `未验证 —— 待补`（宁可标低，见 CLAUDE.md §0-2 不臆造）。

## 卡片

| 名称 | 类型 | 版本 | 抓取日期 | 置信度 | 链接 |
|------|------|------|----------|--------|------|
| gh（GitHub CLI） | CLI | 2.95.0 | 2026-07-26 | 已验证 | [gh-cli.md](./gh-cli.md) |
