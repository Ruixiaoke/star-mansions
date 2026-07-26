---
name: 短横线命名（可省略，省略就用目录名）
description: [这个 Skill 是干嘛的，一句话] + Use when [什么场景该触发，写到 Agent 能判断"现在算不算"]
argument-hint: [可选 — 只有支持 /name 显式调用带参数时才写，例：[issue-number] 或 [filename] [format]]
---

## 步骤
1. [先读什么前置信息 — 如 PRD.md / CLAUDE.md / 相关配置]
2. [核心动作第一步]
3. [核心动作第二步]
4. [输出什么 / 交付什么形式]
5. [如果需要用户确认，在哪一步等确认]

可选支持文件（不是每个 Skill 都需要，按需加）：
your-skill-name/
├── SKILL.md          必填 · Agent 触发时读全文
├── REFERENCE.md      可选 · Resources 类，详细参考资料，供查阅不执行
├── FORMS.md          可选 · Instructions 类，更细的操作指南
└── scripts/
    └── xxx.py        可选 · Code 类，Claude 执行，代码本身不进 context，只有运行结果进

---
2️⃣ description 自检清单（课上说九成翻车都在这一行）

写完先对着这四条检查：

- [ ] 两句话都写了 —「做什么」+「Use when 什么场景」，缺一不可
- [ ] 没有太泛 — 不能是「帮忙做设计」这种万能句，太泛会抢别的 Skill 的戏
- [ ] 没有太窄 — 不能只写做什么不写何时用，否则该用时 Agent 判断不出来
- [ ] 只认一类事 — 一个 Skill 只做一件事，别做成"万能 Skill"；塞太多就拆成多个小而专的
