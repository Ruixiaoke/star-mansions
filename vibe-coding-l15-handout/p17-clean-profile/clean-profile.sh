#!/usr/bin/env bash
# P17 · 干净环境 —— 建立 / 装 / 验证 / 清理
#
# ⚠️ 这个脚本【不会动你的日常配置】。
#    它靠 CLAUDE_CONFIG_DIR 把所有读写都引到一个临时目录里。
#    clean 之后，你的机器跟跑之前一模一样。
#
# 用法：
#   bash clean-profile.sh new                 建一个干净环境
#   bash clean-profile.sh add  <市场>          在干净环境里加市场（URL / 本地路径 / GitHub repo）
#   bash clean-profile.sh install <插件@市场>   在干净环境里装
#   bash clean-profile.sh verify <插件>        看【行为】，不看提示
#   bash clean-profile.sh clean               全部清掉

set -uo pipefail

PROFILE="${L15_PROFILE:-$HOME/.claude-l15-sandbox}"

banner() { printf '\n\033[1m%s\033[0m\n%s\n' "$1" "------------------------------------------------------------"; }
guard() {
  # 双保险：绝不允许指向真实配置目录
  case "$PROFILE" in
    "$HOME/.claude"|"$HOME/.claude/") echo "拒绝执行：沙箱路径指向了真实配置目录。"; exit 1 ;;
  esac
  [ -n "$PROFILE" ] || { echo "拒绝执行：沙箱路径为空。"; exit 1; }
}

cmd="${1:-}"; shift || true
guard

case "$cmd" in
  new)
    banner "建一个干净环境"
    mkdir -p "$PROFILE"
    echo "  位置：$PROFILE"
    echo
    echo "  里面现在有什么："
    CLAUDE_CONFIG_DIR="$PROFILE" claude plugin list 2>&1 | sed 's/^/    /'
    echo
    echo "  ⬆ 这就是「干净」的样子。你的日常配置一个都没进来。"
    ;;

  add)
    [ $# -ge 1 ] || { echo "要给一个市场来源：URL / 本地路径 / GitHub repo"; exit 1; }
    banner "在干净环境里加市场"
    CLAUDE_CONFIG_DIR="$PROFILE" claude plugin marketplace add "$1" 2>&1 | sed 's/^/  /'
    ;;

  install)
    [ $# -ge 1 ] || { echo "要给一个 插件@市场"; exit 1; }
    banner "在干净环境里装"
    CLAUDE_CONFIG_DIR="$PROFILE" claude plugin install "$1" --scope user -y 2>&1 | sed 's/^/  /'
    ;;

  verify)
    [ $# -ge 1 ] || { echo "要给一个插件名"; exit 1; }
    banner "验证 —— 看它带进来了什么，不看安装提示"
    CLAUDE_CONFIG_DIR="$PROFILE" claude plugin details "$1" 2>&1 | sed 's/^/  /'
    echo
    echo "  ⬆ 这一行一行，是它【实际】带进来的东西。"
    echo "     安装提示只证明动作执行了，这份清单才证明东西在。"
    ;;

  clean)
    banner "清理"
    if [ -d "$PROFILE" ]; then
      rm -rf "$PROFILE"
      echo "  已删除：$PROFILE"
    else
      echo "  本来就不存在：$PROFILE"
    fi
    echo
    echo "  你的日常配置："
    echo "    $HOME/.claude  —— 从头到尾没有被碰过"
    ;;

  *)
    sed -n '1,16p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
echo
