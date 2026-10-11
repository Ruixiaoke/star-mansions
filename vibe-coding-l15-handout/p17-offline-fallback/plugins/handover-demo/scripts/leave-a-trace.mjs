#!/usr/bin/env node
// 样例钩子脚本。
//
// 这个脚本存在的唯一理由，是证明「这个包真的在工作」——
// 不是看安装提示，是看行为。
//
// ⭐ 注意 hooks.json 里是怎么指向它的：用 ${CLAUDE_PLUGIN_ROOT}，不是写死路径。
//    写死的路径只在你这台机器上成立，别人装上之后钩子会静默失败，
//    而他不会知道。

const root = process.env.CLAUDE_PLUGIN_ROOT ?? '(未设置)';

console.log(`[handover-demo] 这个包在工作。它被装在：${root}`);

// 钩子必须正常退出。永远。
process.exit(0);
