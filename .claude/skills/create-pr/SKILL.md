---
name: create-pr
description: 把当前改动开成一个合规的 GitHub PR —— 本地预检 → 推分支 → 按 .github/pull_request_template.md 逐节填 body → 开 draft PR → 等 CI 全绿 → 转正式并指派 Rick（Ruixiaoke）review → 产出 Slack DM 文案交给你手动发。Use when 用户说「开 PR / 提 PR / 提交这些改动 / 推上去 / 走 PR 流程 / 让 Rick 看一下 / 让 Rick review」，或一段改动写完要交付给人 review 时 —— 即使只说了「提交一下」也走本 Skill，别裸奔 git push + gh pr create。本 Skill 只负责开到「等 review」为止，绝不合并。
argument-hint: [可选 — PR 标题或 issue 号，例："修时辰板块" 或 "#12"]
---

# 开 PR（star-mansions）

这个仓的 PR 有三条硬约束，来自 `CLAUDE.md §5`：**必须套模板**、**CI 全绿才给人看**、**绝不自合并**。
本 Skill 就是把这三条变成一条可靠的流水线，让 Rick 收到通知时打开的一定是一个已经绿了、body 填齐了的 PR。

## 核心节奏

先 draft、绿了再转正式，是刻意的：CI 只在 `pull_request` 事件跑（`push` 只有 main 触发），
所以**不开 PR 就没有 CI**。既然必须先开，那就开成 draft —— 这样 CI 能跑，而 Rick 在它变绿之前
不会被指派、不会收到 DM，不会浪费一次 context switch 去看一个红的 PR。

```
本地预检 → 分支 + commit → push → 开 draft PR（填好模板）
   → 等 CI → 红：拉日志、修、重推、重等 ┐
              绿：回填 CI checklist + Evidence → gh pr ready
                  → 指派 Ruixiaoke → 产出 Slack DM 文案（不自动发）
```

## 步骤

### 1. 摸清改动，别猜

```bash
git status --short && git branch --show-current
git diff --stat HEAD          # 未提交的
git log --oneline origin/main..HEAD   # 已 commit 但没推的
git log -3 --format='%s%n%b'  # 学本仓 commit 文风
```

先判断三件事，判断错了后面全歪：
- **改了什么、为什么改** —— body 的 Summary / Changes 全靠这个，读 diff 得出，不要复述用户的一句话需求当成改动清单。
- **影响范围** —— frontend / backend / 文档 / CI，直接决定 Checklist 哪些项适用。
- **是不是已经有 PR** —— `gh pr list --head <branch>`。有就走「更新已有 PR」（改 body + 重推 + 重等 CI），不要新开一个。

如果当前在 `main` 上：先 `git checkout -b <type>/<kebab-slug>`（type 取 feat/fix/refactor/docs/test/infra/chore，
对齐模板的 Type 分类；参考历史分支 `feat/supabase-storage`、`fix/benming-xiu-suyao`）。

### 2. 本地预检 —— 红了就地停下

```bash
npm run typecheck   # backend + frontend tsc --noEmit
npm run build       # backend tsc + frontend vite build
npm test            # 后端 Vitest —— 改了 backend / 测算逻辑才必须跑
```

**把真实输出留着**，Evidence 一节要贴它，不许凭印象编。
任何一条红：修好再继续。不要抱着「本地红但 CI 说不定绿」的侥幸推上去 —— 那只是把等待时间拉长 10 分钟。

顺手做一遍红线自查（`CLAUDE.md §0`，这些是这个项目会被打回的高频原因）：
- diff 里有没有硬编码密钥、`.env` 有没有被 `git add` 进去
- 改了样式的话，有没有手写 hex / px（本仓只走 `tokens.css` 变量，§4）
- 改了 Result / About 页的话，免责声明还在不在（§0-1）
- 改了接口的话，`docs/technical/API_CONTRACT.md` 和前后端 `types/contract.ts` 同步了没

### 3. commit + push

commit 走 `<type>: <中文或英文一句话>` + 正文说明「为什么」，文风照 `git log`。
末行加：`Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

```bash
git push -u origin <branch>    # 推 origin（Ruixiaoke/star-mansions），不推 fork
```

`git push` 在本仓需要确认（`.claude/settings.json` 的 ask 名单），被拦下就等用户放行，别换个写法绕过去。

### 4. 写 PR body —— 逐节填，不留 `<!-- -->` 注释

读 `.github/pull_request_template.md` 拿到当前节次（模板会变，以文件为准），
逐节替换掉 HTML 注释占位。参考 `references/PR_BODY_EXAMPLE.md`（PR #10 的真实 body，本仓公认的填法基准）。

写进临时文件再传给 `gh`，别用 `-b "长字符串"`：

```bash
cat > "$SCRATCH/pr-body.md" <<'EOF'
...
EOF
gh pr create --draft --base main --title "<type>: <标题>" --body-file "$SCRATCH/pr-body.md"
```

各节要点：
- **Summary** —— 一句话说清这个 PR 干了什么，别写成需求背景。
- **Related Issue** —— 有 issue 写 `Fixes #123`，没有写 `N/A`，不要留空。
- **Type** —— 勾中的打 `[x]`，可以多勾（如同时 docs + chore）。
- **Changes** —— 一条一个改动，写「改了什么 + 为什么」，读 diff 得出，别漏文件也别把一次重命名拆成八条。
- **Design Note** —— 非平凡改动才展开；纯文案 / typo 可以写「平凡改动，略」。展开时按模板注释里的五点走：
  解决的问题 / 影响范围 / 契约改动 / 风险 / 测试计划。
- **Checklist** —— 见下面的对照表。
- **Screenshots / Evidence** —— 贴步骤 2 的**真实输出**（代码块）。UI 改动贴前后截图；API 改动贴 curl 输出。
  没有可贴的就说明为什么没有，不要留空。

#### Checklist 怎么勾（诚实优先）

假勾是这个仓最不能碰的东西：Rick 是靠这些勾判断「哪些我不用再查」的，勾错一次，
以后每一项他都得自己重验，这个 checklist 就废了。所以宁可留空 + 写原因，也不要凭感觉勾。

| 模板项 | 勾 `[x]` 的条件 | 不满足时 |
|---|---|---|
| CI 全绿 | **第 6 步 CI 真的绿了之后回填** | 开 draft 时先留空 |
| 类型检查 `npm run typecheck` | 本地实跑且退 0 | 没跑就别勾 |
| 构建 `npm run build` | 本地实跑且退 0 | 没跑就别勾 |
| 测试 `npm test` | 改了 backend / 测算逻辑，且实跑通过 | 留空 + 标 `N/A，未改后端逻辑` |
| 无硬编码密钥 | diff 自查过，`.env` 未入库 | —— 这项永远要能勾，勾不了说明有问题要先改 |
| 只走 `tokens.css` 变量 | 改了样式且确认无硬编码 hex/px | 留空 + 标 `N/A，未改样式` |
| 免责声明仍在 | 改了 Result / About 页且确认还在 | 留空 + 标 `N/A，未改相关页面` |
| 契约已同步 | 改了接口且同步了 API_CONTRACT.md + 两侧 types | 留空 + 标 `N/A，未改接口` |
| 文档已更新 | 改动需要文档同步且已同步 | 留空 + 标 `N/A，无需文档改动` |

不适用项统一写成 `- [ ] <原文> —— N/A，<一句话原因>`。

### 5. 开 draft PR

```bash
gh pr create --draft --base main --title "..." --body-file "$SCRATCH/pr-body.md"
```

`gh pr create` 也在 ask 名单里，等用户放行。拿到 PR 号/URL 后告诉用户，让他知道东西已经在跑 CI 了。

### 6. 等 CI 全绿 —— 这是本 Skill 的门禁

```bash
.claude/skills/create-pr/scripts/wait-ci.sh <pr-number>
```

**用 Bash 的 `run_in_background` 跑它**，CI 通常要几分钟，你不该在前台干等。
脚本会先等 checks 注册（刚开 PR 时 `gh pr checks` 会报 "no checks reported"，直接调会误判），
然后阻塞到跑完，最后打印 `CI_RESULT=GREEN` / `CI_RESULT=RED`；红的话顺带把失败 job 的日志尾巴打出来。

本仓 PR 上只有 `CI / verify` 一个 check（`npm ci → typecheck → build`）；
`Deploy to GitHub Pages` 只在 push main 时跑，PR 上看不到它是正常的，别等它。

- **绿了** → 进第 7 步。
- **红了** → 读日志定位、在分支上修、`git push`、**重跑本步骤**。红着不许往下走，这是用户对本 Skill 的核心要求。
- 修完重推后，记得把新增的改动补进 body 的 Changes（别让 body 和最终 diff 对不上）。
- 如果连红三轮还没头绪，或者失败原因在代码之外（缺仓库变量、Actions 配额、外部服务挂了），
  停下来把现状和你的判断讲给用户，让他决定 —— 别自己扩大改动范围去硬凑绿灯。

### 7. 回填 + 转正式 + 指派 Rick

CI 绿之后，先把 body 补完整，再转正式 —— 顺序反了 Rick 会看到一个「CI 全绿」还没勾的 PR：

```bash
# ① 把 Checklist 的「CI 全绿」勾上，Evidence 里补一行 CI 结果
gh pr edit <pr> --body-file "$SCRATCH/pr-body.md"
# ② 转正式
gh pr ready <pr>
# ③ 指派 Rick
gh pr edit <pr> --add-reviewer Ruixiaoke
```

Evidence 补的那行给出可核对的事实，例如：
`CI: ✅ CI / verify passed — https://github.com/Ruixiaoke/star-mansions/actions/runs/<id>`

指派失败最常见的原因是 PR 作者就是 `Ruixiaoke`（GitHub 不让自己 review 自己）。
真遇到就如实报告「指派失败，原因 X」，并在 Slack 文案里带上 PR 链接 —— 不要假装指派成功了。

### 8. 产出 Slack DM 文案（**不自动发**）

本环境没接 Slack（没有 Slack MCP / CLI / webhook），所以这一步的交付物是**一段能直接复制粘贴的文案**。
把它单独用代码块输出，并明确说一句「Slack 未接入，请手动发给 Rick」。
**绝不能说「已通知 Rick」之类的话** —— 消息还没发出去，写了就是谎报，Rick 会以为有人告诉过他。

```
Rick，PR #<n> 可以 review 了 👀
<type>: <标题>
<PR URL>

· 改了啥：<一句话>
· 影响范围：<frontend / backend / 文档>
· CI：✅ 全绿（CI / verify）
· 要你拍板的点：<有就写，没有写「无」>

按 CLAUDE.md §5 我不自合并，等你 review 完由你合。
```

「要你拍板的点」是这段文案最有价值的一行 —— 契约改动、铁律措辞变更、有风险的取舍、
你拿不准的实现选择，都写在这里。没有就老实写「无」，别硬凑。

### 9. 收尾

给用户一份简报：PR 链接 + CI 状态 + 已指派 reviewer + Slack 文案在上面待发。

**到此为止。绝不执行 `gh pr merge`**（`CLAUDE.md §5` 不自合并 = 合并即触发部署；
`.claude/settings.json` 也把它放进了 deny）。即使 CI 全绿、即使改动很小，合并权在 Rick。
用户明确说「可以合了」时，也让他自己合或再次确认，不要顺手就合。

## 支持文件

- `references/PR_BODY_EXAMPLE.md` —— PR #10 的真实 body，写第 4 步之前读它对齐颗粒度
- `scripts/wait-ci.sh` —— 第 6 步的 CI 门禁：等注册 → 等跑完 → GREEN/RED + 失败日志
