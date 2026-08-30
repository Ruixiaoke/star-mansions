#!/usr/bin/env node
/**
 * fetch-gua.mjs —— 抓取维基文库《周易》64 卦页，生成 `frontend/src/data/gua.ts`（原文层）。
 *
 * ── 数据来源 ────────────────────────────────────────────────────────────────
 *   zh.wikisource《周易/<卦名>》共 64 页，MediaWiki API：
 *     https://zh.wikisource.org/w/api.php?action=parse&page=周易/乾&prop=wikitext
 *   页面索引：https://zh.wikisource.org/wiki/周易
 *
 * ── 授权（铁律 §0-5 素材合规）────────────────────────────────────────────────
 *   底本为先秦文献 = 公有领域；维基文库录入者的贡献按 Wikimedia 使用条款以
 *   CC BY-SA 4.0 + GFDL 提供。故产出的数据文件头必须写明署名与源 URL。
 *   〔https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use〕
 *   ⚠️ ctext.org 明文禁止批量抓取，本脚本不碰该站（docs/external/liuyao-coin-method.md §4.3）。
 *
 * ── 这个脚本为什么要入仓（PRD liuyao §23-Q2 选项 A）────────────────────────
 *   448 条原文（64 卦辞 + 384 爻辞）不可能手工录入，也不能凭记忆写。脚本入仓 =
 *   「这份数据哪来的」可复跑、可审计、可比对，对齐铁律 §0-2「不臆造、可查证」。
 *
 * ── 抓取纪律 ────────────────────────────────────────────────────────────────
 *   · 一次性跑完即止，不做常态化爬取；每次请求之间 sleep ≥ 300ms。
 *   · 带可识别 User-Agent（Wikimedia 要求），不含任何个人信息。
 *   · 幂等：输出按卦序排序、不写生成时间戳，同一份源跑两次产物逐字节相同。
 *   · 解析遇到任何预期外的标记就抛错终止，宁可失败也不静默产出脏数据。
 *
 * 用法（仓库根目录）：node scripts/fetch-gua.mjs
 *                    node scripts/fetch-gua.mjs --cache   # 复用临时目录里已抓的 wikitext，不发网络请求
 *
 * 依赖：零。Node 22 内置 fetch / fs / path 即可（CLAUDE.md §1 不随手加依赖）。
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "frontend", "src", "data", "gua.ts");
/** 抓下来的 wikitext 落在系统临时目录，**不进仓库**（仓库里只留脚本与产物）。 */
const CACHE_DIR = join(tmpdir(), "star-mansions-fetch-gua", "wikisource-zhouyi");

const API = "https://zh.wikisource.org/w/api.php";
const PAGE_PREFIX = "周易/";
const UA =
  "star-mansions-fetch-gua/1.0 (https://github.com/Ruixiaoke/star-mansions; one-off dataset build; contact via GitHub issues)";
const SLEEP_MS = 350; // ≥ 300ms，限速

const USE_CACHE = process.argv.includes("--cache");

/**
 * 八经卦（源文用字，繁体）→ 自然象（**简体**）。出处：《说卦》十一章 / PRD liuyao §5.3 定表。
 *
 * ⚠️ 键是繁体（解析源页面得到的 `兌` `離`），值是简体（`泽` `火`）—— 这不是笔误：
 *    键要对上源文，值要进派生的显示名 `name`。简体自然象与 `data/trigrams.ts` 的
 *    `nature` 栏逐字一致（天/泽/火/雷/风/水/山/地），保证同屏不打架。
 */
const TRIGRAM_NATURE = {
  乾: "天",
  兌: "泽",
  離: "火",
  震: "雷",
  巽: "风",
  坎: "水",
  艮: "山",
  坤: "地",
};

/**
 * 源文卦名（繁体）→ **简体卦名**，只用于派生的显示名 `name`。
 * 原文层（`guaName` / `judgment` / `lines` / `yongLine`）一个字都不动。
 *
 * 刻意写成 64 条明表而不是逐字算法转换：每一条都是可被人逐行 review 的事实，
 * 且源站若改了卦名，下面的完整性断言会当场炸，而不是悄悄转出个怪名字。
 *
 * ⚠️ 唯一一条判断题：**遯 → 遁**。二者为同一卦，`遯` 在《第一批异体字整理表》被作为
 *    `遁` 的异体字处理，简体本《周易》通行作「天山遁」。源文用字仍完整保留在 `guaName`。
 */
const SIMPLIFIED_GUA_NAME = {
  乾: "乾", 坤: "坤", 屯: "屯", 蒙: "蒙", 需: "需", 訟: "讼", 師: "师", 比: "比",
  小畜: "小畜", 履: "履", 泰: "泰", 否: "否", 同人: "同人", 大有: "大有", 謙: "谦", 豫: "豫",
  隨: "随", 蠱: "蛊", 臨: "临", 觀: "观", 噬嗑: "噬嗑", 賁: "贲", 剝: "剥", 復: "复",
  无妄: "无妄", 大畜: "大畜", 頤: "颐", 大過: "大过", 坎: "坎", 離: "离", 咸: "咸", 恆: "恒",
  遯: "遁", 大壯: "大壮", 晉: "晋", 明夷: "明夷", 家人: "家人", 睽: "睽", 蹇: "蹇", 解: "解",
  損: "损", 益: "益", 夬: "夬", 姤: "姤", 萃: "萃", 升: "升", 困: "困", 井: "井",
  革: "革", 鼎: "鼎", 震: "震", 艮: "艮", 漸: "渐", 歸妹: "归妹", 豐: "丰", 旅: "旅",
  巽: "巽", 兌: "兑", 渙: "涣", 節: "节", 中孚: "中孚", 小過: "小过", 既濟: "既济", 未濟: "未济",
};
const TRIGRAMS = Object.keys(TRIGRAM_NATURE);

/**
 * 八经卦 → 先天序 1–8。出处：《卜筮全书·八卦次序》（PRD liuyao §5.3，考据已机器核对 8/8）。
 * 恒等式：`先天序 = 1 + binary(初爻→上爻，阳记 0、阴记 1)`，初爻为最高位。
 *   乾 000→1  兌 001→2  離 010→3  震 011→4  巽 100→5  坎 101→6  艮 110→7  坤 111→8
 *
 * ⚠️ 这是**与引擎的对接键**：`frontend/src/data/trigrams.ts` 的经卦名写简体（兑/离/泽/风），
 *    本表照源文写繁体（兌/離/澤/風），两边**字符串对不上**。故 64 卦查表一律走这组数字序号，
 *    不走卦名字符串 —— 见 gua.ts 的 `hexagramByKey`。
 */
const TRIGRAM_ORDER = { 乾: 1, 兌: 2, 離: 3, 震: 4, 巽: 5, 坎: 6, 艮: 7, 坤: 8 };

// ── 卦名训解（引用层）· 考据 SoT = docs/external/liuyao-tradition.md §5-a ──────
//
// 编写层每段有一句「卦名义」，原先按通行字义写、没有出处兜底（铁律 §0-2 要求标来源）。
// 现改为引用《易传》原文：**《序卦传》优先、《杂卦传》兜底**，合起来覆盖 64/64。
// ⚠️ 这仍是**引用层**（典籍原文，逐字照登），不是编写层，页面须写成「《序卦傳》說：…」的转述。

const GLOSS_SOURCES = {
  xugua: { title: "易傳/序卦", work: "序卦傳", url: "https://zh.wikisource.org/wiki/易傳/序卦" },
  zagua: { title: "易傳/雜卦", work: "雜卦傳", url: "https://zh.wikisource.org/wiki/易傳/雜卦" },
  // 「履者，禮也」不在 `易傳/序卦` 页上（该页脱此句），据十三经注疏本补，见卡片 §5-a.2
  zhengyi10: { title: "周易正義/10", work: "周易正義", url: "https://zh.wikisource.org/wiki/周易正義/10" },
};

/**
 * 明确**不训字**的三卦（编排者裁决）。三源给的都带判词或倾覆义，
 * 与铁律 §0-4「不制造焦虑」冲突，宁可留空也不去别处凑。留空 = 两个字段都不设。
 */
const NO_GLOSS_ORDERS = {
  25: "无妄：《序卦》无训解；《雜卦》作「无妄災也」带『災』",
  28: "大過：《序卦》无训解；《雜卦》作「大過顛也」，『顛』= 倾覆",
  36: "明夷：《序卦》作「夷者傷也」带『傷』；《雜卦》作「明夷誅也」更重",
};

/**
 * 《杂卦传》训解（补《序卦》没有的 32 卦，扣掉不训字的 无妄 / 大過 = 30 条）。
 *
 * 写成明表而非自动切分：《杂卦》体例不规整 —— 「乾剛坤柔」四字里packed两卦、
 * 「臨、觀之義」「損、益」「否、泰」是两卦共用一句、「親寡旅也」是全篇唯一的**先训后名**
 * （虞翻已明其故，见卡片 §5-a.4-1），按卦名开头切分必漏。
 * 每一条都会被断言为抓取原文的**逐字子串**，写错当场炸。
 *
 * ⚠️ 该页分〈一篇〉与〈校詁版〉两段，用字多处出入（隨无故/無事、蒙雜/蒙稚、親寡旅/旅寡親）。
 *    **一律取〈一篇〉**（与《周易正義/11》经文逐字相合），下面的解析只吃〈一篇〉那一段。
 */
const ZAGUA_GLOSS = {
  乾: "乾剛",
  坤: "坤柔",
  訟: "訟不親也",
  小畜: "小畜寡也",
  否: "否、泰，反其類也",
  同人: "同人親也",
  大有: "大有眾也",
  謙: "謙輕",
  豫: "豫怠也",
  隨: "隨无故也",
  觀: "臨、觀之義，或與或求",
  復: "復反也",
  大畜: "大畜時也",
  咸: "咸速也",
  大壯: "大壯則止",
  家人: "家人內也",
  損: "損、益，盛衰之始也",
  益: "損、益，盛衰之始也",
  升: "升不來也",
  困: "困相遇也",
  井: "井通",
  革: "革去故也",
  鼎: "鼎取新也",
  歸妹: "歸妹女之終也",
  旅: "親寡旅也", // ⚠️ 先训后名，全篇唯一特例
  節: "節止也",
  中孚: "中孚信也", // ⚠️ 用《雜卦》经文；「孚，信也」是韩康伯注，不引
  小過: "小過過也",
  既濟: "既濟定也",
  未濟: "未濟男之窮也",
};

/** 《周易正義/10》补的那一条（`易傳/序卦` 页脱句，卡片 §5-a.2）。 */
const ZHENGYI_GLOSS = { 履: "履者，禮也" };

/**
 * 训解红线黑名单（PRD liuyao §9.2 / 铁律 §0-4）。繁简两形都列 ——
 * 原文是繁体，而纪律文档写的是简体，只扫一种会漏。
 */
const GLOSS_BLACKLIST = ["凶", "厲", "厉", "咎", "吝", "災", "灾", "傷", "伤", "誅", "诛", "顛", "颠"];

/** 六爻爻题（初→上）。「否」卦用逗号、其余 63 卦用冒号，故此处只认爻题本身，标点单独吃。 */
const YAO_TITLES = [
  ["初九", "初六"],
  ["九二", "六二"],
  ["九三", "六三"],
  ["九四", "六四"],
  ["九五", "六五"],
  ["上九", "上六"],
];
/** 乾「用九」、坤「用六」—— 第 7 条，不属六爻，单独收在 yongLine。 */
const YONG_TITLES = ["用九", "用六"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 中文数字 → 阿拉伯数字（只需覆盖 1–64）──────────────────────────────────
const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnToNumber(s) {
  if (/^\d+$/.test(s)) return Number(s);
  const i = s.indexOf("十");
  if (i < 0) {
    const n = CN_DIGITS[s];
    if (!n) throw new Error(`无法解析中文数字：${s}`);
    return n;
  }
  const tens = i === 0 ? 1 : CN_DIGITS[s.slice(0, i)];
  const ones = i === s.length - 1 ? 0 : CN_DIGITS[s.slice(i + 1)];
  if (tens === undefined || ones === undefined) throw new Error(`无法解析中文数字：${s}`);
  return tens * 10 + ones;
}

// ── 网络 ────────────────────────────────────────────────────────────────────
async function apiGet(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  const json = await res.json();
  if (json.error) throw new Error(`API error: ${JSON.stringify(json.error)}`);
  return json;
}

/** 列出 `周易/` 下的全部子页（含十翼等非卦页，后续按内容筛掉）。 */
async function listSubpages() {
  const cache = join(CACHE_DIR, "__subpages.json");
  if (USE_CACHE && existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
  const json = await apiGet({
    action: "query",
    list: "allpages",
    apprefix: PAGE_PREFIX,
    apfilterredir: "nonredirects",
    aplimit: "500",
  });
  const titles = json.query.allpages.map((p) => p.title).sort();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cache, JSON.stringify(titles, null, 2));
  return titles;
}

async function fetchWikitext(title) {
  const cache = join(CACHE_DIR, `${title.replace(/\//g, "__")}.wikitext`);
  if (USE_CACHE && existsSync(cache)) return readFileSync(cache, "utf8");
  // 只要真的发请求就限速 —— `--cache` 模式下缓存缺页也会走到这里，别漏了 sleep。
  await sleep(SLEEP_MS);
  const json = await apiGet({ action: "parse", page: title, prop: "wikitext" });
  const wikitext = json.parse.wikitext;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cache, wikitext);
  return wikitext;
}

// ── 解析（坑都在这，逐个见 docs/external/liuyao-coin-method.md §4.2）────────

/**
 * 剥掉维基文库的 `-{ }-` 语言转换标记。实测出现三种：
 *   · `-{无}-`        —— 保留内层原字（64 卦页大量使用）
 *   · `-{T|周易/乾}-` —— 标题转换指令，不出现在正文，整段丢弃
 *   · `-{A|云}-`      —— 「加转换规则并照常输出」，保留内层原字（《周易正義/10》用）
 * 其余形式（`-{H|…}-` 隐藏规则、`-{zh-hans:…;zh-hant:…}-` 双向等）本次源里没有 ——
 * **遇到就抛错，不猜**：猜错会静默改掉引用层的字。
 */
function stripLangConversion(s, ctx) {
  return s.replace(/-\{([\s\S]*?)\}-/g, (whole, inner) => {
    if (/^T\|/.test(inner)) return "";
    if (/^A\|/.test(inner)) return inner.slice(2);
    if (inner.includes("|") || inner.includes(":") || inner.includes(";")) {
      throw new Error(`[${ctx}] 预期外的语言转换标记：${whole}`);
    }
    return inner;
  });
}

/** 把一行 wikitext 化成纯文本；剩余任何标记残留都视为解析失败。 */
function toPlainText(line, ctx) {
  let s = stripLangConversion(line, ctx);
  s = s.replace(/\[\[[^\][|]*\|([^\][]*)\]\]/g, "$1"); // [[目标|显示]] → 显示
  s = s.replace(/\[\[([^\][]*)\]\]/g, "$1"); // [[目标]] → 目标
  s = s.replace(/'''''|'''|''/g, ""); // 粗体 / 斜体
  s = s.replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");
  s = s.replace(/[　\s]+$/g, "").replace(/^[　\s]+/g, "");
  if (/[{}[\]<>|]/.test(s)) throw new Error(`[${ctx}] 清洗后仍有残留标记：${JSON.stringify(s)}`);
  return s;
}

/**
 * 解析一页 → 一卦。不是卦页（说卦 / 序卦 / 彖 …）返回 null。
 */
function parseGuaPage(title, rawWikitext) {
  const ctx = title;

  // 1) 先整体剥掉 <span …>（⚠️「坤」页的 `*<span\nstyle=…>` 跨了物理行，
  //    不先剥标签再按行切，那一页的「易經：」标记就找不到）。
  let wt = rawWikitext.replace(/<!--[\s\S]*?-->/g, "");
  wt = wt.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  wt = wt.replace(/<br\s*\/?>/gi, "");

  // 2) 卦序：`[[周易]]　第一卦` / `周易　第五十卦`（⚠️ 中文数字，不是阿拉伯数字）
  const orderMatch = wt.match(/第\s*([一二三四五六七八九十]+|\d+)\s*卦/);
  if (!orderMatch) return null; // 十翼等非卦页
  const order = cnToNumber(orderMatch[1]);

  const lines = wt.split("\n");

  // 3) 卦名：`;乾` / `;-{无}-妄`
  const nameLine = lines.find((l) => /^;\s*\S/.test(l));
  if (!nameLine) throw new Error(`[${ctx}] 找不到卦名行（;卦名）`);
  const guaName = toPlainText(nameLine.replace(/^;\s*/, ""), `${ctx} 卦名`);
  if (!guaName) throw new Error(`[${ctx}] 卦名为空`);

  // 4) 卦画 + 上下卦：`[[File:Iching-hexagram-01.svg|alt=䷀]] 乾下乾上`
  //    ⚠️ 三种写法：File: / Image: / 「鼎」卦把 alt 拼成了 alr，故正则写 al[tr]
  const imgLineIdx = lines.findIndex((l) => /al[tr]\s*=/.test(l));
  if (imgLineIdx < 0) throw new Error(`[${ctx}] 找不到卦画行`);
  const imgLine = lines[imgLineIdx];
  const symbolMatch = imgLine.match(/al[tr]\s*=\s*([䷀-䷿])/);
  if (!symbolMatch) throw new Error(`[${ctx}] 卦画 al[tr] 属性里没有 U+4DC0–4DFF 卦符：${imgLine}`);
  const symbol = symbolMatch[1];

  // 上下卦：先把整个 [[…]] 图片标记去掉，再匹配「X下Y上」
  const trigramText = toPlainText(
    imgLine.replace(/\[\[[\s\S]*?\]\]/g, ""),
    `${ctx} 上下卦`,
  );
  const trigramMatch = trigramText.match(/^(\S+?)下(\S+?)上$/);
  if (!trigramMatch) throw new Error(`[${ctx}] 上下卦解析失败：${JSON.stringify(trigramText)}`);
  const [, lower, upper] = trigramMatch;
  for (const t of [lower, upper]) {
    if (!TRIGRAMS.includes(t)) throw new Error(`[${ctx}] 未知经卦名：${t}`);
  }

  // 5) 「易經：」区块 = 卦辞（**，可续 ***）+ 爻辞（*#）
  const startIdx = lines.findIndex((l) => /^\*\s*'*\s*易經/.test(l));
  if (startIdx < 0) throw new Error(`[${ctx}] 找不到「易經：」区块`);

  const judgmentParts = [];
  const yaoEntries = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\*\s*'*\s*(彖曰|象曰|文言曰|繫辭|序卦|雜卦)/.test(raw)) break; // 传注区块，本期不取（PRD §17）
    if (/^\*{2,}$/.test(raw.trim())) continue;
    if (raw.trim() === "") continue;
    if (/^\*#/.test(raw)) {
      yaoEntries.push(toPlainText(raw.replace(/^\*#\s*/, ""), `${ctx} 爻辞`));
    } else if (/^\*{2,}/.test(raw)) {
      // ⚠️「坤」卦的卦辞被拆成 ** + 两条 ***，要接起来才完整
      if (yaoEntries.length > 0) break;
      judgmentParts.push(toPlainText(raw.replace(/^\*{2,}\s*/, ""), `${ctx} 卦辞`));
    } else {
      break; // 离开「易經：」区块
    }
  }

  const judgment = judgmentParts.join("");
  if (!judgment) throw new Error(`[${ctx}] 卦辞为空`);

  // 6) 拆出六爻 + 用九 / 用六
  const yaoLines = [];
  let yongLine;
  for (const entry of yaoEntries) {
    if (YONG_TITLES.some((t) => entry.startsWith(t))) {
      if (yongLine) throw new Error(`[${ctx}] 出现多条用九/用六`);
      yongLine = entry;
      continue;
    }
    yaoLines.push(entry);
  }
  if (yaoLines.length !== 6) {
    throw new Error(`[${ctx}] 爻辞条数 ${yaoLines.length} ≠ 6：${JSON.stringify(yaoLines)}`);
  }
  // 爻题必须自下而上、逐位对上（顺序错了会静默出错，故在此设卡）
  yaoLines.forEach((text, idx) => {
    if (!YAO_TITLES[idx].some((t) => text.startsWith(t))) {
      throw new Error(`[${ctx}] 第 ${idx + 1} 爻的爻题不是 ${YAO_TITLES[idx].join("/")}：${text}`);
    }
  });

  // 7) 通行称谓（PRD liuyao §10 `Hexagram.name`）。命名惯例见 §5.3：
  //    八纯卦作「X为Y」，其余作「上卦自然象 + 下卦自然象 + 卦名」。
  //    这是**派生的显示名，不是原文** —— 全站是简体产品，故此栏一律简体；
  //    原文用字完整保留在 guaName / judgment / lines（团队 2026-08-30 拍板）。
  const simpleName = SIMPLIFIED_GUA_NAME[guaName];
  if (!simpleName) throw new Error(`[${ctx}] 简体卦名表里没有「${guaName}」—— 源站卦名可能变了，请核对后补表`);
  const name =
    lower === upper
      ? `${simpleName}为${TRIGRAM_NATURE[lower]}`
      : `${TRIGRAM_NATURE[upper]}${TRIGRAM_NATURE[lower]}${simpleName}`;

  return {
    order,
    name,
    guaName,
    symbol,
    lower,
    lowerOrder: TRIGRAM_ORDER[lower],
    upper,
    upperOrder: TRIGRAM_ORDER[upper],
    judgment,
    lines: yaoLines,
    yongLine,
    sourceUrl: `https://zh.wikisource.org/wiki/${title}`,
  };
}

// ── 卦名训解的解析 ──────────────────────────────────────────────────────────

/** 取 `==标题==` 到下一个同级标题之间的正文。找不到该标题就抛错。 */
function sectionOf(wikitext, heading, ctx) {
  const start = wikitext.indexOf(`==${heading}==`);
  if (start < 0) throw new Error(`[${ctx}] 找不到「${heading}」小节`);
  const rest = wikitext.slice(start + heading.length + 4);
  const next = rest.search(/\n==[^=]/);
  return next < 0 ? rest : rest.slice(0, next);
}

/**
 * 典籍页专用的行清洗。与 `toPlainText` 的区别：**容忍 `[疏]` `[注]` 这类方括号标记** ——
 * 那是注疏本的正文体例（《周易正義》用它分经、注、疏），不是没清干净的 wiki 标记。
 * 但仍卡住真正的残留标记（`[[ ]] {{ }} | < >`），不放松那道线。
 */
function toClassicText(line, ctx) {
  let s = stripLangConversion(line, ctx);
  s = s.replace(/\[\[[^\][|]*\|([^\][]*)\]\]/g, "$1");
  s = s.replace(/\[\[([^\][]*)\]\]/g, "$1");
  s = s.replace(/'''''|'''|''/g, "");
  s = s.replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");
  s = s.trim();
  if (/\[\[|\]\]|\{\{|\}\}|[|<>]/.test(s)) {
    throw new Error(`[${ctx}] 清洗后仍有残留标记：${JSON.stringify(s.slice(0, 80))}`);
  }
  return s;
}

/** 典籍页的通用清洗：去模板 / 标题 / 行首缩进符，链接取显示文本，剥语言转换标记。 */
function cleanClassicText(wikitext, ctx) {
  let t = wikitext.replace(/<!--[\s\S]*?-->/g, "");
  // ⚠️ 语言转换标记要**先**剥：`-{A|卷}-` 自带花括号，不先剥的话模板正则会在它那里断掉
  t = stripLangConversion(t, ctx);
  t = t.replace(/\{\{[^{}]*\}\}/g, ""); // {{header|…}}、《周易正義》的 {{*|韩注}} 等整段丢
  t = t.replace(/^==+[^=\n]*==+$/gm, ""); // 小节标题
  t = t.replace(/^[:*#]+\s*/gm, ""); // 行首缩进 / 列表符
  return t
    .split("\n")
    .map((l) => (l.trim() ? toClassicText(l, ctx) : ""))
    .filter(Boolean);
}

/**
 * 《序卦传》→ Map<卦名, 训解原文>。
 * 体例：`…故受之以〈某〉；某者，X 也。` —— 训解在全角分号之后。
 * ⚠️ 只有 31 卦带训解（其余只讲卦序承接）；末句「未濟…；終焉」不是训解，靠「者…也」体例挡掉。
 */
function parseXuguaGlosses(wikitext, ctx) {
  const map = new Map();
  for (const raw of wikitext.split("\n")) {
    if (!/^:/.test(raw)) continue;
    // 该行引入的卦 = 行内最后一个 [[周易/X…]] 链接的目标
    const targets = [...raw.matchAll(/\[\[周易\/([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);
    if (targets.length === 0) continue;
    const guaName = targets[targets.length - 1];

    const plain = toClassicText(raw.replace(/^:+\s*/, ""), `${ctx} ${guaName}`);
    const at = plain.indexOf("；");
    if (at < 0) continue;
    const gloss = plain.slice(at + 1).replace(/。\s*$/, "").trim();
    // 体例校验：必须是「某者…也」。「終焉」这类收尾句在此被挡掉。
    if (!gloss.includes("者") || !gloss.endsWith("也")) continue;
    const head = gloss.slice(0, gloss.indexOf("者"));
    // 头字须出自卦名本身（「嗑者合也」头字是嗑不是噬嗑，「夷者傷也」头字是夷不是明夷）
    if (!guaName.includes(head)) {
      throw new Error(`[${ctx}] ${guaName} 的训解头字「${head}」不出自卦名：${gloss}`);
    }
    if (map.has(guaName)) throw new Error(`[${ctx}] ${guaName} 出现两条训解`);
    map.set(guaName, gloss);
  }
  return map;
}

/**
 * 给每卦挂上 nameGloss / nameGlossWork / nameGlossSource。
 * 取法：**序卦优先 → 杂卦兜底**；`履` 另据《周易正義/10》；三卦明确不训字。
 * 每一条都断言是对应源文的**逐字子串**，对不上就炸（防手抄错、防源站改字）。
 */
function attachGlosses(guas, texts) {
  const xugua = parseXuguaGlosses(texts.xuguaRaw, "易傳/序卦");
  const zaguaText = texts.zaguaYipian.join("");
  const zhengyiText = texts.zhengyi10.join("");

  const assertSubstring = (gua, gloss, haystack, where) => {
    if (!haystack.includes(gloss)) {
      throw new Error(`[卦名训解] 第 ${gua.order} 卦 ${gua.guaName}「${gloss}」不是 ${where} 的逐字子串`);
    }
  };

  for (const gua of guas) {
    if (NO_GLOSS_ORDERS[gua.order]) continue; // 不训字的三卦：两个字段都不设

    if (ZHENGYI_GLOSS[gua.guaName]) {
      const gloss = ZHENGYI_GLOSS[gua.guaName];
      assertSubstring(gua, gloss, zhengyiText, GLOSS_SOURCES.zhengyi10.title);
      gua.nameGloss = gloss;
      gua.nameGlossWork = GLOSS_SOURCES.zhengyi10.work;
      gua.nameGlossSource = GLOSS_SOURCES.zhengyi10.url;
      continue;
    }
    if (xugua.has(gua.guaName)) {
      gua.nameGloss = xugua.get(gua.guaName);
      gua.nameGlossWork = GLOSS_SOURCES.xugua.work;
      gua.nameGlossSource = GLOSS_SOURCES.xugua.url;
      continue;
    }
    if (ZAGUA_GLOSS[gua.guaName]) {
      const gloss = ZAGUA_GLOSS[gua.guaName];
      assertSubstring(gua, gloss, zaguaText, `${GLOSS_SOURCES.zagua.title}〈一篇〉`);
      gua.nameGloss = gloss;
      gua.nameGlossWork = GLOSS_SOURCES.zagua.work;
      gua.nameGlossSource = GLOSS_SOURCES.zagua.url;
      continue;
    }
    throw new Error(`[卦名训解] 第 ${gua.order} 卦 ${gua.guaName} 既无序卦训解、也不在杂卦表里，且未列入不训字名单`);
  }
}

// ── 自检（PRD liuyao §6.3 五条门禁；脚本层先跑一遍，测试层再固化一遍）──────
function verify(guas) {
  const problems = [];

  const orders = guas.map((g) => g.order).sort((a, b) => a - b);
  const expected = Array.from({ length: 64 }, (_, i) => i + 1);
  if (orders.join(",") !== expected.join(",")) {
    problems.push(`① 卦序集合 ≠ 1..64，实得 ${orders.length} 条：${orders.join(",")}`);
  }

  let symbolOk = 0;
  for (const g of guas) {
    if (g.symbol.codePointAt(0) === 0x4dc0 + g.order - 1) symbolOk++;
    else problems.push(`② 第 ${g.order} 卦 ${g.name} 卦画码位不符：${g.symbol}`);
  }

  const combos = new Set(guas.map((g) => `${g.lower}下${g.upper}上`));
  if (combos.size !== 64) problems.push(`③ (下卦,上卦) 组合只有 ${combos.size} 种，存在重复`);
  for (const l of TRIGRAMS) {
    for (const u of TRIGRAMS) {
      if (!combos.has(`${l}下${u}上`)) problems.push(`③ 8×8 缺格：${l}下${u}上`);
    }
  }

  let textOk = 0;
  for (const g of guas) {
    if (g.judgment && g.lines.length === 6 && g.lines.every(Boolean)) textOk++;
    else problems.push(`④ 第 ${g.order} 卦 ${g.name} 卦辞/爻辞不齐`);
  }

  // ⑤ 先天序键 (lowerOrder, upperOrder) 同样要互异且覆盖 8×8 —— 这是引擎的查表键，
  //    键有洞 = 某个卦象查不到卦，比数据缺条更难发现。
  const keyed = new Set(guas.map((g) => `${g.lowerOrder},${g.upperOrder}`));
  for (let l = 1; l <= 8; l++) {
    for (let u = 1; u <= 8; u++) {
      if (!keyed.has(`${l},${u}`)) problems.push(`⑤ 先天序键 8×8 缺格：下${l} 上${u}`);
    }
  }

  // ⑥ 结构自洽（独立于抓取的一道交叉校验）：通行本卦序两两成对，
  //    第 2k 卦 = 第 2k−1 卦的**综卦**（六爻上下颠倒）；颠倒后与自身相同者，则为**错卦**（六爻全变）。
  //    64 卦无例外。上下卦若被写反（内卦/外卦搞混），这一条会立刻塌掉。
  const bitsOf = (g) => {
    const tri = (n) => [(n - 1) >> 2 & 1, (n - 1) >> 1 & 1, (n - 1) & 1].map((b) => (b ? 0 : 1));
    return [...tri(g.lowerOrder), ...tri(g.upperOrder)]; // 初→上，阳 1 阴 0
  };
  const byOrder = new Map(guas.map((g) => [g.order, g]));
  let pairOk = 0;
  for (let k = 1; k <= 32; k++) {
    const a = byOrder.get(2 * k - 1);
    const b = byOrder.get(2 * k);
    if (!a || !b) continue;
    const ab = bitsOf(a);
    const bb = bitsOf(b);
    const zong = [...ab].reverse();
    const cuo = ab.map((x) => 1 - x);
    const expect = zong.join() === ab.join() ? cuo : zong;
    if (expect.join() === bb.join()) pairOk++;
    else problems.push(`⑥ 第 ${a.order}${a.guaName} / ${b.order}${b.guaName} 不成综卦或错卦对 —— 疑上下卦写反`);
  }

  // ⑦ 派生显示名 `name`：必须全简体、互异，且简体卦名表恰好覆盖抓到的 64 个源文卦名。
  //    多一条 / 少一条都说明源站卦名变了或表写漏了 —— 宁可失败，不许出个半繁半简的名字。
  const tableKeys = new Set(Object.keys(SIMPLIFIED_GUA_NAME));
  const scraped = new Set(guas.map((g) => g.guaName));
  for (const k of tableKeys) if (!scraped.has(k)) problems.push(`⑦ 简体卦名表有多余条目「${k}」（源文里没有这个卦名）`);
  for (const k of scraped) if (!tableKeys.has(k)) problems.push(`⑦ 简体卦名表缺「${k}」`);
  if (new Set(guas.map((g) => g.name)).size !== guas.length) problems.push("⑦ 派生显示名 name 有重复");
  // 繁体残留自查：这些字若出现在 name 里，说明某条没被简化
  const TRAD_LEFTOVER = /[澤風為兌離濟過壯歸豐節渙賁頤蠱謙訟師隨臨觀剝復恆漸損晉遯]/;
  // 双向卡：派生层不许漏繁体，引用层不许被"顺手统一"成简体。
  // 内容工位反馈同一对象里繁简混用「看起来像漏改了一半」—— 那是分层设计，
  // 注释拦不住手快的人，这两条断言能（简体的 兑/离 一旦出现在 lower/upper 就说明有人动了引用层）。
  const SIMP_IN_CITATION = /[兑离泽风]/;
  for (const g of guas) {
    if (TRAD_LEFTOVER.test(g.name)) problems.push(`⑦ 第 ${g.order} 卦 name「${g.name}」仍含繁体字（派生层应全简体）`);
    for (const [k, v] of [["lower", g.lower], ["upper", g.upper]]) {
      if (SIMP_IN_CITATION.test(v)) {
        problems.push(`⑦ 第 ${g.order} 卦 ${k}「${v}」被简化了 —— 引用层须保持源文繁体`);
      }
    }
  }
  const nameCharCount = new Set([...guas.map((g) => g.name).join("")]).size;

  // ⑧ 字段白名单：本文件只许有引用层与派生标识，**不许混进任何内容字段**。
  //    有人日后往管线里加一栏白话，这里会当场炸（铁律 §0-2 的工程化兜底）。
  //    白名单的语义边界是「**本项目写的字**不许进」，不是「字段数不许变」——
  //    nameGloss 三栏是《易传》原文与其出处，属引用层，放行。
  const ALLOWED = new Set([
    "order", "name", "guaName", "symbol",
    "lower", "lowerOrder", "upper", "upperOrder",
    "judgment", "lines", "yongLine", "sourceUrl",
    "nameGloss", "nameGlossWork", "nameGlossSource",
  ]);
  for (const g of guas) {
    for (const k of Object.keys(g)) {
      if (!ALLOWED.has(k)) problems.push(`⑧ 第 ${g.order} 卦混进了白名单外的字段「${k}」`);
    }
  }

  // ⑨ 卦名训解应为 61 条（64 − 3 卦不训字），三栏同进同退，不训字的三卦一栏都不许有
  const glossed = guas.filter((g) => g.nameGloss);
  if (glossed.length !== 61) problems.push(`⑨ nameGloss 应为 61 条，实得 ${glossed.length} 条`);
  for (const g of guas) {
    const has = ["nameGloss", "nameGlossWork", "nameGlossSource"].filter((k) => g[k] !== undefined);
    if (has.length !== 0 && has.length !== 3) {
      problems.push(`⑨ 第 ${g.order} 卦 ${g.guaName} 的训解三栏不齐：${has.join("/")}`);
    }
    if (NO_GLOSS_ORDERS[g.order] && has.length !== 0) {
      problems.push(`⑨ 第 ${g.order} 卦列在不训字名单里，却带了训解`);
    }
  }

  // ⑩ 训解红线扫描：核心判词字零命中（繁简两形都扫）。用 JS 数「出现次数」，
  //    不依赖 shell 的 grep —— `grep -c` 数的是行不是次，中文语料一行多次命中很常见。
  for (const g of glossed) {
    for (const bad of GLOSS_BLACKLIST) {
      if (g.nameGloss.includes(bad)) {
        problems.push(`⑩ 第 ${g.order} 卦训解命中红线字「${bad}」：${g.nameGloss}`);
      }
    }
  }
  const glossByWork = {};
  for (const g of glossed) glossByWork[g.nameGlossWork] = (glossByWork[g.nameGlossWork] ?? 0) + 1;

  return {
    problems, symbolOk, textOk, comboCount: combos.size,
    keyCount: keyed.size, pairOk, nameCharCount, count: guas.length,
    glossCount: glossed.length, glossByWork,
  };
}

// ── 产出 TS ─────────────────────────────────────────────────────────────────
const q = (s) => JSON.stringify(s);

function renderTs(guas) {
  const entries = guas
    .map((g) => {
      const lines = g.lines.map((l) => `      ${q(l)},`).join("\n");
      const yong = g.yongLine ? `\n    yongLine: ${q(g.yongLine)},` : "";
      return [
        `  {`,
        `    order: ${g.order},`,
        `    name: ${q(g.name)},`,
        `    guaName: ${q(g.guaName)},`,
        `    symbol: ${q(g.symbol)},`,
        `    lower: ${q(g.lower)},`,
        `    lowerOrder: ${g.lowerOrder},`,
        `    upper: ${q(g.upper)},`,
        `    upperOrder: ${g.upperOrder},`,
        `    judgment: ${q(g.judgment)},`,
        `    lines: [`,
        lines,
        `    ],${yong}`,
        `    sourceUrl: ${q(g.sourceUrl)},`,
        ...(g.nameGloss
          ? [
              `    nameGloss: ${q(g.nameGloss)},`,
              `    nameGlossWork: ${q(g.nameGlossWork)},`,
              `    nameGlossSource: ${q(g.nameGlossSource)},`,
            ]
          : []),
        `  },`,
      ].join("\n");
    })
    .join("\n");

  return `/**
 * 六十四卦定表（原文层）· 卦辞 64 条 + 爻辞 384 条。
 *
 * ⚠️ 本文件由 \`scripts/fetch-gua.mjs\` 生成，**请勿手改** —— 要改先改脚本再重跑，
 *    否则「数据哪来的」这条审计链就断了（铁律 §0-2）。
 *
 * ── 文本来源与署名（铁律 §0-5 素材合规）──────────────────────────────────
 *   卦辞 / 爻辞据维基文库《周易》64 卦页：https://zh.wikisource.org/wiki/周易
 *   卦名训解（\`nameGloss\`）据《易傳》：
 *     · 序卦傳   https://zh.wikisource.org/wiki/易傳/序卦
 *     · 雜卦傳   https://zh.wikisource.org/wiki/易傳/雜卦   （取〈一篇〉，非〈校詁版〉）
 *     · 周易正義 https://zh.wikisource.org/wiki/周易正義/10 （仅「履」一条，见下）
 *   底本为先秦文献 = 公有领域；维基文库录入者的贡献按 Wikimedia 使用条款
 *   以 **CC BY-SA 4.0 + GFDL** 提供，转载须署名并以相同方式共享。
 *   〔https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use〕
 *   每卦的 \`sourceUrl\` 指向它自己那一页，可逐条回源核对（PRD liuyao §16-9）。
 *
 * ── 用字纪律（两层，别混）──────────────────────────────────────────────
 *   **原文层**（\`judgment\` / \`lines\` / \`yongLine\` / \`guaName\`）：
 *     逐字照登源文，**不做简繁转换、不归一化异体字** —— 无/無、恒/恆、于/於、羣/群
 *     一律保留源文用字（源文自身就不统一，照登即可，那是它的原貌）。
 *   **派生层**（\`name\`，显示用）：**简体**，与全站一致；自然象用字与
 *     \`data/trigrams.ts\` 的 \`nature\` 栏逐字相同。
 *   两层刻意分开：不归一化守在原文层，UI 用简体走派生层，互不相犯。
 *
 * ── 本文件的边界：**只有引用层，没有一个字是本项目写的** ─────────────────
 *   \`Hexagram\` 上**刻意不设** \`vernacular\` / \`placeholder\` 之类的内容字段 ——
 *   本文件由脚本生成，铁律 §0-2 不许脚本 / AI 现编释义，留个空位只会诱人往里填。
 *   **编写层（白话疏解）在 \`data/gua-readings.ts\`**，双层分离见 PRD liuyao §8；
 *   页面要白话请读那个文件。（PRD §10 早期把 \`vernacular\` 画在 \`Hexagram\` 上，
 *   是两文件拆分之前的写法，已由编排者同步更正。）
 *   《彖传》《象传》《文言》不在本期范围（PRD liuyao §17）；《序卦》《雜卦》只取
 *   **卦名训解那一句**，不取全篇（那两篇的其余部分讲卦序承接，不进产品）。
 */

/**
 * 八经卦先天序 1–8：乾1 兌2 離3 震4 巽5 坎6 艮7 坤8
 * （《卜筮全书·八卦次序》，PRD liuyao §5.3；恒等式 \`序 = 1 + binary(初→上, 阳0阴1)\`）。
 *
 * 与 \`data/trigrams.ts\` 的 \`TrigramOrder\` **结构等价但刻意不 import** ——
 * 定表之间不互相依赖；结构相同，两者的值可直接互传，引擎侧无需转换。
 */
export type TrigramOrderKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 一个别卦（64 卦之一）。对齐 \`docs/prd/liuyao-prd.md\` §10 的 \`Hexagram\`，
 * 但 \`lower\` / \`upper\` 本轮存**经卦名字符串**而非 \`Trigram\` 对象：
 * 定表只存键、由 \`lib/\` 层按名查 \`data/trigrams.ts\` 联结，避免两份数据文件互相依赖。
 */
export interface Hexagram {
  /** 通行本卦序 1–64。 */
  order: number;
  /**
   * 通行称谓的**简体显示名**，如「乾为天」「天风姤」「水火既济」。
   *
   * **派生字段，不是原文** —— 按 PRD liuyao §5.3 命名惯例算出：
   * 八纯卦作「X为Y」，其余作「上卦自然象 + 下卦自然象 + 卦名」。
   * 页面标题用它；要引用原文卦名请用 \`guaName\`。
   *
   * 🚩 **本对象里繁简混用是设计，不是漏改**（这条被误报过，别再「顺手统一」）：
   *    \`name\` 是**派生显示名** → 简体，与全站一致；
   *    \`guaName\` / \`lower\` / \`upper\` / \`judgment\` / \`lines\` / \`nameGloss\` 是**引用层** → 保持源文繁体。
   *    分层的意义：「不归一化」的纪律守在引用层，UI 用简体走派生层，两不相犯。
   *    要改哪一边，先想清楚它属于哪一层。**查表一律用 \`lowerOrder\` / \`upperOrder\`，不受此影响。**
   */
  name: string;
  /**
   * 源页面上的卦名本身，如「乾」「否」「无妄」「既濟」「遯」。
   * **原文用字，未做任何转换**（属引用层）。⚠️ 第 32 卦源页标题作「恒」、正文作「恆」，
   * 此处取正文的「恆」，\`sourceUrl\` 则用标题 —— 两者都对得上源，不是 bug。
   */
  guaName: string;
  /** Unicode 卦画，恒等于 U+4DC0 + order − 1。 */
  symbol: string;
  /**
   * 下卦（内卦）经卦名：乾/兌/離/震/巽/坎/艮/坤。
   *
   * 🚩 **属引用层**：抄自源页「離下坎上」那行标注，故**保持源文繁体**。
   *    与 \`name\` 的简体用字不同**是分层设计，不是改简体时漏改了一半**（见 \`name\` 的说明）。
   * ⚠️ **不要拿它当查表键** —— 本文件写繁体（兌/離），\`data/trigrams.ts\` 写简体（兑/离），
   *    字符串对不上会**静默查空**（含兑或离的卦共 28 个，占 44%），且 typecheck 照样绿。
   *    查表一律用 \`lowerOrder\` / \`upperOrder\`。
   */
  lower: string;
  /** 下卦（内卦）先天序 1–8。**引擎的查表键之一**，见 \`hexagramByKey\`。 */
  lowerOrder: TrigramOrderKey;
  /** 上卦（外卦）经卦名。属引用层、保持源文繁体、不可作查表键 —— 同 \`lower\` 的说明。 */
  upper: string;
  /** 上卦（外卦）先天序 1–8。**引擎的查表键之一**。 */
  upperOrder: TrigramOrderKey;
  /** 卦辞（原文，逐字）。含卦名前缀 —— ⚠️「否」卦源文作「否之匪人…」，无冒号。 */
  judgment: string;
  /** 六爻爻辞（原文，逐字），初→上。含爻题 ——「否」卦爻题用逗号，其余 63 卦用冒号。 */
  lines: [string, string, string, string, string, string];
  /** 乾「用九」/ 坤「用六」，仅此二卦有。不属六爻，本期只存不用（PRD liuyao §17 不代为取断）。 */
  yongLine?: string;
  /** 维基文库该卦页 URL，逐条可回源核对（PRD liuyao §16-9）。 */
  sourceUrl: string;
  /**
   * 卦名训解原文，逐字照登，如「夬者決也」「乾剛」「親寡旅也」。
   *
   * **仍属引用层**（《易传》原文），不是本项目的主张 —— 页面须写成
   * 「《序卦傳》說：夬者決也」这种**转述**，不要写成「夬 = 決斷」的**断言**（铁律 §0-2）。
   *
   * 取法：**《序卦傳》优先、《雜卦傳》兜底**（考据 \`docs/external/liuyao-tradition.md\` §5-a）。
   * ⚠️ **三卦刻意没有这一栏**：无妄(25) / 大過(28) / 明夷(36) —— 三源给的训解都带
   * 判词或倾覆义（災 / 顛 / 傷 / 誅），与铁律 §0-4 冲突，宁可留空也不去别处凑。
   * 取值时必须判 \`undefined\`，不要假设 64 卦都有。
   */
  nameGloss?: string;
  /** 该条训解出自哪一篇：序卦傳 / 雜卦傳 / 周易正義。页面转述时要写出书名，故单独存一栏。 */
  nameGlossWork?: string;
  /**
   * 该条训解的出处 URL。
   * ⚠️ 履(10) 指向《周易正義/10》而非《序卦傳》—— 维基文库 \`易傳/序卦\` 页**脱「履者，禮也」一句**，
   * 该句在两个独立注疏本里都是经文（其后才是韩康伯注），故据注疏本补（卡片 §5-a.2）。
   */
  nameGlossSource?: string;
}

/** 64 卦，按通行本卦序 1→64 排列（索引 n−1 即第 n 卦）。 */
export const HEXAGRAMS: Hexagram[] = [
${entries}
];

/** 按通行本卦序取卦（1–64）。越界返回 undefined，由调用方处理。 */
export function hexagramByOrder(order: number): Hexagram | undefined {
  return HEXAGRAMS[order - 1];
}

/**
 * (下卦先天序, 上卦先天序) → 卦 的 8×8 稠密索引，模块加载时建好，查表 O(1)。
 * 建表时顺带体检：64 格必须填满且无冲突，缺一格就当场抛错 ——
 * 与其让引擎在某个卦象上静默拿到 undefined，不如启动就炸（PRD liuyao §6.3）。
 */
const BY_KEY: Hexagram[] = (() => {
  const idx: Hexagram[] = new Array(64);
  for (const h of HEXAGRAMS) {
    const at = (h.lowerOrder - 1) * 8 + (h.upperOrder - 1);
    if (idx[at]) throw new Error("gua.ts: 先天序键重复 —— 下" + h.lowerOrder + " 上" + h.upperOrder);
    idx[at] = h;
  }
  for (let i = 0; i < 64; i++) {
    if (!idx[i]) throw new Error("gua.ts: 先天序键 8×8 缺格 —— 下" + (Math.floor(i / 8) + 1) + " 上" + ((i % 8) + 1));
  }
  return idx;
})();

/**
 * 按 (下卦先天序, 上卦先天序) 取卦 —— **起卦引擎的主查表口**。
 * 8×8 全覆盖已在建表时验证，故必有结果，返回值不为 undefined。
 *
 * 对接 \`lib/liuyao.ts\`：\`hexagramOf(shape) = hexagramByKey(hexagramKeyOf(shape))\`。
 * ⚠️ \`lower\` 是**内卦**（第 1–3 掷，最下三爻），\`upper\` 是**外卦**——
 * 传反了会静默查到另一个卦（如「水火既濟」变「火水未濟」），不会报错。
 */
export function hexagramByKey(key: { lower: TrigramOrderKey; upper: TrigramOrderKey }): Hexagram {
  return BY_KEY[(key.lower - 1) * 8 + (key.upper - 1)];
}
`;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[fetch-gua] 源：${API}（${USE_CACHE ? "读缓存，不发请求" : "限速 " + SLEEP_MS + "ms/请求"}）`);

  const titles = await listSubpages();
  console.log(`[fetch-gua] 「${PAGE_PREFIX}」下共 ${titles.length} 个子页，逐页解析并按内容筛出卦页…`);

  const guas = [];
  const skipped = [];
  for (const title of titles) {
    const wikitext = await fetchWikitext(title);
    const gua = parseGuaPage(title, wikitext);
    if (gua) {
      guas.push(gua);
      process.stdout.write(`\r[fetch-gua] 已解析 ${String(guas.length).padStart(2)} 卦：${gua.name}          `);
    } else {
      skipped.push(title);
    }
  }
  process.stdout.write("\n");
  console.log(`[fetch-gua] 非卦页跳过 ${skipped.length} 个：${skipped.join("、")}`);

  guas.sort((a, b) => a.order - b.order);

  // 卦名训解（引用层）：序卦优先 → 杂卦兜底；`履` 另据《周易正義/10》
  console.log(`[fetch-gua] 抓卦名训解三源：${Object.values(GLOSS_SOURCES).map((g) => g.title).join("、")}…`);
  const xuguaRaw = await fetchWikitext(GLOSS_SOURCES.xugua.title);
  const zaguaRaw = await fetchWikitext(GLOSS_SOURCES.zagua.title);
  const zhengyiRaw = await fetchWikitext(GLOSS_SOURCES.zhengyi10.title);
  attachGlosses(guas, {
    xuguaRaw,
    // ⚠️ 只吃〈一篇〉，不碰同页的〈校詁版〉（用字有出入，卡片 §5-a.4-3）
    zaguaYipian: cleanClassicText(sectionOf(zaguaRaw, "一篇", GLOSS_SOURCES.zagua.title), "雜卦〈一篇〉"),
    zhengyi10: cleanClassicText(zhengyiRaw, GLOSS_SOURCES.zhengyi10.title),
  });

  const r = verify(guas);
  console.log("");
  console.log("── PRD liuyao §6.3 数据门禁 ─────────────────────────");
  console.log(`① 卦序集合 == 1..64 ················· ${r.count === 64 && r.problems.every((p) => !p.startsWith("①")) ? "✅" : "❌"}（${r.count} 卦）`);
  console.log(`② 卦画 == U+4DC0 + n − 1 ············ ${r.symbolOk}/64`);
  console.log(`③ (下卦,上卦) 互异且覆盖 8×8 ········ ${r.comboCount}/64`);
  console.log(`④ 卦辞 + 恰好 6 条爻辞齐全 ·········· ${r.textOk}/64`);
  console.log(`⑤ 先天序键 (下,上) 覆盖 8×8 ········· ${r.keyCount}/64`);
  console.log(`⑥ 卦序两两成综卦/错卦对（结构自洽）·· ${r.pairOk}/32`);
  console.log(`⑦ 繁简分层：派生全简 / 引用全繁 ····· ${r.problems.some((p) => p.startsWith("⑦")) ? "❌" : "✅"}（name 用字 ${r.nameCharCount} 个）`);
  console.log(`⑧ 字段白名单：无内容字段混入 ······· ${r.problems.some((p) => p.startsWith("⑧")) ? "❌" : "✅"}（纯引用层）`);
  console.log(`⑨ 卦名训解 61 条 · 三栏同进同退 ····· ${r.glossCount}/61（${Object.entries(r.glossByWork).map(([w, n]) => `${w} ${n}`).join(" · ")}）`);
  console.log(`⑩ 训解红线扫描（凶厲咎吝災傷誅顛）·· ${r.problems.some((p) => p.startsWith("⑩")) ? "❌" : "✅ 零命中"}`);
  if (r.problems.length) {
    console.error("\n❌ 门禁未过：");
    for (const p of r.problems) console.error("   " + p);
    process.exitCode = 1;
    return;
  }
  console.log("─────────────────────────────────────────────────────");

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, renderTs(guas), "utf8");
  console.log(`\n[fetch-gua] 已写出 ${OUT_FILE}`);
  console.log(`[fetch-gua] 卦辞 ${guas.length} 条 · 爻辞 ${guas.reduce((n, g) => n + g.lines.length, 0)} 条 · 用九/用六 ${guas.filter((g) => g.yongLine).length} 条`);
}

main().catch((err) => {
  console.error("\n[fetch-gua] 失败：" + err.message);
  process.exitCode = 1;
});
