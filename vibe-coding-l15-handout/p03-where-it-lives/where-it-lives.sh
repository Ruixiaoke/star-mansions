#!/usr/bin/env bash
# P03 · 去看一眼它到底活在哪
#
# 这个脚本【只读】。它不创建、不修改、不删除任何东西。
# 跑完之后你的机器跟跑之前一模一样。
#
# 用法：bash where-it-lives.sh

set -uo pipefail

CFG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

line() { printf '%s\n' "------------------------------------------------------------"; }
exists() { [ -e "$1" ] && echo "  ✔ $1" || echo "  ✘ $1   （这台机器上没有）"; }

echo
echo "第一层 · 装给你自己的（换个项目它还在）"
line
echo "  配置根目录：$CFG"
exists "$CFG/settings.json"
exists "$CFG/plugins/installed_plugins.json"
exists "$CFG/plugins/known_marketplaces.json"
echo "  插件缓存：  $CFG/plugins/cache/"
echo "  市场克隆：  $CFG/plugins/marketplaces/"

echo
echo "第二层 · 跟着这个项目走的（进 git，别人 clone 下来就有）"
line
exists "./.claude/settings.json"
exists "./.mcp.json"
exists "./CLAUDE.md"

echo
echo "第三层 · 只在这台机器的这个项目（不进 git）"
line
exists "./.claude/settings.local.json"

echo
echo "装了哪些插件、各在哪一层"
line
if command -v claude >/dev/null 2>&1; then
  claude plugin list 2>/dev/null | sed 's/^/  /'
else
  echo "  （命令行里找不到 claude，跳过这一段）"
fi
echo
