# 第十五节《怎么把它交出去》· 课前包

> **上课前跑一遍 `p03-where-it-lives/`，其余的课上用。**
> 全部命令已在 macOS + Claude Code 2.1.296 上实测跑通（2026-10-11）。

---

## 目录

| 目录 | 用在哪一页 | 是什么 |
|---|---|---|
| `p03-where-it-lives/` | P03 | **只读**脚本，列出本机配置的三层落点 |
| `p13-my-package/` | P13–P17 | **你自己那个包的骨架**。它本身就是一个本地市场，里面有一个待填的插件 `my-handover` |
| `p17-clean-profile/` | P17 | 干净环境：建立 / 加市场 / 装 / 验证 / 清理 |
| `p17-offline-fallback/` | P17 · A2 | 已经填好的完整版本地市场，线上拉不到或者你卡住时顶替 |
| `p23-handover-template.md` | P23 | 交接说明四格空白模板 |
| `p27-removal-template.md` | P27 | 「我走了之后要收回什么」空白模板 |

---

## 安全保证

**这个课前包不会动你平时的配置。**

- `p03` 的脚本只读，不创建、不修改、不删除任何东西
- `p17` 的脚本把所有读写都靠 `CLAUDE_CONFIG_DIR` 引到一个独立的沙箱目录，
  而且脚本里有一道硬拦截：**沙箱路径一旦指向真实配置目录，直接拒绝执行**
- `clean` 之后你的 `~/.claude` 跟跑之前一模一样（实测过，md5 前后一致）

---

## 课上会敲的命令

```bash
# P03 · 去看一眼它活在哪（只读）
bash p03-where-it-lives/where-it-lives.sh

# P08 · 装一个现成的
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install feature-dev@claude-plugins-official --scope user

# P12 · 验证 —— 看清单，不看安装提示
claude plugin details feature-dev

# P17 · 把自己的包装到干净环境里
bash p17-clean-profile/clean-profile.sh new
bash p17-clean-profile/clean-profile.sh add ./p13-my-package
bash p17-clean-profile/clean-profile.sh install my-handover@my-package
bash p17-clean-profile/clean-profile.sh verify my-handover

# 下课前清掉沙箱
bash p17-clean-profile/clean-profile.sh clean
```

线上市场拉不到的时候，把中间两条换成兜底的那一套：

```bash
bash p17-clean-profile/clean-profile.sh add ./p17-offline-fallback
bash p17-clean-profile/clean-profile.sh install handover-demo@jr-l15-local
bash p17-clean-profile/clean-profile.sh verify handover-demo
```

---

## 自己做包时的两条铁律

**一、脚本路径用 `${CLAUDE_PLUGIN_ROOT}`，不许写死。**

写死的路径只在你这台机器上成立。别人装上之后钩子会静默失败，不报错、不提示，而他不会知道。

**二、做完先验证再交。**

```bash
claude plugin validate p13-my-package
```

---

## 怎么把骨架填成你自己的

`p13-my-package/plugins/my-handover/` 下面：

- `skills/` —— 把里面那个占位目录删掉，换成你第五节课造的技能目录（目录名就是技能名，里面一份 `SKILL.md`）
- `hooks/hooks.json` —— 换成你第十二节课那个钩子
- `scripts/` —— 钩子要跑的脚本放这里
- `.claude-plugin/plugin.json` —— 四行，把作者名改成你的

**占位的东西是能装得上的**，所以就算你一时找不到自己当初那个技能文件，P17 的流程照样走得通。
