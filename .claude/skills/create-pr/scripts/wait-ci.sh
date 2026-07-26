#!/usr/bin/env bash
# 等一个 PR 的 CI 跑完并给出明确结论。
#
#   用法: wait-ci.sh <pr-number-or-url>
#   建议用 Bash 的 run_in_background 跑，CI 通常几分钟。
#
#   输出末尾必有一行 CI_RESULT=GREEN|RED|TIMEOUT|ERROR，据此判断能不能往下走。
#   退出码: 0=绿 1=红 2=超时 3=用法/环境错误
#
# 为什么要这个脚本而不是直接 gh pr checks --watch：
#   刚 create 完 PR 时 workflow 还没注册，gh 会直接返回 "no checks reported"，
#   裸调会把「还没开始」误判成「没有 CI，可以走了」—— 那正好绕过了本 Skill 的门禁。

set -uo pipefail

PR="${1:-}"
if [ -z "$PR" ]; then
  echo "用法: wait-ci.sh <pr-number-or-url>" >&2
  echo "CI_RESULT=ERROR"
  exit 3
fi

TIMEOUT="${CI_WAIT_TIMEOUT:-1800}"   # 整体最多等 30 分钟
POLL="${CI_WAIT_POLL:-15}"

command -v gh >/dev/null 2>&1 || { echo "找不到 gh CLI" >&2; echo "CI_RESULT=ERROR"; exit 3; }

echo "==> 等 PR $PR 的 CI（超时 ${TIMEOUT}s）"

# ── 1. 等 checks 注册 ────────────────────────────────────────────────
start=$SECONDS
until gh pr checks "$PR" >/dev/null 2>&1; do
  if [ $(( SECONDS - start )) -ge "$TIMEOUT" ]; then
    echo "==> 等了 ${TIMEOUT}s，checks 始终没注册。去 PR 页面看看 workflow 是不是没触发。"
    echo "CI_RESULT=TIMEOUT"
    exit 2
  fi
  sleep "$POLL"
done
echo "==> checks 已注册，开始等结果…"

# ── 2. 阻塞等到所有 check 出结果 ────────────────────────────────────
# --watch 自己会轮询到没有 pending 为止；退出码 0=全过，非 0=有失败。
gh pr checks "$PR" --watch --interval "$POLL" >/dev/null 2>&1
rc=$?

echo "--- gh pr checks ---"
gh pr checks "$PR" 2>&1 || true
echo "--------------------"

if [ "$rc" -eq 0 ]; then
  echo "CI_RESULT=GREEN"
  exit 0
fi

# ── 3. 红了：把失败 job 的日志尾巴捞出来，省一轮来回 ────────────────
branch=$(gh pr view "$PR" --json headRefName -q .headRefName 2>/dev/null)
if [ -n "$branch" ]; then
  run_id=$(gh run list --branch "$branch" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null)
  if [ -n "$run_id" ]; then
    echo "--- 失败日志（run $run_id，尾 80 行）---"
    gh run view "$run_id" --log-failed 2>&1 | tail -80 || true
    echo "--- 完整日志: gh run view $run_id --log-failed ---"
  fi
fi

echo "CI_RESULT=RED"
exit 1
