#!/usr/bin/env node
// 占位脚本。
//
// ⭐ 看 hooks.json 是怎么指向它的：用 ${CLAUDE_PLUGIN_ROOT}，不是写死路径。
//    写死的路径只在你这台机器上成立。别人装上之后钩子会静默失败，而他不会知道。
console.log(`[my-handover] 这个包在工作。它被装在：${process.env.CLAUDE_PLUGIN_ROOT ?? '(未设置)'}`);
process.exit(0);
