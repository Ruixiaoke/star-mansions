/**
 * 塔罗释义库 + 综合解读模板 —— 本功能的内容 SoT（PRD v0.3 §9）。
 *
 * 📐 **双层分离标注**（Rick 2026-08-09 拍板，起因见 `docs/external/tarot-rws-meanings.md`）：
 *    取证实测韦特原文的逆位释义**中位数只有 7 个词、83% 是纯词表**，且原文大量按性别 / 发色 /
 *    肤色断言人物，直接撞 §10 红线。从 7 个词「整理」出三段位置化解读，那是创作不是整理。
 *    所以两层在**数据结构上分字段、在页面上分区块**，绝不混为一谈：
 *      - `sourceQuote` = **公版原文逐字**（经红线筛选后的子集），出处见 `source`；
 *      - `keywords` / `meaning` / `byPosition` / `reversedLens` = **本项目编写**。
 *
 * ⚖️ 正逆**不对称**（同一拍板）：原文逆位内容撑不起三段位置化，因此
 *      - 正位：`keywords` + `meaning` + `byPosition`（过去 / 现在 / 指引 三段）；
 *      - 逆位：`keywords` + `meaning` + `reversedLens`（一段「逆位视角」，2–3 句）。
 *    逆位的位置化呈现 = **引擎提供的位置框架句**（`lib/tarot.ts` 的 `POSITIONS[].frame`）
 *    与 `reversedLens` 拼接成文，位置纪律（尤其 §8 位置 3 只写倾向 / 提醒 / 反问）由框架句兜住。
 *
 * 📚 取源纪律：只取原文 **§2 / §3 主条目**，**弃用 §4 追加条目**
 *    （Waite 自述 §4 由他人供稿、与图像无关，且两套互相矛盾 —— 取证卡片「坑 §5」）。
 *
 * 🚧 当前状态：**全部定稿，零占位** —— 78 张牌义（`placeholder` 一律 false，占位兜底已删）
 *    ＋ 综合解读模板（`SUMMARY_TEMPLATES` 四组 + `closing`，`SUMMARY_PLACEHOLDER` 已置 false）。
 *    本文件不再有任何「示例（占位）」文案。
 *
 * 🚨 红线（CLAUDE.md §0-2 / PRD §10）：
 *    - `sourceQuote` 只能**逐字摘录**，可删词（红线筛选）、可用 `…` 标省略，**不得改写、不得补词**。
 *      摘录约定（大阿卡纳已按此统一）：保留原文用词、大小写与句内标点；任何省略（开头 / 中间 / 结尾）
 *      一律以 ` … ` 标出，**不做静默截断**；被省略跨度两侧多余的逗号 / 分号随该跨度一起去掉。
 *    - 逆位只走中性框架：能量向内 / 时机未到 / 过度或不足 / 卡住待疏通 / 提醒回看（§10.2-2）。
 *    - 中文阐释不得由正位机械取反，也不得把逆位写成坏消息、警告或危险。
 */

import type { Suit } from "./tarot-deck";

/** 正位在三个位置上的解读，键对应 PRD §8 的三张牌阵。 */
export interface PositionalReading {
  past: string;
  present: string;
  guidance: string;
}

/**
 * 正位内容。`sourceQuote` 是原文层，其余三项是本项目编写层 —— 页面必须分区块显示。
 */
export interface UprightReading {
  /** 公版原文逐字（红线筛选后的子集）。空串时必须给 `sourceQuoteNote` 说明原因（PRD §12）。 */
  sourceQuote: string;
  /**
   * `sourceQuote` 留空的原因说明，**页面会原样显示**（PRD §12：不能静默留白，
   * 静默留白会让人以为原文就是那样）。两类合法情形：
   * 「原文缺逆位依据」（圣杯二，§9.2-5）、「原文全数触线，已略」（§9.2-2）。
   */
  sourceQuoteNote?: string;
  /** 本项目编写：3 个中性关键词。 */
  keywords: [string, string, string];
  /** 本项目编写：通用释义，2–3 句。 */
  meaning: string;
  /** 本项目编写：三个位置各 1–2 句。 */
  byPosition: PositionalReading;
}

/**
 * 逆位内容。**刻意与正位不对称**：原文逆位撑不起三段位置化，故以一段
 * `reversedLens`（逆位视角）取代 `byPosition`，由引擎的位置框架句拼出位置化呈现。
 */
export interface ReversedReading {
  /** 公版原文逐字（红线筛选后的子集）。空串时必须给 `sourceQuoteNote` 说明原因（PRD §12）。 */
  sourceQuote: string;
  /** 同 `UprightReading.sourceQuoteNote`：留空原因，页面原样显示（PRD §12）。 */
  sourceQuoteNote?: string;
  /** 本项目编写：3 个中性关键词。 */
  keywords: [string, string, string];
  /** 本项目编写：通用释义，2–3 句。 */
  meaning: string;
  /** 本项目编写：一段「逆位视角」，2–3 句，与位置无关（位置由引擎的框架句给）。 */
  reversedLens: string;
}

/** 一张牌的释义部分（与 `TarotCardBase` 合起来才是 PRD §11 的 `TarotCard`）。 */
export interface TarotCardReadings {
  /** **原文**出处标注（本库统一取同一部公版书）；中文阐释部分不属于该出处，由页面分区块讲清。 */
  source: string;
  upright: UprightReading;
  reversed: ReversedReading;
  /** true = 未定稿的示例占位，页面必须显示「示例（占位）」（PRD §9.2）。 */
  placeholder: boolean;
}

/**
 * 全库统一的原文出处，**数据值**取 PRD §9.1 表格指定的写法。
 * 1922 重印本版权页写 "First Published … 1910"，故取 **1910**。
 */
export const SOURCE_PKT = "A. E. Waite, The Pictorial Key to the Tarot, 1910";

/**
 * 引用区块里的**署名呈现形式**，取 PRD §12 指定的写法（书名号 + 破折号起头）。
 * ⚠️ PRD 对同一个出处给了两种字符串：§9.1 是逗号式（= `SOURCE_PKT`，数据值），
 * §12 是书名号式（= 本常量，展示值）。两者并列放在这里，改一个必须同时改另一个；
 * 是否统一成一种写法已上报，待 Rick 拍板（见交付报告）。
 */
export const SOURCE_CITE = "—— A. E. Waite《The Pictorial Key to the Tarot》1910";

/**
 * 78 张全部释义，按牌库 `id` 索引（见 `tarot-deck.ts`）。**全库已定稿、零占位**
 * （每条 `placeholder: false`；验收 §15「零占位」由这里的类型与数据共同保证 ——
 * 类型是 `Record` 而非 `Partial`，缺一张就编译不过，不会静默回落到占位）。
 *
 * 原文取源（PRD §9.2-1，只用主条目，**弃用 §4 追加条目**）：
 *   - id 1–22 大阿卡纳 → PKT **§3** `THE GREATER ARCANA AND THEIR DIVINATORY MEANINGS`
 *   - id 23–78 小阿卡纳 → PKT **§2** `THE LESSER ARCANA` 各牌的 `Divinatory Meanings:` / `Reversed:`
 * 两段都从 Wikisource 原始 HTML 重新解析核对过，逐片段与原文比对（见交付报告）。
 *
 * ⚠️ 牌名对齐，不按原书序号：韦特原书 VIII 作 Fortitude、XX 作 The Last Judgment、
 *    愚者作 Zero 且排在 20 与 21 之间；小牌各花色则从 King 倒着排到 Ace。
 *
 * ⚠️ 每条 `sourceQuote` 上方的注释写明了**原文全文、筛掉了哪些词、依据哪条红线** ——
 *    复核时照着看，不同意就改，但不要静默删注释（§15 要求「筛除处须能说清剔了哪些词、为什么」）。
 *
 * `sourceQuote` 留空的 4 张（各配 `sourceQuoteNote`，页面原样显示，§12 不静默留白）：
 *   20 太阳·逆   —— 原文仅回指正位（§9.2-3）
 *   38 圣杯二·逆 —— 原文主条目缺逆位（§9.2-5，全库唯一）
 *   55 宝剑五·逆 —— 回指 + 余词触及生死（§9.2-3 + §10.1-8）
 *   71 星币七·逆 —— 整条为借贷理财断言，全数触线（§9.2-2）
 */
export const READINGS: Record<number, TarotCardReadings> = {
  // 愚者 The Fool（原书作 Zero. The Fool.）
  1: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Folly, mania, extravagance, intoxication, delirium, frenzy, bewrayment.
      // 筛掉 mania / delirium / frenzy —— 精神状态词，撞 §10.1-2（不做医疗判断）与 §10.1-9（不做身份判断）
      sourceQuote: "Folly … extravagance, intoxication … bewrayment.",
      keywords: ["起步", "未定形", "轻装"],
      meaning:
        "愚者常被放在「一件事刚要开始」的位置上谈：路线还没定，经验也还没攒够，人却已经在往前迈了。它更多在说一种状态——手上没有太多凭据，靠的是好奇，和一股愿意试试的劲。",
      byPosition: {
        past: "你是从一个「先做了再说」的时刻走过来的。当时未必想清楚，但正是那一步把后面的事带了出来。",
        present: "眼下你更像在一个还没定形的阶段，很多东西是敞开的。敞开会让人心里没底，也意味着还没有被固定住。",
        guidance: "你可以问问自己：这件事现在真正缺的是准备，还是一个开始的理由？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Negligence, absence, distribution, carelessness, apathy, nullity, vanity.",
      keywords: ["慢一档", "先看一眼", "心里的起步"],
      meaning:
        "逆位的愚者常被读成「起步这件事发生在里面」——想法在动，脚步还没跟上。也可能是这股劲一时用得散，注意力落在了别处。",
      reversedLens:
        "那股「想开始」的劲多半没有消失，只是没有往外走。你可以看看它去了哪：是还在攒，还是被别的事分掉了。如果这说中了什么，那就先把它认下来，不必急着变成行动。",
    },
  },

  // 魔术师 The Magician
  2: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Skill, diplomacy, address, subtlety; sickness, pain, loss, disaster, snares of enemies;
      //      self-confidence, will; the Querent, if male.
      // 筛掉「sickness, pain, loss, disaster, snares of enemies」——疾病（§10.1-2）＋灾难词 disaster（§10.1-5）＋敌意框架；
      // 筛掉「the Querent, if male」——按性别断言人物（§10.1-9）
      sourceQuote: "Skill, diplomacy, address, subtlety … self-confidence, will …",
      keywords: ["手上有牌", "转化", "专注"],
      meaning:
        "魔术师常被放在「材料齐了，看你怎么用」的语境里谈。它说的不是运气，而是把手边的东西组织起来的那份能力和意愿。",
      byPosition: {
        past: "你手上现在有的方法和资源，多半是那段时间一点点攒起来的。",
        present: "你眼下并不缺工具，缺的更可能是把它们对准同一件事。",
        guidance: "这张牌常被解读为「材料够了」。你可以先把手边已有的盘一遍，再决定要不要往外找。",
      },
    },
    reversed: {
      // 原文：Physician, Magus, mental disease, disgrace, disquiet.
      // 筛掉 mental disease —— 疾病与精神状态断言，撞 §10.1-2 与 §10.1-9
      sourceQuote: "Physician, Magus … disgrace, disquiet.",
      keywords: ["力散了", "还没上手", "先收一收"],
      meaning:
        "逆位的魔术师常被读成「本事还在，只是没落到一处」。也可能是准备得比呈现出来的多——外面看着安静，里面一直在调。",
      reversedLens:
        "问题多半不在能不能，而在往哪使。同时开着好几摊，哪一摊都不容易见效。要不要先收到一件事上？",
    },
  },

  // 女祭司 The High Priestess
  3: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Secrets, mystery, the future as yet unrevealed; the woman who interests the Querent, if male;
      //      the Querent herself, if female; silence, tenacity; mystery, wisdom, science.
      // 筛掉中间两段按性别断言人物的表述（§10.1-9），它们同时也在对第三方下判断（§10.1-7）
      sourceQuote:
        "Secrets, mystery, the future as yet unrevealed … silence, tenacity; mystery, wisdom, science.",
      keywords: ["尚未开口", "内在判断", "等一等"],
      meaning:
        "女祭司常被放在「知道，但还没说」的位置上谈。它偏向安静的那一面——先感觉到，再慢慢弄清楚，不急着给结论。",
      byPosition: {
        past: "有些事你当时没说出口，但一直记着。它以一种不显眼的方式影响了后面的选择。",
        present: "眼下你可能已经隐约有个判断，只是还没到能讲清楚的时候。",
        guidance: "你可以问问自己：这件事上，你其实早就有感觉的部分是什么？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Passion, moral or physical ardour, conceit, surface knowledge.",
      keywords: ["说不出口", "信号被盖住", "回到自己"],
      meaning:
        "逆位的女祭司常被读成「里面的声音被外面的声音盖住了」。也可能是知道的事一直压着，压久了自己也不太确定了。",
      reversedLens:
        "安静久了会变成堵着。是还没想清楚，还是想清楚了但不方便讲——这两种情况需要的东西不一样。",
    },
  },

  // 女皇 The Empress
  4: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Fruitfulness, action, initiative, length of days; the unknown, clandestine;
      //      also difficulty, doubt, ignorance.
      // 筛掉 length of days（长寿）——寿命判断，撞 §10.1-8（不涉及生死）
      sourceQuote:
        "Fruitfulness, action, initiative … the unknown, clandestine; also difficulty, doubt, ignorance.",
      keywords: ["长出来", "供养", "有余裕"],
      meaning:
        "女皇常被放在「东西正在长」的语境里谈：不是靠猛推，而是靠条件够、时间够。它也常指向照顾——照顾一件事，或者照顾人。",
      byPosition: {
        past: "那段时间你或许投入了不少心力去养一件事，现在看到的样子是那时候一点点铺的。",
        present: "眼下这件事更像在自然生长的阶段，用力过猛反而会打断它。",
        guidance: "值得先分辨一下：这件事现在需要的是再加把劲，还是给它一点时间。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Light, truth, the unravelling of involved matters, public rejoicings; according to another reading, vacillation.",
      keywords: ["顾着别人", "还没长开", "先喂自己"],
      meaning:
        "逆位的女皇常被读成「照顾的方向转向了里面」，或者滋养的那一头一时接不上。给出去的多、留给自己的少，也算这一档。",
      reversedLens:
        "给出去的和留下来的，比例可能已经不太对了。你一直在照顾的那件事、那个人，你自己那份还剩多少？先补一补自己的，不算自私。",
    },
  },

  // 皇帝 The Emperor
  5: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Stability, power, protection, realization; a great person; aid, reason, conviction; also authority and will.",
      keywords: ["定规矩", "稳住", "边界"],
      meaning:
        "皇帝常被放在「秩序」这个词底下谈：把事情放进结构里，划清范围，让它可以持续。它谈的是稳定，不是压制。",
      byPosition: {
        past: "你现在依赖的那套做事方式，多半是那时候立下来的。",
        present: "眼下秩序这件事正在起作用——可能是你在维持它，也可能是你正被它框着。",
        guidance: "你可以挑一条你最常执行的规矩，看看它今天还成不成立。",
      },
    },
    reversed: {
      // 原文：Benevolence, compassion, credit; also confusion to enemies, obstruction, immaturity.
      // 筛掉「confusion to enemies」——敌意框架，与 §10.1-5（不制造焦虑）／§10.1-7（不涉及第三方）取向冲突
      sourceQuote: "Benevolence, compassion, credit … obstruction, immaturity.",
      keywords: ["框太紧", "松一点", "谁说了算"],
      meaning:
        "逆位的皇帝常被读成「结构用力过头或者不够」。管得太细会累人，全无边界又容易散——两头都算在里面。",
      reversedLens:
        "抓得紧未必等于更安全，有时候只是不敢松。哪一部分其实可以交出去？先试一处小的，比一次全放手容易。",
    },
  },

  // 教皇 The Hierophant
  6: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Marriage, alliance, captivity, servitude; by another account, mercy and goodness;
      //      inspiration; the man to whom the Querent has recourse.
      // 筛掉 captivity, servitude —— 与 imprisonment 同类的拘禁词，撞 §10.1-5；
      // 筛掉「the man to whom the Querent has recourse」——按性别断言人物（§10.1-9）
      sourceQuote: "Marriage, alliance … by another account, mercy and goodness; inspiration …",
      keywords: ["现成的路", "传承", "找人问"],
      meaning:
        "教皇常被放在「已经有一套做法」的语境里谈：前人走过、规矩摆在那儿，照着走省力。它也常指向请教和学习。",
      byPosition: {
        past: "你身上有些做法是学来的、传下来的，不完全是自己发明的。",
        present: "眼下你可能在按一套既定的方式走，它给你稳，也给你限。",
        guidance: "你可以问问自己：这件事上，有没有本来就可以问的人？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Society, good understanding, concord, over-kindness, weakness.",
      keywords: ["自己的版本", "不太合身", "换个说法"],
      meaning:
        "逆位的教皇常被读成「现成的那套不太合用了」。规矩还在，只是穿在你身上有点紧，需要改一改。",
      reversedLens:
        "别人的经验很好用，但未必是按你的尺寸做的。规矩本身没错，穿在你身上紧了，改一改也不算背叛。哪一条是可以改的？",
    },
  },

  // 恋人 The Lovers
  7: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Attraction, love, beauty, trials overcome.",
      keywords: ["互相吸引", "做选择", "在乎什么"],
      meaning:
        "恋人常被放在「两个东西之间要选一个」的语境里谈，也常被放在关系里谈。它的重点不只是感情，还有选择背后那套你真正看重的东西。",
      byPosition: {
        past: "之前有过一次选择，你当时挑的那一边，把你带到了现在。",
        present: "眼下可能有两个方向都说得通，难的是它们都对你有吸引力。",
        guidance: "你可以问问自己：这两个选项，哪一个更像你自己会做的决定？",
      },
    },
    reversed: {
      // 原文：Failure, foolish designs. Another account speaks of marriage frustrated and
      //      contrarieties of all kinds.
      // 筛掉 Failure —— 以「失败」开头会把逆位直接框成坏牌，撞 §10.2-1；
      // 筛掉「marriage frustrated」——对婚姻结果下断言，撞 §10.1-1 与 §10.1-4
      sourceQuote: "… foolish designs. Another account speaks of … contrarieties of all kinds.",
      keywords: ["还没定", "分清自己的", "慢一点回答"],
      meaning:
        "逆位的恋人常被读成「选择还在过程里」。也可能是两边的分量一直在变，或者你在替别人的期待做题。",
      reversedLens:
        "「我想要的」和「别人希望的」，多半是混着的。混在一起的时候怎么选都不太踏实。如果没人会评价，这道题会不会好答一点？",
    },
  },

  // 战车 The Chariot
  8: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Succour, providence; also war, triumph, presumption, vengeance, trouble.
      // 筛掉 war / vengeance —— 战争与复仇意象，撞 §10.1-5（不制造焦虑与恐吓）
      sourceQuote: "Succour, providence … triumph, presumption … trouble.",
      keywords: ["往前推", "收着劲", "一个方向"],
      meaning:
        "战车常被放在「靠掌控往前走」的语境里谈：两股力气拉着，靠的是握住缰绳，而不是跑得快。方向定住了，速度才有意义。",
      byPosition: {
        past: "那段时间你是靠一股往前的劲挺过来的，也确实推动了一些事。",
        present: "眼下你多半在把几股力气往同一个方向拧，拧得住就走得动。",
        guidance: "你可以问问自己：现在这股劲，方向是你定的，还是被势头带着走的？",
      },
    },
    reversed: {
      // 原文：Riot, quarrel, dispute, litigation, defeat.
      // 筛掉 litigation —— 诉讼断言（§9.2-2 强制项 / §10.1-4）；
      // 筛掉 Riot（暴乱）与 defeat（失利）——撞 §10.1-5 与 §10.2-1（逆位不写成坏牌）
      sourceQuote: "… quarrel, dispute …",
      keywords: ["空转", "方向感弱", "停一下再走"],
      meaning:
        "逆位的战车常被读成「劲还在，方向散了」。也可能是拉扯的两边势均力敌，看着没动，其实一直在使力。",
      reversedLens:
        "使了很多力，位置却没挪多少。这不是不够拼，是在原地拧。停一下确认方向，往往比继续踩油门省事。",
    },
  },

  // 力量 Strength（原书作 8. Fortitude.）
  9: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Power, energy, action, courage, magnanimity; also complete success and honours.",
      keywords: ["柔着来", "耐心", "跟自己相处"],
      meaning:
        "力量常被放在「不靠硬碰硬」的语境里谈：能按住的不是力气，是耐心。它更多在说怎么跟自己的情绪和冲动相处。",
      byPosition: {
        past: "你能走到这儿，有一部分靠的是当时忍下来的那些回合。",
        present: "眼下考验的多半不是能力，而是能不能不急。",
        guidance: "这件事里，有没有一处用软的比用硬的更省力？值得先试试小的那一步。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Despotism, abuse of power, weakness, discord, sometimes even disgrace.",
      keywords: ["撑得有点久", "力气向内", "允许卸一点"],
      meaning:
        "逆位的力量常被读成「劲全用在了忍上」。外面看着平稳，里面一直在使力，久了会累。",
      reversedLens:
        "撑住不代表不累。你在硬撑的到底是什么？允许自己松半格，跟放弃是两回事。",
    },
  },

  // 隐士 The Hermit
  10: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Prudence, circumspection; also and especially treason, dissimulation, roguery, corruption.",
      keywords: ["退一步", "自己走", "慢慢找"],
      meaning:
        "隐士常被放在「暂时离开人群」的语境里谈：不是躲，是需要安静才看得清。它的节奏偏慢，靠的是自己手上那一盏灯。",
      byPosition: {
        past: "有一段时间你是一个人琢磨过来的，那段安静给了你现在的判断。",
        present: "眼下你可能更需要一点独处的空档，而不是更多意见。",
        guidance: "你可以问问自己：现在缺的是别人的答案，还是你自己安静下来的时间？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Concealment, disguise, policy, fear, unreasoned caution.",
      keywords: ["独处久了", "想回人群", "先说一声"],
      meaning:
        "逆位的隐士常被读成「往里收得有点久」。独处本来是充电，收太久也会变成隔着一层。",
      reversedLens:
        "安静有两种：一种是自己选的，一种是不知不觉退远的。分清是哪一种就够了；真想回来，从跟一个人说句话开始。",
    },
  },

  // 命运之轮 Wheel of Fortune
  11: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中（原文 "for​tune" 中间夹了 Wikisource 的换页零宽符，非文字，已去）
      sourceQuote: "Destiny, fortune, success, elevation, luck, felicity.",
      keywords: ["转起来了", "时机", "不全在你"],
      meaning:
        "命运之轮常被放在「事情自己在动」的语境里谈：有些变化不是你推的，也不完全由你停。它提醒的是位置会变，处境也会变。",
      byPosition: {
        past: "回头看会发现，有些转折当时并不在你的计划里。",
        present: "眼下这件事多半在变化中，现在的位置未必是它最后停的地方。",
        guidance: "值得把「我能动的」和「只能等它转的」分开列一列，两边混着看容易白使劲。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Increase, abundance, superfluity.",
      keywords: ["转得慢", "老地方", "换个做法"],
      meaning:
        "逆位的命运之轮常被读成「循环在重复」。同样的情形反复出现的时候，往往说明有一环还没换。",
      reversedLens:
        "同一个坎第三次遇到，多半不是巧合。与其等它自己转过去，不如看看每次卡住之前，自己都做了什么相同的动作。",
    },
  },

  // 正义 Justice
  12: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Equity, rightness, probity, executive; triumph of the deserving side in law.
      // 筛掉「triumph of the deserving side in law」——诉讼结果断言，§9.2-2 强制项（诉讼类）＋ §10.1-4
      sourceQuote: "Equity, rightness, probity, executive …",
      keywords: ["权衡", "讲清楚", "前后相连"],
      meaning:
        "正义常被放在「把两边放上秤」的语境里谈：不偏袒，也不含糊。它关心的是事情有没有被说清楚，以及哪一份是谁的。",
      byPosition: {
        past: "之前的一些选择是有分量的，现在的处境跟它们连着。",
        present: "眼下适合把话讲清楚——哪些是你的部分，哪些不是。",
        guidance: "如果这说中了什么，那就把同一把尺子也对自己用一次，看看结论还一不一样。",
      },
    },
    reversed: {
      // 原文：Law in all its departments, legal complications, bigotry, bias, excessive severity.
      // 筛掉「Law in all its departments, legal complications」——法律／诉讼断言，§9.2-2 强制项 ＋ §10.1-4
      sourceQuote: "… bigotry, bias, excessive severity.",
      keywords: ["秤不太平", "还没说清", "先分清"],
      meaning:
        "逆位的正义常被读成「衡量的过程还没完成」。可能是信息不齐，也可能是你一直在替别人扛不属于你的那份。",
      reversedLens:
        "「我的部分」和「不是我的部分」还没分开摆。分不清的时候，人容易把全部都揽下来。只认自己确实做过的那一份，也够了。",
    },
  },

  // 倒吊人 The Hanged Man
  13: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Wisdom, circumspection, discernment, trials, sacrifice, intuition, divination, prophecy.",
      keywords: ["悬着", "换个角度", "主动等"],
      meaning:
        "倒吊人常被放在「暂时动不了」的语境里谈：不是被困住，是选择停在这儿看看。视角一换，原来的问题会长得不太一样。",
      byPosition: {
        past: "有过一段等待期，当时看着像浪费，回头看未必是。",
        present: "眼下你可能正处在一个悬着的阶段：推不动，也还没到放手的时候。",
        guidance: "一种可能的视角是：先不解决它，只是换个位置看看，问题的形状可能就变了。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Selfishness, the crowd, body politic.",
      keywords: ["等够了", "想落地", "松开也行"],
      meaning:
        "逆位的倒吊人常被读成「悬着的状态到头了」。也可能是你还在原地挂着，但心里已经不在那儿了。",
      reversedLens:
        "等和没动长得很像，其实不一样：等是有方向的，没动是没方向的。如果已经等够了，落地也是一种选择。",
    },
  },

  // 死神 Death —— 敏感牌（§10.2-4）：只写「结束与转变」，不写字面死亡（§10.1-8）
  14: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：End, mortality, destruction, corruption; also, for a man, the loss of a benefactor;
      //      for a woman, many contrarieties; for a maid, failure of marriage projects.
      // 筛掉 mortality —— §9.2-2 点名的强制剔除词（§10.1-8 不涉及生死）；
      // 筛掉「for a man… / for a woman… / for a maid…」整段——按性别断言人物（§10.1-9），
      //   其中「loss of a benefactor」另涉他人生死（§10.1-8）、「failure of marriage projects」涉婚姻断言（§10.1-4）
      sourceQuote: "End … destruction, corruption …",
      keywords: ["一段结束", "腾出位置", "转换"],
      meaning:
        "死神常被放在「一个阶段走完了」的位置上谈。它说的是结束和交接——旧的那套不再适用，位置腾出来，新的才有地方放。这里的结束是过程意义上的，不是字面的。",
      byPosition: {
        past: "有一段确实结束了。不管当时是主动收的还是被动收的，它已经翻过去了。",
        present: "眼下你可能正在交接的中间：旧的还没完全撤走，新的也还没站稳。",
        guidance: "你可以问问自己：现在还留着的东西里，有哪一样其实已经不属于这个阶段了？",
      },
    },
    reversed: {
      // 原文：Inertia, sleep, lethargy, petrifaction, somnambulism; hope destroyed.
      // 筛掉「hope destroyed」——绝望表述，撞 §10.1-8；
      // 筛掉 somnambulism（梦游）——具名的睡眠障碍，撞 §10.1-2（不做医疗判断）
      sourceQuote: "Inertia, sleep, lethargy, petrifaction …",
      keywords: ["还没收尾", "舍不得", "慢慢过渡"],
      meaning:
        "逆位的死神常被读成「过渡拖得比预想久」。要放的东西一直放不下，多半是它对你还有意义，不是你不够干脆。",
      reversedLens:
        "还有一截没结掉。收尾这件事没有标准时长，慢也是一种进行中。是什么让它一直结不掉？通常那里有你在乎的东西。",
    },
  },

  // 节制 Temperance
  15: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Economy, moderation, frugality, management, accommodation.",
      keywords: ["调配", "中间那一档", "慢火"],
      meaning:
        "节制常被放在「兑比例」的语境里谈：两样东西各取一点，混到刚好。它的节奏不快，靠的是一次次微调。",
      byPosition: {
        past: "那段时间你在两头之间找平衡，找到的那个比例现在还在用。",
        present: "眼下更适合小幅调整，而不是推倒重来。",
        guidance: "值得试试小幅调整——哪一样多加一点、哪一样少放一点，往往比重做一遍管用。",
      },
    },
    reversed: {
      // 原文：Things connected with churches, religions, sects, the priesthood, sometimes even the
      //      priest who will marry the Querent; also disunion, unfortunate combinations, competing interests.
      // 筛掉整段宗教表述——撞 §10.1-9（不涉及宗教身份）；其中「the priest who will marry the Querent」
      //   同时是对未来的断言（§10.1-1）与婚姻断言（§10.1-4）
      sourceQuote: "… disunion, unfortunate combinations, competing interests.",
      keywords: ["比例偏了", "两头跑", "重新兑"],
      meaning:
        "逆位的节制常被读成「配比一时没对上」。可能是某一样放多了，也可能是你在两个极端之间来回，中间那一档反而没停过。",
      reversedLens:
        "人一直在两头之间摆，中间那一档反而没停过。摆动本身不是问题，问题是没在中间待过。找一个能待住的位置，哪怕先待一小会儿。",
    },
  },

  // 恶魔 The Devil —— 敏感牌（§10.2-4）
  16: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Ravage, violence, vehemence, extraordinary efforts, force, fatality;
      //      that which is predestined but is not for this reason evil.
      // 筛掉 Ravage / violence —— 暴力意象（§10.1-5）；fatality —— 灾祸与死亡（§10.1-8）；
      // 筛掉「that which is predestined … evil」整句——predestined 是「注定」式断言（§10.1-1），
      //   且含 §15 扫描点名的 evil
      sourceQuote: "… vehemence, extraordinary efforts, force …",
      keywords: ["拉扯", "难放手", "看清绳子"],
      meaning:
        "恶魔常被放在「明知道却停不下来」的语境里谈：某样东西对你有拉力，你也清楚它的代价。它谈的是束缚感，以及束缚里那份真实的快乐。",
      byPosition: {
        past: "有些习惯是那时候形成的。它当时给过你东西，所以留了下来。",
        present: "眼下可能有一处让你既想靠近又想推开，两种感觉同时在。",
        guidance: "你可以问问自己：绑住你的到底是它，还是你不想失去它给你的那一部分？",
      },
    },
    reversed: {
      // 原文：Evil fatality, weakness, pettiness, blindness.
      // 筛掉「Evil fatality」——§15 扫描点名的 evil ＋ 死亡意象（§10.1-8）；
      // 筛掉 blindness —— 以身体障碍作道德比喻，撞 §10.1-9（不做身份判断）
      sourceQuote: "… weakness, pettiness …",
      keywords: ["松开一点", "看见了", "慢慢往外挪"],
      meaning:
        "逆位的恶魔常被读成「绳子开始松了」。看见自己被什么拉着，本身就是变化的一步——虽然看见不等于立刻走得开。",
      reversedLens:
        "「已经知道了」本身就是变化的一步。知道之后往往还要过一段拉扯的日子，这不算退步。先松一点点就好，不必要求自己一次到位。",
    },
  },

  // 塔 The Tower —— 敏感牌（§10.2-4），红线筛选力度最大的一张
  17: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Misery, distress, indigence, adversity, calamity, disgrace, deception, ruin.
      //      It is a card in particular of unforeseen catastrophe.
      // 筛掉 calamity / ruin —— §15 扫描点名的强制剔除词；Misery / indigence（穷困）——撞 §10.1-3 与 §10.1-5；
      // 筛掉整句「It is a card in particular of unforeseen catastrophe.」——灾难恐吓（§10.1-5）
      // 剔除的四个词分散在词表里，故保留片段呈三段（distress / adversity / disgrace, deception）
      sourceQuote: "… distress … adversity … disgrace, deception …",
      keywords: ["松动", "旧结构", "重新搭"],
      meaning:
        "塔常被放在「原来那套忽然不成立了」的语境里谈。它讲的是结构的松动——搭得不太稳的部分先动，剩下的反而看得更清楚。这里说的是结构，不是灾祸。",
      byPosition: {
        past: "有过一次打断。当时不太舒服，但很多事是从那之后才重新排的。",
        present: "眼下可能有一处正在松动。它未必是坏事，只是暂时没有原来那么稳。",
        guidance: "你可以问问自己：现在这套安排里，哪一部分其实一直是勉强撑着的？",
      },
    },
    reversed: {
      // 原文：According to one account, the same in a lesser degree; also oppression, imprisonment, tyranny.
      // 筛掉「According to one account, the same in a lesser degree」——纯回指正位，脱离正位读不通（§9.2-3）；
      // 筛掉 imprisonment —— §9.2-2 与 §15 扫描双重点名的强制剔除词。
      // 结果与 PRD §9.2-3 给的示例（塔逆位取 "oppression, tyranny"）一致。
      sourceQuote: "… oppression … tyranny.",
      keywords: ["正在松开", "慢慢挪", "别急着翻篇"],
      meaning:
        "逆位的塔常被读成「松动发生在里面」。外面看着没什么变化，里面的一些默认设定已经不太一样了。",
      reversedLens:
        "变化是小步的、拖着的，而不是一下子的。慢慢挪不比忽然改变差。给自己一点时间，不用马上宣布翻篇。",
    },
  },

  // 星星 The Star
  18: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Loss, theft, privation, abandonment; another reading says—hope and bright prospects,
      //      （原文此处以逗号收尾，非誊录疏漏）
      // 筛掉「Loss, theft, privation」——失窃与破财类断言，§9.2-2 强制项（§10.1-3）；
      // 筛掉 abandonment —— 被抛弃的关系恐吓（§10.1-5 / §10.1-7）
      sourceQuote: "… another reading says—hope and bright prospects …",
      keywords: ["缓过来", "有个念想", "敞着"],
      meaning:
        "星星常被放在「刚从一段吃力的日子里出来」的位置上谈：不喧哗，但心里重新有了个方向。它的力量偏温和，靠的是持续，不是猛。",
      byPosition: {
        past: "那段时间你没放下某个念想，它一直亮着。",
        present: "眼下更像在恢复的阶段：慢，但确实在往回走。",
        guidance: "如果最初让你在意的那一点还在，那就先让它待着，不必急着变成计划。",
      },
    },
    reversed: {
      // 原文：Arrogance, haughtiness, impotence.
      // 筛掉 impotence —— 英文里易被读作性功能相关，撞 §10.1-2（不做医疗判断）
      sourceQuote: "Arrogance, haughtiness …",
      keywords: ["光收着", "慢热", "先照顾自己"],
      meaning:
        "逆位的星星常被读成「那个念想暂时收进去了」。不是没有了，是这阵子说不太出口，或者顾不上想。",
      reversedLens:
        "念想还在，只是暂时收着；多半是最近一直在应付眼前，没空抬头。先把日子过顺也算数，等力气回来一点再想它也不迟。",
    },
  },

  // 月亮 The Moon —— 敏感牌（§10.2-4）
  19: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Hidden enemies, danger, calumny, darkness, terror, deception, occult forces, error.
      // 筛掉「Hidden enemies, danger」「terror」——恐吓与敌意框架，撞 §10.1-5；
      // 筛掉 calumny（诽谤）——对第三方加害的断言，撞 §10.1-7
      sourceQuote: "… darkness … deception, occult forces, error.",
      keywords: ["看不真切", "心里的动静", "慢慢走"],
      meaning:
        "月亮常被放在「光线不足」的语境里谈：轮廓在，细节看不清，人容易靠想象把它补齐。它谈的是不确定，以及不确定时心里泛起的那些动静。",
      byPosition: {
        past: "有一段时间你是摸着走的：信息不全，只能凭感觉判断。",
        present: "眼下有些事你可能还没看到全貌，先别急着下定论。",
        guidance: "你可以问问自己：现在让你不安的部分，哪些是已经发生的，哪些是想出来的？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中。
      // 「lesser degrees of deception and error」虽指向正位，但自带实义词（deception / error），
      // 不属 §9.2-3 要剔的纯回指，且本牌正位的 deception / error 已保留，读得通。
      sourceQuote: "Instability, inconstancy, silence, lesser degrees of deception and error.",
      keywords: ["雾在散", "分得清一点", "落回地面"],
      meaning:
        "逆位的月亮常被读成「模糊的部分开始退了」。也可能是你正把想象和事实分开摆——摆开之后，事情往往比想的小一点。",
      reversedLens:
        "心里的声音很真实，但它说的未必全是正在发生的事。把「我担心的」和「我知道的」各写一行，看看它们差多少。",
    },
  },

  // 太阳 The Sun
  20: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Material happiness, fortunate marriage, contentment.",
      keywords: ["摊开了", "简单", "有劲"],
      meaning:
        "太阳常被放在「事情终于清楚了」的位置上谈：不用绕，也不用猜。它偏向那种直接的、日常的高兴，不是大起大落的那种。",
      byPosition: {
        past: "有过一段挺舒展的日子，那时候的状态现在还留着底子。",
        present: "眼下这件事多半没那么复杂，答案可能比你以为的直白。",
        guidance: "值得回头看看：有没有一个最简单的做法，被你跳过去了？",
      },
    },
    reversed: {
      // 原文：Reversed: The same in a lesser sense.
      // 纯回指正位、无任何实义词 → 按 §9.2-3 不得单独作为 sourceQuote 呈现，留空并说明（§12：不静默留白）
      sourceQuote: "",
      sourceQuoteNote: "原文逆位仅回指正位、无独立实义，已略",
      keywords: ["收在里面", "低调一阵", "不必张扬"],
      meaning:
        "逆位的太阳常被读成「亮着，但收在里面」。高兴的部分还在，只是这阵子不太想张扬，或者还没到能摊开说的时候。",
      reversedLens:
        "好的那一部分可能也被一起收起来了。不外露不等于没有。有没有哪件小事其实挺好，只是没跟人提过？",
    },
  },

  // 审判 Judgement（原书作 20. The Last Judgment.）
  21: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Change of position, renewal, outcome. Another account specifies total loss though lawsuit.
      //      （原文即作 "though"，非 "through"，未代为订正）
      // 筛掉整句「Another account specifies total loss though lawsuit.」——诉讼＋破财断言，
      //   §9.2-2 强制项（§10.1-3 / §10.1-4）
      sourceQuote: "Change of position, renewal, outcome …",
      keywords: ["回头结账", "听见了", "重新起"],
      meaning:
        "审判常被放在「以前的事情来找你」的语境里谈：不是追究，是到了要给个说法的时候。它也常指向一次醒过来——某句话忽然听懂了。",
      byPosition: {
        past: "有些旧事没有真正翻篇，它们一直在等一个交代。",
        present: "眼下你可能正在重新看待一件早就过去的事，看法在变。",
        guidance: "你可以问问自己：这件事上，你现在的判断和当年比，变了哪一点？",
      },
    },
    reversed: {
      // 原文：Weakness, pusillanimity, simplicity; also deliberation, decision, sentence.
      // 筛掉 sentence —— 此处义为「判决」，属法律断言，撞 §10.1-4
      sourceQuote: "Weakness, pusillanimity, simplicity; also deliberation, decision …",
      keywords: ["还没接起", "尺子对着自己", "先放过自己"],
      meaning:
        "逆位的审判常被读成「叫过一次，还没应」。也可能是你把评判都对准了自己，标准比对别人严得多。",
      reversedLens:
        "那把尺子是在量别人，还是在量自己？对自己苛刻不会让事情结束得更快。试着用对朋友说话的语气，跟自己说一遍同样的事。",
    },
  },

  // 世界 The World
  22: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Assured success, recompense, voyage, route, emigration, flight, change of place.",
      keywords: ["走完一圈", "落地", "接得上"],
      meaning:
        "世界常被放在「一个循环收口」的位置上谈：不只是结束，是各部分终于对上了。它也常指向走出去——范围变大，看的东西也跟着变。",
      byPosition: {
        past: "有一件事你确实做完了，它现在是你的底子。",
        present: "眼下可能正处在收口的阶段，剩下的多是把边角接上。",
        guidance: "一种可能的视角是：先弄清楚「算完成」对你来说具体指什么，剩下的那一小块往往就露出来了。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Inertia, fixity, stagnation, permanence.",
      keywords: ["差一点", "还在收尾", "别赶"],
      meaning:
        "逆位的世界常被读成「快到了，还没到」。也可能是已经完成了，但你自己还没认下来这份完成。",
      reversedLens:
        "剩下的其实只有最后一小段。差一点的时候人最容易急，也最容易草草收。那一小段到底是什么？有时候它比想象中小。",
    },
  },

  // ───────── 权杖 Wands（23–36）· 原文取 PKT §2 THE LESSER ARCANA ─────────

  // 权杖一 Ace of Wands
  23: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Creation, invention, enterprise, the powers which result in these; principle, beginning,
      //      source; birth, family, origin, and in a sense the virility which is behind them; the starting
      //      point of enterprises; according to another account, money, fortune, inheritance.
      // 筛掉「and in a sense the virility which is behind them」——性征表述，撞 §10.1-9
      sourceQuote:
        "Creation, invention, enterprise, the powers which result in these; principle, beginning, source; birth, family, origin … the starting point of enterprises; according to another account, money, fortune, inheritance.",
      keywords: ["起念", "一股火", "从零开始"],
      meaning:
        "权杖一常被放在「念头刚冒出来」的位置上谈：还没有形状，但劲头是真的。它更像一份原始的动力，还没被计划和条件消耗掉。",
      byPosition: {
        past: "有过一个很清楚的起念，后来的一整段是从那儿长出来的。",
        present: "手上这股劲多半是新的，还没被安排进日程表。",
        guidance: "值得先把这个念头说出来或写下来——没形状的东西最容易自己散掉。",
      },
    },
    reversed: {
      // 原文：Fall, decadence, ruin, perdition, to perish; also a certain clouded joy.
      // 筛掉 ruin（§15 点名）、perdition / to perish（生死，§10.1-8）、Fall / decadence（坠落衰败，§10.1-5）
      sourceQuote: "… also a certain clouded joy.",
      keywords: ["火收着", "还没点着", "攒一攒"],
      meaning:
        "逆位常被读成「劲还在，只是还没往外冒」。也可能是想法很多，一落到具体某一件上就卡住。",
      reversedLens:
        "想法和动手之间隔着一段距离，这段距离本身不说明什么。有时候需要的不是更多热情，而是一个足够小的第一步。最小的那一步是什么？",
    },
  },

  // 权杖二 Two of Wands
  24: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Between the alternative readings there is no marriage possible; on the one hand, riches,
      //      fortune, magnificence; on the other, physical suffering, disease, chagrin, sadness,
      //      mortification. …it looks like the malady, the mortification, the sadness of Alexander…
      // 筛掉 physical suffering / disease / malady —— 疾病断言，撞 §10.1-2
      sourceQuote:
        "… on the one hand, riches, fortune, magnificence; on the other, … chagrin, sadness, mortification …",
      keywords: ["站在高处", "看远一点", "还没迈"],
      meaning:
        "权杖二常被放在「已经有了一块地盘，接下来看向哪儿」的语境里谈。手里握着东西，眼睛看着更远的地方，这两件事同时在。",
      byPosition: {
        past: "你曾经站在一个可以往前看的位置上，那时候的选择决定了现在的视野。",
        present: "这件事更像在规划的阶段：想得挺远，脚还没动。",
        guidance: "你可以问问自己：这件事你是在权衡，还是在拖？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Surprise, wonder, enchantment, emotion, trouble, fear.",
      keywords: ["想得多", "还没落地", "缩了一档"],
      meaning:
        "逆位常被读成「计划做得比行动多」。也可能是眼界一时收窄了，只顾得上看脚下。",
      reversedLens:
        "看得远和走得动是两种不同的能力，缺哪一样都会卡。地图画得再细，也替代不了迈出去的那一步。先挑一件今天能做完的事？",
    },
  },

  // 权杖三 Three of Wands
  25: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：He symbolizes established strength, enterprise, effort, trade, commerce, discovery; those are
      //      his ships… The card also signifies able co-operation in business, as if the successful merchant
      //      prince were looking from his side towards yours with a view to help you.
      // 筛掉以「他 / 他的船」描述画面人物的两段——沿用权杖九的处理（按性别指认画中人物，§10.1-9）
      sourceQuote:
        "… established strength, enterprise, effort, trade, commerce, discovery … The card also signifies able co-operation in business …",
      keywords: ["已经发船", "等回音", "看得更宽"],
      meaning:
        "权杖三常被放在「事情已经推出去了，正在等结果」的语境里谈。该做的做完了，剩下的是耐心。",
      byPosition: {
        past: "你之前推出去的东西，后来陆续有了回音。",
        present: "这件事多半处在「已经出手、还没到手」的中间地带。",
        guidance: "空等，和一边等一边准备，最后差别不小。这段等待期，你打算怎么过？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "The end of troubles, suspension or cessation of adversity, toil and disappointment.",
      keywords: ["回音慢", "再等等", "别追着问"],
      meaning:
        "逆位常被读成「反馈来得比预期慢」。也可能是摊子铺得比手能顾过来的稍大一点。",
      reversedLens:
        "没回音不等于没在动，也不等于结果已经出来了。追问的冲动多半来自不确定，而不是来自这件事本身。这段空档可以拿来做点别的。",
    },
  },

  // 权杖四 Four of Wands
  26: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "They are for once almost on the surface—country life, haven of refuge, a species of domestic harvest-home, repose, concord, harmony, prosperity, peace, and the perfected work of these.",
      keywords: ["落定", "一起庆祝", "可以歇一歇"],
      meaning:
        "权杖四常被放在「一个阶段稳住了」的语境里谈：不是终点，是可以喘口气的地方。它常带着一点热闹和松弛。",
      byPosition: {
        past: "有过一段安稳的日子，它给了你现在的底气。",
        present: "这件事多半到了可以先认一认成果的位置。",
        guidance: "值得留意的是有没有给这一段留个停顿——一直往前赶的人，通常不记得自己走了多远。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中。
      // ⚠️ 这是全库少见的一条：原文明说逆位与正位含义不变，是「逆位≠坏牌」最直接的原文依据。
      sourceQuote: "The meaning remains unaltered; it is prosperity, increase, felicity, beauty, embellishment.",
      keywords: ["照旧稳", "低调过", "自己认"],
      meaning:
        "原文在这张牌上特地写明：逆位含义与正位不变。可以读成同样的安稳，只是更安静一点，未必有热闹。",
      reversedLens:
        "稳当这件事不需要被看见才成立。没有人一起庆祝，不代表这一段没有完成。你自己认下来就够。",
    },
  },

  // 权杖五 Five of Wands
  27: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Imitation, as, for example, sham fight, but also the strenuous competition and struggle of the search after riches and fortune. In this sense it connects with the battle of life. Hence some attributions say that it is a card of gold, gain, opulence.",
      keywords: ["各说各的", "练手", "消耗"],
      meaning:
        "权杖五常被放在「几股力气撞在一起」的语境里谈。多半不是你死我活，更像一场谁也没让谁的比划。",
      byPosition: {
        past: "那段时间大家各有各的主张，谁也没完全说服谁。",
        present: "场面可能有点乱：声音多，方向还没收拢。",
        guidance: "你可以问问自己：这场较劲里，你真正想要的是赢，还是被听见？",
      },
    },
    reversed: {
      // 原文：Litigation, disputes, trickery, contradiction.
      // 筛掉 Litigation —— 诉讼断言，§9.2-2 强制项（§10.1-4）
      sourceQuote: "… disputes, trickery, contradiction.",
      keywords: ["声音小了", "内耗", "找共识"],
      meaning:
        "逆位常被读成「争的部分转到里面去了」。表面平了，心里那几股还在互相拽。",
      reversedLens:
        "没吵起来不代表已经谈拢。有些较劲从桌面挪到了心里，消耗一点不少。把分歧摊开说一次，往往比各自忍着省力。",
    },
  },

  // 权杖六 Six of Wands
  28: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "The card has been so designed that it can cover several significations; on the surface, it is a victor triumphing, but it is also great news, such as might be carried in state by the King's courier; it is expectation crowned with its own desire, the crown of hope, and so forth.",
      keywords: ["被看见", "一段告捷", "领着走"],
      meaning:
        "权杖六常被放在「事情办成了，而且有人知道」的语境里谈。它带着一点被认可的成分，不只是自己知道。",
      byPosition: {
        past: "有过一次拿得出手的完成，它给了你一些信用。",
        present: "你可能站在被看着的位置上，这既是好事，也有点重量。",
        guidance: "被认可很舒服，但它不等于事情已经做完。你可以问问自己：掌声和事情本身，现在离得有多远？",
      },
    },
    reversed: {
      // 原文：Apprehension, fear, as of a victorious enemy at the gate; treachery, disloyalty, as of gates
      //      being opened to the enemy; also indefinite delay.
      // 筛掉两处「敌人兵临城下 / 城门大开」的比喻——恐吓意象，撞 §10.1-5
      sourceQuote: "Apprehension, fear … treachery, disloyalty … also indefinite delay.",
      keywords: ["没人看见", "心里打鼓", "自己算数"],
      meaning:
        "逆位常被读成「做成了，但没被看见」。也可能是外面的评价一时进不来，得自己给自己记这一笔。",
      reversedLens:
        "认可来自外面，完成与否只有自己数得清。没被看见的那部分不会因此少掉。你自己那本账上，这件事记了没有？",
    },
  },

  // 权杖七 Seven of Wands
  29: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：It is a card of valour, for, on the surface, six are attacking one… in business—negotiations,
      //      war of trade, barter, competition. It is further a card of success, for the combatant is on the
      //      top and his enemies may be unable to reach him.
      // 筛掉「六打一」「his enemies」两处攻击与敌意意象，以及 war of trade 的 war —— 撞 §10.1-5
      sourceQuote:
        "It is a card of valour … On the intellectual plane, it signifies discussion, wordy strife; in business—negotiations, … barter, competition. It is further a card of success …",
      keywords: ["守住", "站得高", "一个人扛"],
      meaning:
        "权杖七常被放在「有人不同意，你还是守住了」的语境里谈。位置是你的优势，压力也是同时存在的。",
      byPosition: {
        past: "你曾经守住过一个立场，代价是自己扛了一阵。",
        present: "可能有几处需要你反复解释、反复顶住。",
        guidance: "值得留意的是这场坚持是不是全靠你一个人——有些立场其实可以找人一起站。",
      },
    },
    reversed: {
      // 原文：Perplexity, embarrassments, anxiety. It is also a caution against indecision.
      // 筛掉末句 caution against… —— 「警告」框架，撞 §10.2-3（逆位不得写成警告）
      sourceQuote: "Perplexity, embarrassments, anxiety …",
      keywords: ["顶累了", "松一格", "分点出去"],
      meaning:
        "逆位常被读成「守的劲用得有点满」。一直防着的时候，人会忘了原本要守的是什么。",
      reversedLens:
        "一直绷着的姿势维持不了太久，这不是意志问题。守住不等于什么都不能让。哪一处其实可以先松开？",
    },
  },

  // 权杖八 Eight of Wands
  30: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Activity in undertakings, the path of such activity, swiftness, as that of an express messenger; great haste, great hope, speed towards an end which promises assured felicity; generally, that which is on the move; also the arrows of love.",
      keywords: ["快", "在路上", "消息到了"],
      meaning:
        "权杖八常被放在「事情忽然快起来」的语境里谈：都在飞，都朝一个方向去。它的重点是速度和推进。",
      byPosition: {
        past: "有一阵子事情推得很快，很多变化是在那时候一起发生的。",
        present: "节奏可能比你以为的快，消息和进展一起来。",
        guidance: "值得留意的是快的时候容易漏东西——有没有哪一件是需要停下来确认的？",
      },
    },
    reversed: {
      // 原文：Arrows of jealousy, internal dispute, stingings of conscience, quarrels; and domestic disputes
      //      for persons who are married.
      // 筛掉末句「已婚者的家庭争吵」——按婚姻状态断言人物（§10.1-9）＋对关系下判断（§10.1-7）
      sourceQuote: "Arrows of jealousy, internal dispute, stingings of conscience, quarrels …",
      keywords: ["慢下来", "消息压着", "排个序"],
      meaning:
        "逆位常被读成「节奏被拖住了」。也可能是同时来的事太多，反而谁也快不起来。",
      reversedLens:
        "拖着的时候人容易把「慢」当成失误，其实更多是顺序还没排好。同时要快的事太多，等于没有一件是快的。先定一件最先到的？",
    },
  },

  // 权杖九 Nine of Wands
  31: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：The card signifies strength in opposition. If attacked, the person will meet an onslaught
      //      boldly; and his build shews that he may prove a formidable antagonist. With this main
      //      significance there are all its possible adjuncts—delay, suspension, adjournment.
      // 筛掉中间整句：按性别与体格断言人物（"his build shews…"），撞 §10.1-9；并含攻击意象（§10.1-5）
      sourceQuote: "The card signifies strength in opposition. … delay, suspension, adjournment.",
      keywords: ["还站着", "有防备", "快到了"],
      meaning:
        "权杖九常被放在「已经吃过几回亏，但还没倒」的语境里谈。警觉是有来由的，力气也确实剩得不多了。",
      byPosition: {
        past: "之前的几个回合让你学会了先防一手。",
        present: "你多半还撑着，只是比一开始更容易累。",
        guidance: "防备保护了你，也让人靠不近。哪一处可以先放下一点？",
      },
    },
    reversed: {
      // 原文：Obstacles, adversity, calamity.
      // 筛掉 calamity —— §15 扫描点名的强制剔除词（§10.1-5）
      sourceQuote: "Obstacles, adversity …",
      keywords: ["累了", "防得太满", "该补给"],
      meaning:
        "逆位常被读成「防备的劲盖过了本来要做的事」。也可能是这一程真的到了该补给的时候。",
      reversedLens:
        "一直提着防备的人，最先耗掉的是自己。警觉有用，但它不是免费的。补给这件事排进日程了吗？",
    },
  },

  // 权杖十 Ten of Wands
  32: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：…The chief meaning is oppression simply, but it is also fortune, gain, any kind of success…
      //      It is also a card of false-seeming, disguise, perfidy. The place which the figure is approaching
      //      may suffer from the rods that he carries. Success is stultified if the Nine of Swords follows,
      //      and if it is a question of a lawsuit, there will be certain loss.
      // 筛掉「所到之处会因他手中的杖受害」——伤害意象（§10.1-5）；
      // 筛掉「若宝剑九随后…」——牌组合断言，本版不做组合解读；
      // 筛掉「若涉诉讼必有损失」——诉讼＋破财＋确定性断言（§10.1-1 / -3 / -4）
      sourceQuote:
        "… The chief meaning is oppression simply, but it is also fortune, gain, any kind of success, and then it is the oppression of these things. It is also a card of false-seeming, disguise, perfidy …",
      keywords: ["扛太多", "快到门口", "分担"],
      meaning:
        "权杖十常被放在「事情做成了，但压在身上」的语境里谈。成果和负担是同一件东西的两面。",
      byPosition: {
        past: "那段时间你揽下了很多，也确实揽起来了。",
        present: "手上的份量可能已经超出了原本的设想。",
        guidance: "放下一两样，剩下的会更稳。这些是不是都得由你拿？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Contrarieties, difficulties, intrigues, and their analogies.",
      keywords: ["放下一些", "分出去", "先卸货"],
      meaning:
        "逆位常被读成「该卸的开始卸了」。也可能是还在硬撑，但心里已经知道扛不动了。",
      reversedLens:
        "扛得动和该扛，是两件事。把清单摊开看，多半有一两样根本不必是你的。先划掉哪一条？",
    },
  },

  // 权杖侍者 Page of Wands
  33: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Dark young man, faithful, a lover, an envoy, a postman. Beside a man, he will bear favourable
      //      testimony concerning him. A dangerous rival, if followed by the Page of Cups. Has the chief
      //      qualities of his suit. He may signify family intelligence.
      // 筛掉「Dark young man」——按肤色 / 发色与性别断言人物，§9.2-2 强制项（§10.1-9）；
      // 筛掉两句牌组合断言（"Beside a man…" / "if followed by the Page of Cups"），后者另含 dangerous（§10.1-5）
      sourceQuote:
        "… faithful, a lover, an envoy, a postman. … Has the chief qualities of his suit. He may signify family intelligence.",
      keywords: ["带消息", "新鲜劲", "敢开口"],
      meaning:
        "权杖侍者常被放在「一个新消息、一股新兴趣」的语境里谈。它偏向未成熟的那一面：热情足，经验少。",
      byPosition: {
        past: "你曾经因为一个消息或一股兴趣，走上了现在这条路。",
        present: "可能有件新鲜事在吸引你，投入还不深。",
        guidance: "新鲜劲是有保质期的。先做一点点，比先规划一大套更容易留住它。",
      },
    },
    reversed: {
      // 原文：Anecdotes, announcements, evil news. Also indecision and the instability which accompanies it.
      // 筛掉 evil news —— §15 扫描点名的 evil（§10.1-5）
      sourceQuote: "Anecdotes, announcements … Also indecision and the instability which accompanies it.",
      keywords: ["三分钟热度", "消息没准", "再看看"],
      meaning:
        "逆位常被读成「兴趣来得快，也散得快」。也可能是消息还没坐实，先别当结论用。",
      reversedLens:
        "热情退了不代表这件事不值得，很多时候只是它还没找到落脚的地方。手上这个消息，确认过几分？",
    },
  },

  // 权杖骑士 Knight of Wands
  34: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Departure, absence, flight, emigration. A dark young man, friendly. Change of residence.
      // 筛掉「A dark young man, friendly.」——按肤色 / 发色与性别断言人物，§9.2-2 强制项（§10.1-9）
      sourceQuote: "Departure, absence, flight, emigration. … Change of residence.",
      keywords: ["说走就走", "冲劲", "换个地方"],
      meaning:
        "权杖骑士常被放在「行动先于计划」的语境里谈：想到就去了。好处是快，代价是容易折返。",
      byPosition: {
        past: "有过一次说走就走的决定，它把局面整个换了一遍。",
        present: "你身上多半有股不太想等的劲。",
        guidance: "值得留意的是这股劲能撑多远——冲出去容易，接着的三步才是难的。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Rupture, division, interruption, discord.",
      keywords: ["收着冲", "半路停", "想清楚再动"],
      meaning:
        "逆位常被读成「冲劲一时用不出去」。也可能是出发了几次都半路折回，方向还没稳。",
      reversedLens:
        "冲动和行动力常常是同一股东西，区别只在有没有落点。反复折返不是不行，但每次都从头开始很费。这次的落点定了吗？",
    },
  },

  // 权杖王后 Queen of Wands
  35: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：A dark woman, countrywoman, friendly, chaste, loving, honourable. If the card beside her
      //      signifies a man, she is well disposed towards him; if a woman, she is interested in the Querent.
      //      Also, love of money, or a certain success in business.
      // 筛掉「A dark woman, countrywoman」——§15 直接点名的 dark woman（§10.1-9）；
      // 筛掉 chaste —— 以贞洁评价人物（§10.1-9）；
      // 筛掉「若旁边那张牌代表男人…」整句——牌组合断言＋按性别判断第三方（§10.1-7 / -9）
      sourceQuote: "… friendly … loving, honourable … Also, love of money, or a certain success in business.",
      keywords: ["有热度", "稳得住", "照亮别人"],
      meaning:
        "权杖王后常被放在「有存在感又不咄咄逼人」的语境里谈。它偏向那种自己先亮着、旁人自然靠过来的状态。",
      byPosition: {
        past: "你曾经用自己的热度带动过一件事或一群人。",
        present: "你可能是那个被指望着有主意的人。",
        guidance: "照别人之前，自己那盏还够亮吗？",
      },
    },
    reversed: {
      // 原文：Good, economical, obliging, serviceable. Signifies also—but in certain positions and in the
      //      neighbourhood of other cards tending in such directions—opposition, jealousy, even deceit and
      //      infidelity.
      // 筛掉第二句：牌组合断言（本版不做组合解读）＋ infidelity 对关系忠诚下判断（§10.1-7）
      sourceQuote: "Good, economical, obliging, serviceable …",
      keywords: ["收着亮", "顾不上别人", "先充电"],
      meaning:
        "逆位常被读成「亮度收回自己身上了」。这不是变冷淡，更像是电量需要先补。",
      reversedLens:
        "一直给别人供电的人，自己那一格最容易被忽略。收着一阵不等于不在乎。先充一充，不用解释。",
    },
  },

  // 权杖国王 King of Wands
  36: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Dark man, friendly, countryman, generally married, honest and conscientious. The card always
      //      signifies honesty, and may mean news concerning an unexpected heritage to fall in before very long.
      // 筛掉「Dark man… countryman, generally married」——按肤色 / 性别 / 婚姻状态断言人物（§10.1-9）；
      // 筛掉「不久将有意外遗产的消息」——带时间的财产预测（§10.1-1 / -3）
      sourceQuote: "… friendly … honest and conscientious. The card always signifies honesty …",
      keywords: ["拿主意", "带方向", "说了算"],
      meaning:
        "权杖国王常被放在「有人得拍板」的语境里谈：不是最会做的那个，是敢定方向的那个。",
      byPosition: {
        past: "有一次是你拍的板，后面的事按那个方向走了。",
        present: "可能轮到你来定调，哪怕信息不齐。",
        guidance: "值得留意的是拍板和独断的距离——定方向可以快，听意见得留一点时间。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Good, but severe; austere, yet tolerant.",
      keywords: ["定不下来", "太急", "先听一轮"],
      meaning:
        "逆位常被读成「拍板这件事一时不顺手」。可能是定得太急，也可能是迟迟定不了。",
      reversedLens:
        "定方向的人未必需要最全的信息，但需要一个愿意负责的姿态。急着定和不敢定，代价其实差不多。这次缺的是信息，还是把握？",
    },
  },

  // ───────── 圣杯 Cups（37–50）─────────

  // 圣杯一 Ace of Cups
  37: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "House of the true heart, joy, content, abode, nourishment, abundance, fertility; Holy Table, felicity hereof.",
      keywords: ["心口打开", "满出来", "接住"],
      meaning:
        "圣杯一常被放在「感受重新流动起来」的位置上谈。它讲的不是某一段关系，而是那种愿意接受、也愿意给的状态。",
      byPosition: {
        past: "有一刻你心里的门是开着的，后来的很多事从那儿开始。",
        present: "可能有股情绪或善意正在涌上来，还没找到去处。",
        guidance: "感受不说出来，很容易自己蒸发。你打算怎么接住它？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "House of the false heart, mutation, instability, revolution.",
      keywords: ["收着", "说不出口", "先自己接住"],
      meaning:
        "逆位常被读成「心里满着，出口却窄」。感受还在，只是暂时不往外流。",
      reversedLens:
        "说不出口和没有感受，是两回事。有些心意先给自己也算数。要不要先写下来，不用给谁看？",
    },
  },

  // 圣杯二 Two of Cups —— ⚠️ 全库唯一一张原文主条目无逆位依据（PRD §9.2-5）
  38: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Love, passion, friendship, affinity, union, concord, sympathy, the interrelation of the sexes,
      //      and—as a suggestion apart from all offices of divination—that desire which is not in Nature, …
      // 筛掉 the interrelation of the sexes —— 性别 / 性取向相关表述，撞 §10.1-9
      sourceQuote: "Love, passion, friendship, affinity, union, concord, sympathy …",
      keywords: ["呼应", "对等", "靠近"],
      meaning:
        "圣杯二常被放在「两个人（或两件事）对上了」的语境里谈。重点是双向：给和收都在。",
      byPosition: {
        past: "有过一次真正的互相看见，它到现在还起作用。",
        present: "多半有一处正在建立呼应，还很新。",
        guidance: "你可以问问自己：这份呼应里，你给出去的和收回来的，大致是平的吗？",
      },
    },
    reversed: {
      // ⚠️ 特例（PRD §9.2-5）：全库唯一一张**原文主条目（§2/§3）无逆位条目**的牌。
      // §4 追加条目里那句孤零零的「Reversed: Passion.」按取源纪律**弃用**，故此处留空。
      // 留空必须配 sourceQuoteNote，页面会原样显示，不静默留白（PRD §12）。
      sourceQuote: "",
      sourceQuoteNote: "原文缺逆位依据",
      keywords: ["各自站住", "节奏差一点", "先照顾自己"],
      meaning:
        "本张逆位没有公版原文依据（原文主条目缺此条），中文阐释仍由本项目编写。可以读成两边节奏一时没对上，而不是这段关系出了问题。",
      reversedLens:
        "两个人的步子偶尔踩不到一起，很常见。各自站稳一会儿，不等于走散。这阵子你自己那一头，顾上了吗？",
    },
  },

  // 圣杯三 Three of Cups
  39: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "The conclusion of any matter in plenty, perfection and merriment; happy issue, victory, fulfilment, solace, healing.",
      keywords: ["一起高兴", "有人接住", "成了"],
      meaning:
        "圣杯三常被放在「事情成了，而且有人一起高兴」的语境里谈。它偏向轻快的那一面：庆祝、聚拢、互相道贺。",
      byPosition: {
        past: "有过一段被人接住的日子，那份轻快现在还留着。",
        present: "可能正到了适合分享的时候，好消息不必自己憋着。",
        guidance: "值得留意的是有没有人可以一起高兴——独自消化好消息，其实挺费劲。",
      },
    },
    reversed: {
      // 原文：Expedition, dispatch, achievement, end. It signifies also the side of excess in physical
      //      enjoyment, and the pleasures of the senses.
      // 筛掉末句「肉体享乐过度」——对私人生活作道德评判，撞 §10.1-9
      sourceQuote: "Expedition, dispatch, achievement, end …",
      keywords: ["热闹散了", "一个人消化", "挑人说"],
      meaning:
        "逆位常被读成「热闹的部分收起来了」。也可能是想分享，但一时不知道找谁。",
      reversedLens:
        "一个人高兴也是高兴，只是持续得短一点。不必凑热闹，但可以挑一个人说。名单上第一个是谁？",
    },
  },

  // 圣杯四 Four of Cups
  40: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Weariness, disgust, aversion, imaginary vexations, as if the wine of this world had caused
      //      satiety only; another wine… is now offered the wastrel, but he sees no consolation therein.
      //      This is also a card of blended pleasure.
      // 筛掉「the wastrel（浪荡子）」那一段——对画中人物的道德评判，撞 §10.1-9
      sourceQuote:
        "Weariness, disgust, aversion, imaginary vexations, as if the wine of this world had caused satiety only … This is also a card of blended pleasure.",
      keywords: ["提不起劲", "看腻了", "还有一杯"],
      meaning:
        "圣杯四常被放在「什么都还在，就是没兴致」的语境里谈。它讲的是那种说不上哪里不对的乏味。",
      byPosition: {
        past: "有一阵子你对手上的东西失去了兴趣，那段停滞是有意义的。",
        present: "可能有个机会摆着，你却提不起劲去看。",
        guidance: "你可以问问自己：这份没兴致从哪来——是这件事真的不合适，还是你已经累了？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Novelty, presage, new instruction, new relations.",
      keywords: ["抬眼了", "兴趣回来", "再看一眼"],
      meaning:
        "逆位常被读成「乏味开始松动」。也可能是那杯一直没被看见的东西，终于进了视野。",
      reversedLens:
        "兴致这东西说回来就回来，通常不是因为想通了什么。先别急着给这段乏味下结论。手边有没有什么，是你很久没认真看过一眼的？",
    },
  },

  // 圣杯五 Five of Cups
  41: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：It is a card of loss, but something remains over; three have been taken, but two are left; it is
      //      a card of inheritance, patrimony, transmission, but not corresponding to expectations; with some
      //      interpreters it is a card of marriage, but not without bitterness or frustration.
      // 筛掉末句「婚姻，但不无苦涩与挫败」——对婚姻下断言，撞 §10.1-4 与 §10.1-5
      sourceQuote:
        "It is a card of loss, but something remains over; three have been taken, but two are left; it is a card of inheritance, patrimony, transmission, but not corresponding to expectations …",
      keywords: ["失落", "洒了三杯", "还剩两杯"],
      meaning:
        "圣杯五常被放在「确实少了点什么」的语境里谈。原文里洒了三杯、还立着两杯——两件事同时是真的。",
      byPosition: {
        past: "有过一次失落，它当时占满了视野。",
        present: "你可能一直看着洒掉的那部分，站着的那两杯还没转身去看。",
        guidance: "值得留意的是转身的时机——不用勉强自己马上看开，但可以先记得还有两杯。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "News, alliances, affinity, consanguinity, ancestry, return, false projects.",
      keywords: ["转过身", "还剩什么", "慢慢缓"],
      meaning:
        "逆位常被读成「视线开始挪了」。不是不难过了，是难过之外的东西也进来了。",
      reversedLens:
        "失落不会因为被承认就变小，但被承认之后人会松一点。剩下的那部分不需要马上被珍惜，只需要先被看见。它是什么？",
    },
  },

  // 圣杯六 Six of Cups
  42: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "A card of the past and of memories, looking back, as—for example—on childhood; happiness, enjoyment, but coming rather from the past; things that have vanished. Another reading reverses this, giving new relations, new knowledge, new environment …",
      keywords: ["旧日", "温柔的记忆", "熟人"],
      meaning:
        "圣杯六常被放在「回头看」的语境里谈：小时候的、以前的、老朋友的那些。它的味道是温的，不是苦的。",
      byPosition: {
        past: "有一段旧日子对你影响很深，它塑造了你现在柔软的那一处。",
        present: "你可能常被以前的某个片段拽住，那不见得是坏事。",
        guidance: "旧东西可以取暖，但不太适合长住。旧的和新的，现在各占多少？",
      },
    },
    reversed: {
      // 原文：The future, renewal, that which will come to pass presently.
      // 筛掉「that which will come to pass presently」——对未来的断言，撞 §10.1-1
      sourceQuote: "The future, renewal …",
      keywords: ["往前挪", "别停在旧的", "新的进来"],
      meaning:
        "逆位常被读成「重心从旧日往新处挪」。也可能是有些旧东西该收进抽屉了。",
      reversedLens:
        "怀旧和困在里面之间只隔一点点，区别在于它有没有挡住新的东西进来。旧的不必扔，放到该放的位置就好。最近有什么新的，其实已经在门口了？",
    },
  },

  // 圣杯七 Seven of Cups
  43: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Fairy favours, images of reflection, sentiment, imagination, things seen in the glass of contemplation; some attainment in these degrees, but nothing permanent or substantial is suggested.",
      keywords: ["选项太多", "想象", "分不清真假"],
      meaning:
        "圣杯七常被放在「眼前一堆可能性」的语境里谈。好看的很多，能落地的未必多。",
      byPosition: {
        past: "有一阵你被很多可能性晃着眼，选起来很难。",
        present: "选项可能比你需要的多，其中一部分只是想象出来的。",
        guidance: "值得留意的是把「想要」和「可行」各列一列——两张单子重合的地方，通常就是答案。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Desire, will, determination, project.",
      keywords: ["收窄", "落到一个", "分清楚"],
      meaning:
        "逆位常被读成「雾开始散、选项开始收」。也可能是终于愿意排除掉几个了。",
      reversedLens:
        "排除比挑选容易得多，也同样算进展。划掉两个明显不合适的，剩下的立刻清楚一些。先划哪两个？",
    },
  },

  // 圣杯八 Eight of Cups
  44: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：…In practice, it is usually found that the card shews the decline of a matter, or that a matter
      //      which has been thought to be important is really of slight consequence—either for good or evil.
      // 筛掉末尾 either for good or evil —— §15 扫描点名的 evil
      sourceQuote:
        "The card speaks for itself on the surface, but other readings are entirely antithetical—giving joy, mildness, timidity, honour, modesty. In practice, it is usually found that the card shews the decline of a matter, or that a matter which has been thought to be important is really of slight consequence …",
      keywords: ["转身走", "够了", "去找别的"],
      meaning:
        "圣杯八常被放在「明明还不错，但你要走了」的语境里谈。不是被赶走的，是自己觉得够了。",
      byPosition: {
        past: "你曾经主动离开过一个还算舒服的位置。",
        present: "可能有一处，你心里已经准备好放下了。",
        guidance: "好好收尾的离开，比匆忙抽身好走得多。走之前，有什么是需要交代的？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Great joy, happiness, feasting.",
      keywords: ["走不走", "又回头", "再确认"],
      meaning:
        "逆位常被读成「离开的念头还在反复」。也可能是走了一半又折回来看一眼。",
      reversedLens:
        "反复不代表软弱，多半是这件事对你还有分量。想走又留的时候，可以先问：留下来的是留恋，还是还没准备好？",
    },
  },

  // 圣杯九 Nine of Cups
  45: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Concord, contentment, physical bien-être; also victory, success, advantage; satisfaction for the Querent or person for whom the consultation is made.",
      keywords: ["舒坦", "心愿达成", "够了"],
      meaning:
        "圣杯九常被放在「想要的那件事到手了」的语境里谈。它的感觉是踏实的满足，不是狂喜。",
      byPosition: {
        past: "有过一次心愿落地，那份满足现在还托着你。",
        present: "手上多半有一处是真的够了，只是容易被忽略。",
        guidance: "值得留意的是有没有认下这份满足——一直往下一件赶的人，很少享受到已经到手的。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Truth, loyalty, liberty; but the readings vary and include mistakes, imperfections, etc.",
      keywords: ["还差一点", "感觉没跟上", "换个尺子"],
      meaning:
        "逆位常被读成「东西到手了，感觉没跟上」。也可能是当初想要的，现在看已经不是那个了。",
      reversedLens:
        "得到和满足不是同一件事，中间常常隔着一把用旧了的尺子。想要的东西变了，并不丢人。现在真正想要的是什么？",
    },
  },

  // 圣杯十 Ten of Cups
  46: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：…if with several picture-cards, a person who is taking charge of the Querent's interests; also
      //      the town, village or country inhabited by the Querent.
      // 筛掉「若与数张人物牌同现，某人正在打理问卜者的事务」——牌组合断言＋对第三方下判断（§10.1-7）
      sourceQuote:
        "Contentment, repose of the entire heart; the perfection of that state; also perfection of human love and friendship … also the town, village or country inhabited by the Querent.",
      keywords: ["圆满", "一群人", "安放"],
      meaning:
        "圣杯十常被放在「关系上的圆满」的语境里谈：一群人、一个家、一处能安放的地方。",
      byPosition: {
        past: "有过一段被好好接住的关系，它是你的底色之一。",
        present: "你可能正处在一处关系比较稳的位置上。",
        guidance: "值得留意的是圆满是维护出来的——它需要有人主动多说一句话。",
      },
    },
    reversed: {
      // 原文：Repose of the false heart, indignation, violence.
      // 筛掉 violence —— 暴力意象，撞 §10.1-5
      sourceQuote: "Repose of the false heart, indignation …",
      keywords: ["有点错位", "各忙各的", "先说一句"],
      meaning:
        "逆位常被读成「圆满的样子和里面的感觉差了一点」。也可能是大家都在，只是最近顾不上彼此。",
      reversedLens:
        "关系里的疏远常常不是谁的错，只是没人开口。主动的那一句话，通常比想象中好说。你打算说给谁？",
    },
  },

  // 圣杯侍者 Page of Cups
  47: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Fair young man, one impelled to render service and with whom the Querent will be connected; a
      //      studious youth; news, message; application, reflection, meditation; also these things directed
      //      to business.
      // 筛掉「Fair young man」——§15 直接点名的 fair man 类（§10.1-9）；
      // 筛掉「with whom the Querent will be connected」——对未来关系的断言（§10.1-1 / -7）
      sourceQuote:
        "… a studious youth; news, message; application, reflection, meditation; also these things directed to business.",
      keywords: ["一点心意", "敏感", "新的感受"],
      meaning:
        "圣杯侍者常被放在「一份还很嫩的心意」的语境里谈。它偏向直觉和感受那一头，尚未成形。",
      byPosition: {
        past: "你曾经很在意一些细小的感受，那份敏感一直带到了现在。",
        present: "可能有一点新的心动或直觉在冒头，还很轻。",
        guidance: "值得留意的是别急着评价它——太新的感受经不起分析，先让它待一会儿。",
      },
    },
    reversed: {
      // 原文：Taste, inclination, attachment, seduction, deception, artifice.
      // 筛掉 seduction —— 易读作情欲诱导，撞 §10.1-9
      sourceQuote: "Taste, inclination, attachment … deception, artifice.",
      keywords: ["收回去", "想太多", "别急着定性"],
      meaning:
        "逆位常被读成「刚冒头的感受又缩回去了」。也可能是把一点小感觉分析得过重。",
      reversedLens:
        "感受被分析久了会变形，本来只是一点心动，最后被想成一个难题。它不用现在就有名字。先放着，会怎么样？",
    },
  },

  // 圣杯骑士 Knight of Cups
  48: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Arrival, approach—sometimes that of a messenger; advances, proposition, demeanour, invitation, incitement.",
      keywords: ["带着心意来", "邀请", "慢慢靠近"],
      meaning:
        "圣杯骑士常被放在「有人带着心意靠近，或者你正这样靠近别人」的语境里谈。节奏不快，姿态是温和的。",
      byPosition: {
        past: "有过一次真诚的邀约或表达，它改变了一段关系的走向。",
        present: "可能有一处正在靠近，还在试探的阶段。",
        guidance: "值得留意的是心意和行动的距离——想到了但没说出口，另一头是收不到的。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Trickery, artifice, subtlety, swindling, duplicity, fraud.",
      keywords: ["说不出口", "落差", "先弄清自己的"],
      meaning:
        "逆位常被读成「心意还没走出去」。也可能是想象里的那份，和实际能给的那份，差了一截。",
      reversedLens:
        "心意在脑子里最完整，一落到具体动作就会缩水，这很正常。与其等一个完美的表达，不如先给一个小的。最小的那个动作是什么？",
    },
  },

  // 圣杯王后 Queen of Cups
  49: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Good, fair woman; honest, devoted woman, who will do service to the Querent; loving
      //      intelligence, and hence the gift of vision; success, happiness, pleasure; also wisdom, virtue;
      //      a perfect spouse and a good mother.
      // 筛掉三处按性别与家庭角色断言人物（fair woman / devoted woman… / a perfect spouse and a good mother），
      //   §9.2-2 强制项（§10.1-9），其中「will do service to the Querent」另属对未来的断言（§10.1-1）
      sourceQuote:
        "… loving intelligence, and hence the gift of vision; success, happiness, pleasure; also wisdom, virtue …",
      keywords: ["接得住", "共情", "有边界"],
      meaning:
        "圣杯王后常被放在「能接住别人情绪」的语境里谈。它的力量是柔的，但需要边界，不然会被淹掉。",
      byPosition: {
        past: "你曾经接住过别人的情绪，那份能力是练出来的。",
        present: "你可能是那个被倾诉的人：接得多，说得少。",
        guidance: "共情不必以自己的状态为代价。你可以问问自己：接和被淹的界线，画在哪儿？",
      },
    },
    reversed: {
      // 原文：The accounts vary; good woman; otherwise, distinguished woman but one not to be trusted;
      //      perverse woman; vice, dishonour, depravity.
      // 筛掉四处「woman」断言——按性别评判人物，§9.2-2 强制项（§10.1-9）；
      // 筛掉 depravity —— 对私德的重度评判，撞 §10.1-9
      sourceQuote: "The accounts vary … vice, dishonour …",
      keywords: ["接太多", "分不清谁的", "先分开"],
      meaning:
        "逆位常被读成「别人的情绪和自己的混在一起了」。接得太满的时候，人分不清哪一份难受是自己的。",
      reversedLens:
        "共情能力强的人，最容易把别人的情绪当成自己的天气。分开摆一摆不是冷漠，是让自己还接得住。这份感受，是谁的？",
    },
  },

  // 圣杯国王 King of Cups
  50: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Fair man, man of business, law, or divinity; responsible, disposed to oblige the Querent; also
      //      equity, art and science, including those who profess science, law and art; creative intelligence.
      // 筛掉「Fair man, man of business, law, or divinity」——§15 直接点名的 fair man，
      //   并按性别与职业断言人物（§10.1-9）
      sourceQuote:
        "… responsible, disposed to oblige the Querent; also equity, art and science, including those who profess science, law and art; creative intelligence.",
      keywords: ["稳住情绪", "有分寸", "不被卷走"],
      meaning:
        "圣杯国王常被放在「情绪很大但人没被卷走」的语境里谈。它不是没感觉，是感觉之上还有一层稳。",
      byPosition: {
        past: "有过一次你稳住了局面，靠的不是强硬，是没被情绪带跑。",
        present: "你可能需要在起伏中间保持一点分寸。",
        guidance: "值得留意的是压住和消化的差别——稳得住的人，通常在别处把情绪处理掉了。",
      },
    },
    reversed: {
      // 原文：Dishonest, double-dealing man; roguery, exaction, injustice, vice, scandal, pillage,
      //      considerable loss.
      // 筛掉 man —— 按性别断言人物（§10.1-9）；pillage（劫掠，§10.1-5）；
      //   scandal（名誉受损断言）与 considerable loss（破财断言，§10.1-3）
      sourceQuote: "Dishonest, double-dealing … roguery, exaction, injustice, vice …",
      keywords: ["压太久", "表面平", "找地方放"],
      meaning:
        "逆位常被读成「稳是撑出来的」。表面看着没事，里面那一份一直没处放。",
      reversedLens:
        "压得住不等于处理过了，压久了会从别的地方冒出来。找一个能放情绪的地方，跟稳重不冲突。你的那个地方在哪？",
    },
  },

  // ───────── 宝剑 Swords（51–64）─────────

  // 宝剑一 Ace of Swords
  51: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Triumph, the excessive degree in everything, conquest, triumph of force. It is a card of great force, in love as well as in hatred. The crown may carry a much higher significance than comes usually within the sphere of fortune-telling.",
      keywords: ["想清楚了", "一刀切开", "说破"],
      meaning:
        "宝剑一常被放在「忽然想明白」的位置上谈：混着的东西被切开，是什么就是什么。它的力量很直接，也因此不太留情面。",
      byPosition: {
        past: "有过一刻你把某件事想透了，之后就回不去了。",
        present: "可能正到了要把话说清楚的位置。",
        guidance: "值得留意的是清楚和锋利的距离——同一件事，怎么说决定了对方能不能听进去。",
      },
    },
    reversed: {
      // 原文：The same, but the results are disastrous; another account says—conception, childbirth,
      //      augmentation, multiplicity.
      // 筛掉「The same, but the results are disastrous」——回指正位（§9.2-3）且含 disastrous（§15 点名 disaster）；
      // 筛掉 conception, childbirth —— 怀孕与生育结果，§9.2-2 强制项（§10.1-2）
      sourceQuote: "… augmentation, multiplicity.",
      keywords: ["还没想透", "话说重了", "再理一遍"],
      meaning:
        "逆位常被读成「刀还没磨好」。可能是道理没理顺，也可能是理顺了但说得太硬。",
      reversedLens:
        "想清楚和说清楚是两道工序，很多卡住的地方其实卡在第二道。同一句话换个说法，落点会完全不同。这句话你会怎么重说一遍？",
    },
  },

  // 宝剑二 Two of Swords
  52: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Conformity and the equipoise which it suggests, courage, friendship, concord in a state of arms; another reading gives tenderness, affection, intimacy. The suggestion of harmony and other favourable readings must be considered in a qualified manner, as Swords generally are not symbolical of beneficent forces in human affairs.",
      keywords: ["悬而未决", "不想看", "两边都有理"],
      meaning:
        "宝剑二常被放在「两边都说得通，所以谁也不选」的语境里谈。停在中间是舒服的，也是有成本的。",
      byPosition: {
        past: "有一件事你当时选择了不选，那个悬置一直留着。",
        present: "可能有一处你在刻意不去看，因为一看就得决定。",
        guidance: "不选也是一种选——它把决定权交给了时间。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Imposture, falsehood, duplicity, disloyalty.",
      keywords: ["睁眼看", "信息进来", "快到点了"],
      meaning:
        "逆位常被读成「挡着的那只手开始放下」。也可能是新的信息进来，平衡被打破了。",
      reversedLens:
        "悬着的事很少自己消失，多半是被时间替你决定了。真正难的通常不是选项，是承认自己已经有偏向。偏向是哪一边？",
    },
  },

  // 宝剑三 Three of Swords —— 敏感牌（§10.2-4）
  53: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Removal, absence, delay, division, rupture, dispersion, and all that the design signifies naturally, being too simple and obvious to call for specific enumeration.",
      keywords: ["疼过", "说破了", "分开"],
      meaning:
        "宝剑三常被放在「话说破之后那一下」的语境里谈。它承认难受是真的，但重点是「已经清楚了」，不是「完了」。",
      byPosition: {
        past: "有过一次不好受的分开或直说，它的痕迹还在。",
        present: "可能有一处还在疼，同时也比之前清楚。",
        guidance: "值得留意的是给这份难受留位置——不急着振作，也是一种照顾自己的方式。",
      },
    },
    reversed: {
      // 原文：Mental alienation, error, loss, distraction, disorder, confusion.
      // 筛掉 Mental alienation —— 精神状态断言，§9.2-2 强制项（§10.1-2 / §10.1-9）
      sourceQuote: "… error, loss, distraction, disorder, confusion.",
      keywords: ["在缓", "慢慢来", "别催自己"],
      meaning:
        "逆位常被读成「疼在退，但还没退完」。缓过来通常不是直线，来回一下很常见。",
      reversedLens:
        "好起来这件事没有时间表，反复也算在里面。反复不是退步，是这件事还有分量。这几天，比之前松一点了吗？",
    },
  },

  // 宝剑四 Four of Swords
  54: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Vigilance, retreat, solitude, hermit's repose, exile, tomb and coffin. It is these last that
      //      have suggested the design.
      // 筛掉 tomb and coffin（墓与棺）及其指代句——生死意象，撞 §10.1-8
      sourceQuote: "Vigilance, retreat, solitude, hermit's repose, exile …",
      keywords: ["暂停", "躺一会儿", "养神"],
      meaning:
        "宝剑四常被放在「主动停下来休息」的语境里谈。不是被打断，是自己按下了暂停。",
      byPosition: {
        past: "有过一段你退出来休整的时间，那段停顿是必要的。",
        present: "可能正需要一段什么都不推进的日子。",
        guidance: "没排进日程的休息，通常不会发生。这阵子有没有一块时间是留给「不推进」的？",
      },
    },
    reversed: {
      // 原文：Wise administration, circumspection, economy, avarice, precaution, testament.
      // 筛掉 testament（遗嘱）——身后事，撞 §10.1-8
      sourceQuote: "Wise administration, circumspection, economy, avarice, precaution …",
      keywords: ["该起来了", "歇够了", "慢慢恢复"],
      meaning:
        "逆位常被读成「休整接近尾声」。也可能是休息一直没歇到点上，人还是乏。",
      reversedLens:
        "停下来和缓过来不是同一件事，有时候躺了很久也没真的松。真正让人回血的，未必是不动。哪一种休息对你才算数？",
    },
  },

  // 宝剑五 Five of Swords
  55: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Degradation, destruction, revocation, infamy, dishonour, loss, with the variants and analogues of these.",
      keywords: ["赢了但空", "各退一步难", "代价"],
      meaning:
        "宝剑五常被放在「争赢了，然后呢」的语境里谈。它更多在问代价，而不是输赢本身。",
      byPosition: {
        past: "有过一次你争到了，也失去了些别的。",
        present: "可能有一处正在较劲，赢面在你这边。",
        guidance: "值得留意的是这场争执之后还想不想继续来往——有些赢，赢完就没下文了。",
      },
    },
    reversed: {
      // 原文：The same; burial and obsequies.
      // 「The same」是纯回指（§9.2-3）；余下 burial and obsequies（下葬与丧仪）触及生死（§10.1-8）——
      // 两部分都不能留，故 sourceQuote 留空并说明（§12：不静默留白）
      sourceQuote: "",
      sourceQuoteNote: "原文逆位为回指，余词触及生死，已略",
      keywords: ["想和了", "放下胜负", "先低头"],
      meaning:
        "本张逆位的原文只是回指正位，其余用词触及生死，按红线已略（见引用区说明）。中文阐释读作：较劲的那股劲开始退了。",
      reversedLens:
        "争赢的兴趣一旦退掉，人会先觉得空，再觉得轻。放下胜负不等于承认自己错。这件事上，你还想赢吗？",
    },
  },

  // 宝剑六 Six of Swords
  56: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Journey by water, route, way, envoy, commissionary, expedient.",
      keywords: ["摆渡", "往平静处去", "带着走"],
      meaning:
        "宝剑六常被放在「从一处挪到另一处」的语境里谈：水面渐渐平，但东西都还在船上。",
      byPosition: {
        past: "你曾经从一个难处慢慢挪了出来，过程不快。",
        present: "可能正在过渡中间，还没上岸。",
        guidance: "值得留意的是船上带了什么——有些东西可以在这一程放下。",
      },
    },
    reversed: {
      // 原文：Declaration, confession, publicity; one account says that it is a proposal of love.
      // 筛掉末句「有一说是求爱」——对感情走向的断言，撞 §10.1-1 与 §10.1-4
      sourceQuote: "Declaration, confession, publicity …",
      keywords: ["还没启程", "拖着旧的", "卡在半路"],
      meaning:
        "逆位常被读成「挪的过程一时停住了」。也可能是想走，但有些事还没交代完。",
      reversedLens:
        "走不动的时候，多半不是不想走，是有一头还系着。系着的那一头是什么？看清楚了，绳子往往比想的松。",
    },
  },

  // 宝剑七 Seven of Swords
  57: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Design, attempt, wish, hope, confidence; also quarrelling, a plan that may fail, annoyance. The design is uncertain in its import, because the significations are widely at variance with each other.",
      keywords: ["走捷径", "留一手", "悄悄办"],
      meaning:
        "宝剑七常被放在「不走正门」的语境里谈：可能是聪明的绕道，也可能是没说全。它本身不判好坏，看用在哪。",
      byPosition: {
        past: "有过一次你选择了不把话说全，那个选择有它的道理。",
        present: "可能有一处你在保留信息，或者别人在对你保留。",
        guidance: "省下的解释，往往要在后面还回去。这份保留的成本，你算过吗？",
      },
    },
    reversed: {
      // 原文：Good advice, counsel, instruction, slander, babbling.
      // 筛掉 slander（诽谤）——对他人加害的断言，撞 §10.1-7（与大牌月亮剔除 calumny 同一口径）
      sourceQuote: "Good advice, counsel, instruction … babbling.",
      keywords: ["摊开说", "收手", "自己也别绕"],
      meaning:
        "逆位常被读成「藏着的部分开始藏不住」。也可能是终于不想再绕了。",
      reversedLens:
        "绕道的成本是记忆——要记住对谁说过什么。摊开说一次，人会轻很多。哪一句话是你最想收回的？",
    },
  },

  // 宝剑八 Eight of Swords
  58: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Bad news, violent chagrin, crisis, censure, power in trammels, conflict, calumny; also sickness.
      // 筛掉 Bad news / violent / crisis —— 恐吓与暴力意象（§10.1-5）；
      // 筛掉 calumny（诽谤，§10.1-7）与 sickness（疾病，§9.2-2 强制项 / §10.1-2）
      sourceQuote: "… censure, power in trammels, conflict …",
      keywords: ["觉得动不了", "眼罩", "其实有缝"],
      meaning:
        "宝剑八常被放在「感觉被困住」的语境里谈。牌面上的剑是围着的，不是绑着的——限制有一部分来自看不见。",
      byPosition: {
        past: "有一段时间你觉得没有选择，回头看未必真的没有。",
        present: "可能有一处让你觉得动弹不得，先别急着相信这个结论。",
        guidance: "把「不能」和「不敢」分开列一列，剩下的余地常常比想的多。",
      },
    },
    reversed: {
      // 原文：Disquiet, difficulty, opposition, accident, treachery; what is unforeseen; fatality.
      // 筛掉 accident（事故，§10.1-5）与 fatality（死亡意象，§10.1-8）
      sourceQuote: "Disquiet, difficulty, opposition … treachery; what is unforeseen …",
      keywords: ["缝开了", "摘眼罩", "试着动一下"],
      meaning:
        "逆位常被读成「困住的感觉在松」。也可能是终于发现有一条路一直开着。",
      reversedLens:
        "被困的感觉很真实，但它和实际的边界常常不重合。先动一小步，多半会发现范围比想的宽。最小的那一步是什么？",
    },
  },

  // 宝剑九 Nine of Swords —— 敏感牌（§10.2-4）
  59: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Death, failure, miscarriage, delay, deception, disappointment, despair.
      // 筛掉 Death（§10.1-8）、miscarriage（流产，§10.1-2）、despair（绝望，§10.1-8）、
      //   failure（把牌框成失败，§10.1-5 / §10.2-1）
      sourceQuote: "… delay, deception, disappointment …",
      keywords: ["半夜醒着", "想太多", "天没塌"],
      meaning:
        "宝剑九常被放在「夜里翻来覆去」的位置上谈。它说的是担忧本身，不是担忧的内容——多数时候，想的比发生的多。",
      byPosition: {
        past: "有过一阵子你睡得不好，脑子一直在转。",
        present: "可能有些担心占了太多地方，尤其在安静的时候。",
        guidance: "值得留意的是把担心写下来——摊在纸上的和在脑子里转的，通常不是一个体量。",
      },
    },
    reversed: {
      // 原文：Imprisonment, suspicion, doubt, reasonable fear, shame.
      // 筛掉 Imprisonment —— §9.2-2 与 §15 双重点名的强制剔除词
      sourceQuote: "… suspicion, doubt, reasonable fear, shame.",
      keywords: ["天亮一点", "说出来", "慢慢松"],
      meaning:
        "逆位常被读成「夜快过去了」。也可能是终于把心里那件事跟人说了一次。",
      reversedLens:
        "担忧在没被说出口之前，会一直保持它最大的形状。跟人说一次，或者写下来，它多半会缩小一圈。可以说的那个人是谁？",
    },
  },

  // 宝剑十 Ten of Swords —— 敏感牌（§10.2-4）
  60: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Whatsoever is intimated by the design; also pain, affliction, tears, sadness, desolation.
      //      It is not especially a card of violent death.
      // 筛掉 pain, affliction（身体痛苦，§10.1-2）与 desolation（§10.1-5）；
      // 末句虽是**否定**「并非横死之牌」，仍把该字样搬上页面，按 §10.1-8 一并略去
      sourceQuote: "Whatsoever is intimated by the design; also … tears, sadness …",
      keywords: ["到底了", "一段结束", "天要亮"],
      meaning:
        "宝剑十常被放在「这一段走到头了」的语境里谈。原文特地注明它不是字面意义上的那种终结——到底之后，方向只剩一个。",
      byPosition: {
        past: "有过一次彻底的收场，之后的事是重新起的。",
        present: "可能有一处已经到了底，再往下没有了。",
        guidance: "值得留意的是到底之后的第一件小事——不必是大动作，能做成一件就算重新开始。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中。
      // ⚠️ 全库少见：这张牌的原文逆位反而是正面的，是「逆位≠坏牌」的又一条原文依据。
      sourceQuote: "Advantage, profit, success, favour, but none of these are permanent; also power and authority.",
      keywords: ["起身", "慢慢缓", "别急着复盘"],
      meaning:
        "原文在这张牌上的逆位反而偏正面（优势、成功、权柄，只是都不持久）。可以读成「开始往回走了」——不快，但方向变了。",
      reversedLens:
        "从最低处往上走的那一段，进展常常小到看不见。慢不代表没动。今天比昨天多做成了哪一件小事？",
    },
  },

  // 宝剑侍者 Page of Swords
  61: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Authority, overseeing, secret service, vigilance, spying, examination, and the qualities thereto belonging.",
      keywords: ["好奇", "打听", "话多一点"],
      meaning:
        "宝剑侍者常被放在「到处看、到处问」的语境里谈：警觉、机灵、消息灵通，分寸还在练。",
      byPosition: {
        past: "你曾经靠打听和观察拿到过关键信息。",
        present: "可能有一处你在留意风声，还没到下结论的时候。",
        guidance: "听来的和确认过的，最好分开放。这一条的第一手在哪？",
      },
    },
    reversed: {
      // 原文：More evil side of these qualities; what is unforeseen, unprepared state; sickness is also
      //      intimated.
      // 筛掉 More evil side… —— §15 扫描点名的 evil；筛掉 sickness —— 疾病，§9.2-2 强制项（§10.1-2）
      sourceQuote: "… what is unforeseen, unprepared state …",
      keywords: ["听岔了", "别急着传", "先核一遍"],
      meaning:
        "逆位常被读成「信息还没坐实」。也可能是话说得比自己知道的多。",
      reversedLens:
        "消息在转手的过程里会变形，越有意思的越容易走样。核一遍再用，成本其实很低。这一条，第一手在哪？",
    },
  },

  // 宝剑骑士 Knight of Swords
  62: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Skill, bravery, capacity, defence, address, enmity, wrath, war, destruction, opposition,
      //      resistance, ruin. There is therefore a sense in which the card signifies death, but it carries
      //      this meaning only in its proximity to other cards of fatality.
      // 筛掉 enmity, wrath, war（敌意与战争，§10.1-5）与 ruin（§15 点名）；
      // 筛掉末句「意味着死亡」整句——生死断言＋牌组合断言（§10.1-8）
      sourceQuote: "Skill, bravery, capacity, defence, address … destruction, opposition, resistance …",
      keywords: ["直接冲", "说得快", "不绕弯"],
      meaning:
        "宝剑骑士常被放在「想到就说、想到就上」的语境里谈。效率很高，回旋余地很小。",
      byPosition: {
        past: "有过一次你说得又快又直，事情因此推进了，也留下了一点余波。",
        present: "你身上可能有股不想再等的劲，话到嘴边就出去了。",
        guidance: "值得留意的是快和急的差别——同样一句话，晚十分钟说，效果常常不一样。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Imprudence, incapacity, extravagance.",
      keywords: ["太急", "刹一脚", "缓半拍"],
      meaning:
        "逆位常被读成「速度盖过了方向」。也可能是冲了几次之后，人自己先累了。",
      reversedLens:
        "快的代价通常不出现在当下，而出现在需要收拾的时候。缓半拍不等于犹豫。这句话、这一步，晚一点会更好吗？",
    },
  },

  // 宝剑王后 Queen of Swords
  63: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Widowhood, female sadness and embarrassment, absence, sterility, mourning, privation,
      //      separation.
      // 筛掉 Widowhood / mourning（丧偶与服丧，§10.1-8）、female sadness（按性别断言，§10.1-9）、
      //   sterility（生育相关，§10.1-2）
      sourceQuote: "… absence … privation, separation.",
      keywords: ["看得清", "说实话", "有距离"],
      meaning:
        "宝剑王后常被放在「拎得清」的语境里谈：不糊弄自己，也不太糊弄别人。清醒有代价，它让人显得不好接近。",
      byPosition: {
        past: "你曾经因为看得太清楚，而选择了保持距离。",
        present: "你可能在用理性处理一件本来很情绪化的事。",
        guidance: "值得留意的是清醒之外那一点余温——把话说准，和把话说得能听，可以兼顾。",
      },
    },
    reversed: {
      // 原文：Malice, bigotry, artifice, prudery, bale, deceit.
      // 筛掉 bale（祸患／苦难）——灾祸意象，撞 §10.1-5
      sourceQuote: "Malice, bigotry, artifice, prudery … deceit.",
      keywords: ["太冷", "话有点硬", "留一点温度"],
      meaning:
        "逆位常被读成「防护太厚了」。清醒变成了不让人靠近，这多半是保护，不是脾气。",
      reversedLens:
        "把自己关起来很有效，代价是别人也进不来。硬话背后常常是没被照顾到的那一部分。它是什么？",
    },
  },

  // 宝剑国王 King of Swords
  64: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中（此处 law 指抽象的法度，非诉讼结果断言，故与「正义」牌的处理不同）
      sourceQuote:
        "Whatsoever arises out of the idea of judgment and all its connexions—power, command, authority, militant intelligence, law, offices of the crown, and so forth.",
      keywords: ["讲道理", "定规则", "就事论事"],
      meaning:
        "宝剑国王常被放在「用理性拍板」的语境里谈：标准明确、不看人情。公正是它的长处，冷也是。",
      byPosition: {
        past: "有过一次是靠讲道理解决的，那次立下的规则沿用到了现在。",
        present: "可能需要你把标准摆出来，而不是靠感觉判断。",
        guidance: "值得留意的是标准和人情不必二选一——先把规则说清楚，再看哪里可以通融。",
      },
    },
    reversed: {
      // 原文：Cruelty, perversity, barbarity, perfidy, evil intention.
      // 筛掉 evil intention —— §15 扫描点名的 evil；筛掉 Cruelty / barbarity（残暴，§10.1-5）
      sourceQuote: "… perversity … perfidy …",
      keywords: ["太较真", "道理压人", "松一点"],
      meaning:
        "逆位常被读成「道理用过了头」。讲得全对，但没人听得进去，也算一种没解决。",
      reversedLens:
        "讲赢和讲通是两个目标，用的方法常常相反。道理占满全场的时候，人是退开的。这次你想要的是哪一个？",
    },
  },

  // ───────── 星币 Pentacles（65–78）─────────

  // 星币一 Ace of Pentacles
  65: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Perfect contentment, felicity, ecstasy; also speedy intelligence; gold.",
      keywords: ["一个机会", "落到实处", "先接住"],
      meaning:
        "星币一常被放在「有个实在的东西递到手上」的位置上谈：一份工作、一份资源、一个可以开始的条件。",
      byPosition: {
        past: "有过一次实在的开始，现在的很多东西是从那儿垒起来的。",
        present: "手上可能有一个具体的机会，还没完全接稳。",
        guidance: "很多机会不是没抓住，是没当回事。先接住再说。",
      },
    },
    reversed: {
      // 原文：The evil side of wealth, bad intelligence; also great riches. In any case it shews prosperity,
      //      comfortable material conditions, but whether these are of advantage to the possessor will depend
      //      on whether the card is reversed or not.
      // ⚠️ 取证卡片「坑 §2」：本条原文后面直接接章节收尾议论，须在此截断，勿多切 160 词无关文字。
      // 筛掉 The evil side of wealth —— §15 扫描点名的 evil；bad intelligence（坏消息，§10.1-5）；
      // 末句自我循环（"取决于牌是不是逆位"）无信息量，一并略去
      sourceQuote: "… also great riches. In any case it shews prosperity, comfortable material conditions …",
      keywords: ["还没落地", "先别铺开", "看清条件"],
      meaning:
        "逆位常被读成「机会还悬着」。也可能是条件还没看清，先接下来会有点急。",
      reversedLens:
        "好东西递过来的时候，人最容易跳过「这到底是什么」这一步。看清条件不算不识抬举。有哪一条你其实还没问清楚？",
    },
  },

  // 星币二 Two of Pentacles
  66: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "On the one hand it is represented as a card of gaiety, recreation and its connexions, which is the subject of the design; but it is read also as news and messages in writing, as obstacles, agitation, trouble, embroilment.",
      keywords: ["两头顾", "抛接", "保持平衡"],
      meaning:
        "星币二常被放在「同时顾两件事」的语境里谈。能转得起来是本事，转久了会累也是真的。",
      byPosition: {
        past: "那段时间你一直在两头之间调度，节奏是那时候练出来的。",
        present: "可能有两件事同时要你，谁也不能先放下。",
        guidance: "值得留意的是这个转法能撑多久——短期抛接没问题，长期得有人接手一头。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Enforced gaiety, simulated enjoyment, literal sense, handwriting, composition, letters of exchange.",
      keywords: ["转不动了", "掉了一个", "减一件"],
      meaning:
        "逆位常被读成「球太多了」。掉一个不是能力问题，是数量问题。",
      reversedLens:
        "同时转三个和转两个，难度不是差一点，是差一个量级。减掉一件，剩下的立刻稳。最容易先放下的是哪一件？",
    },
  },

  // 星币三 Three of Pentacles
  67: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：Métier, trade, skilled labour; usually, how-ever, regarded as a card of nobility, aristocracy,
      //      renown, glory.（原文「how-ever」为跨行连字符所致，非独立词；为免误抄，摘录避开该词）
      sourceQuote: "Métier, trade, skilled labour … regarded as a card of nobility, aristocracy, renown, glory.",
      keywords: ["手艺", "一起做", "被认可"],
      meaning:
        "星币三常被放在「几个人凑起来把活干成」的语境里谈。手艺是基础，配合是关键。",
      byPosition: {
        past: "有过一次合作让你的能力被看见，那次经验现在还在用。",
        present: "这件事多半不是一个人能办完的。",
        guidance: "多数返工来自「我以为你会做」。分工说清楚了没有？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Mediocrity, in work and otherwise, puerility, pettiness, weakness.",
      keywords: ["配合不顺", "各做各的", "先对一遍"],
      meaning:
        "逆位常被读成「协作这一环出了岔」。也可能是手艺够，但没被放在合适的位置上。",
      reversedLens:
        "合作卡住的地方，十次有八次在没对齐的期待上，不在能力上。把各自以为的说出来对一遍，很快。第一句要问的是什么？",
    },
  },

  // 星币四 Four of Pentacles
  68: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "The surety of possessions, cleaving to that which one has, gift, legacy, inheritance.",
      keywords: ["攥住", "守成", "盘点"],
      meaning:
        "星币四常被放在「不想失去手上的东西」的语境里谈。攥紧是因为在乎，安全感和局促常常是同一件事。",
      byPosition: {
        past: "你曾经很努力地守住过一些东西，那份谨慎留了下来。",
        present: "你可能在收紧，不太愿意往外给。",
        guidance: "值得留意的是攥住的姿势——手一直握着，就没法接新的。",
      },
    },
    reversed: {
      // 原文作 `Reversed; Suspense, delay, opposition.`（分号，非冒号——取证卡片「坑 §1」）；逐字保留
      sourceQuote: "Suspense, delay, opposition.",
      keywords: ["松一松", "敢给一点", "重新看看"],
      meaning:
        "逆位常被读成「握着的手开始松」。也可能是意识到守着的这些，并没有想象中那么牢。",
      reversedLens:
        "攥紧是本能，松开是练出来的。松一点不等于失去，多半只是腾出手。第一样可以松开的是什么？",
    },
  },

  // 星币五 Five of Pentacles
  69: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文：The card foretells material trouble above all, whether in the form illustrated—that is,
      //      destitution—or otherwise. For some cartomancists, it is a card of love and lovers—wife, husband,
      //      friend, mistress; also concordance, affinities. These alternatives cannot be harmonized.
      // 筛掉 foretells（预言式断言，§10.1-1）与 destitution（赤贫，§10.1-3）；
      // 筛掉「wife, husband, friend, mistress」——按婚姻与关系身份指认人物（§10.1-9 / §10.1-7）
      sourceQuote:
        "… For some cartomancists, it is a card of love and lovers … also concordance, affinities. These alternatives cannot be harmonized.",
      keywords: ["在外头", "被落下", "灯还亮着"],
      meaning:
        "星币五常被放在「一时没着落」的语境里谈。原文另有一说把它读成同行的人与情分——冷清和陪伴，在这张牌里是同时的。",
      byPosition: {
        past: "有过一段不太宽裕、也不太被照顾到的日子。",
        present: "可能有一处让你觉得站在门外，先别急着认下这个位置。",
        guidance: "门其实就在旁边——最难的一步常常是开口。",
      },
    },
    reversed: {
      // 原文：Disorder, chaos, ruin, discord, profligacy.
      // 筛掉 ruin —— §15 扫描点名的强制剔除词
      sourceQuote: "Disorder, chaos … discord, profligacy.",
      keywords: ["进屋了", "有人搭手", "开口问"],
      meaning:
        "逆位常被读成「冷的那一段在过去」。也可能是终于愿意开口求助了。",
      reversedLens:
        "求助最难的部分不是别人肯不肯，是自己肯不肯开口。开口的门槛通常比想象中低。可以先问谁？",
    },
  },

  // 星币六 Six of Pentacles
  70: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Presents, gifts, gratification; another account says attention, vigilance; now is the accepted time, present prosperity, etc.",
      keywords: ["给与受", "分配", "谁在秤上"],
      meaning:
        "星币六常被放在「一方给、一方接」的语境里谈。它关心的是这份给与受平不平衡，以及天平在谁手里。",
      byPosition: {
        past: "你曾经在某段关系里长期处在给或受的一头。",
        present: "可能有一处的给与受不太对等。",
        guidance: "值得留意的是给的方式——不带条件的给，和带着期待的给，感觉完全不同。",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Desire, cupidity, envy, jealousy, illusion.",
      keywords: ["不太平", "有附加条件", "说清楚"],
      meaning:
        "逆位常被读成「给与受的账没算清」。也可能是给出去的，附带了没说出口的期待。",
      reversedLens:
        "没说出口的期待最后都会变成失望，而且另一头并不知道自己欠了什么。把条件讲明白，对两边都轻松。你的那一句条件是什么？",
    },
  },

  // 星币七 Seven of Pentacles
  71: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "These are exceedingly contradictory; in the main, it is a card of money, business, barter; but one reading gives altercation, quarrel—and another innocence, ingenuity, purgation.",
      keywords: ["等着长", "中途盘点", "要不要换"],
      meaning:
        "星币七常被放在「种下去了，还没到收的时候」的语境里谈。它讲的是耐心，也讲的是要不要继续投入的判断。",
      byPosition: {
        past: "你曾经在一件事上投入很久，那段等待有它的意义。",
        present: "多半处在「已经花了不少工夫、还看不到结果」的位置。",
        guidance: "值得留意的是盘点的节奏——太早看结果会误判，太晚看又容易白等。",
      },
    },
    reversed: {
      // 原文：Cause for anxiety regarding money which it may be proposed to lend.
      // 全条是「借钱出去令人忧心」的理财断言，撞 §9.2-2 强制项（§10.1-3）与 §10.1-5，
      // 筛除后无词可留 → 留空并说明（§12：不静默留白）
      sourceQuote: "",
      sourceQuoteNote: "原文全数触线，已略",
      keywords: ["等得久", "想换方向", "先看一眼"],
      meaning:
        "本张逆位的原文整条是关于「把钱借出去」的断言，已按红线全数略去（见引用区说明）。中文阐释读作：投入和结果的关系，需要重新看一看。",
      reversedLens:
        "已经花掉的时间不会因为再等就变得更值，这是最难认的一点。换个方向，不等于之前都白做。如果今天重新开始，你还会选这一条吗？",
    },
  },

  // 星币八 Eight of Pentacles
  72: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Work, employment, commission, craftsmanship, skill in craft and business, perhaps in the preparatory stage.",
      keywords: ["练", "重复", "一点点变好"],
      meaning:
        "星币八常被放在「埋头把一件事做熟」的语境里谈。它不追求灵感，靠的是次数。",
      byPosition: {
        past: "有一段时间你就是反复地练，那批积累现在在起作用。",
        present: "这件事多半需要的是重复，而不是新点子。",
        guidance: "值得留意的是重复里有没有反馈——只是熟，和越做越好，中间隔着一次次校正。",
      },
    },
    reversed: {
      // 原文：Voided ambition, vanity, cupidity, exaction, usury. It may also signify the possession of skill,
      //      in the sense of the ingenious mind turned to cunning and intrigue.
      // 筛掉 usury（高利贷）——借贷与财务断言，撞 §10.1-3
      sourceQuote:
        "Voided ambition, vanity, cupidity, exaction … It may also signify the possession of skill, in the sense of the ingenious mind turned to cunning and intrigue.",
      keywords: ["练腻了", "只剩重复", "换个练法"],
      meaning:
        "逆位常被读成「重复失去了方向」。也可能是练得很勤，但没在往想去的地方走。",
      reversedLens:
        "熟练和进步不是同一条曲线，光靠次数会在某个点停住。加一次校正，比多练十次管用。上一回有人给你反馈，是什么时候？",
    },
  },

  // 星币九 Nine of Pentacles
  73: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Prudence, safety, success, accomplishment, certitude, discernment.",
      keywords: ["自足", "自己攒的", "享用"],
      meaning:
        "星币九常被放在「自己挣来的那份从容」的语境里谈。重点是自足：不靠谁，也过得好。",
      byPosition: {
        past: "你自己攒下过一些东西，那份底气是真的。",
        present: "你可能已经站在一个可以喘气的位置上，只是还没允许自己享用。",
        guidance: "攒着不动的东西，跟没有差别不大。有哪一样其实早就可以用上了？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Roguery, deception, voided project, bad faith.",
      keywords: ["没敢用", "靠别人", "先站稳自己"],
      meaning:
        "逆位常被读成「自足这件事还差一点」。可能是不敢用，也可能是重心暂时挪到了别人身上。",
      reversedLens:
        "自足不是不需要人，是知道自己那一部分立得住。立不住的时候，先补自己那一头。你自己的那一份，现在还剩多少？",
    },
  },

  // 星币十 Ten of Pentacles
  74: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Gain, riches; family matters, archives, extraction, the abode of a family.",
      keywords: ["长远", "一家人", "留得下的"],
      meaning:
        "星币十常被放在「不只这一代的事」的语境里谈：家、传承、能留下来的东西。它的时间尺度比别的牌长。",
      byPosition: {
        past: "家里或过往的某些安排一直在托着你，未必被你注意到。",
        present: "这件事可能牵着的不止你一个人。",
        guidance: "值得留意的是长远和眼前的比例——为很久以后打算的时候，别把当下全押进去。",
      },
    },
    reversed: {
      // 原文：Chance, fatality, loss, robbery, games of hazard; sometimes gift, dowry, pension.
      // 筛掉 fatality（死亡意象，§10.1-8）、robbery（劫掠，§10.1-5）、loss（破财断言，§10.1-3）；
      // 筛掉 games of hazard（赌博）——避免博彩框架（§10.1-3）
      sourceQuote: "Chance … sometimes gift, dowry, pension.",
      keywords: ["只顾眼前", "旧账", "慢慢理"],
      meaning:
        "逆位常被读成「长远那一头暂时顾不上」。也可能是有些旧的安排需要重新理一理。",
      reversedLens:
        "家里那些没说清的安排，往往拖很久也不会自己清楚。理旧账不必一次做完，从最小的一笔开始就行。哪一笔最小？",
    },
  },

  // 星币侍者 Page of Pentacles
  75: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Application, study, scholarship, reflection; another reading says news, messages and the bringer thereof; also rule, management.",
      keywords: ["学着做", "沉住气", "从小处起"],
      meaning:
        "星币侍者常被放在「刚开始学一门实在的东西」的语境里谈。进度不快，但走的每一步都落地。",
      byPosition: {
        past: "你曾经从很基础的地方学起，那段笨功夫现在有用。",
        present: "可能正在起步阶段，成果还很小。",
        guidance: "值得留意的是别用后期的标准要求现在——刚开始的时候，做完比做好重要。",
      },
    },
    reversed: {
      // 原文：Prodigality, dissipation, liberality. luxury; unfavourable news.
      //      （原文此处「liberality. luxury」的句点为原书排印，未代为订正；摘录止于 liberality）
      // 筛掉 unfavourable news —— 坏消息框架，撞 §10.1-5
      sourceQuote: "Prodigality, dissipation, liberality …",
      keywords: ["起步慢", "想跳级", "回到基础"],
      meaning:
        "逆位常被读成「基础这一段还没走完」。也可能是急着看结果，把打底的部分跳过去了。",
      reversedLens:
        "跳过去的基础，后面多半会以返工的形式回来。慢一点起步不丢人。哪一块是你其实跳过去了的？",
    },
  },

  // 星币骑士 Knight of Pentacles
  76: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Utility, serviceableness, interest, responsibility, rectitude—all on the normal and external plane.",
      keywords: ["稳步走", "可靠", "不花哨"],
      meaning:
        "星币骑士常被放在「走得慢但走得完」的语境里谈。它是四个骑士里最慢的一个，也是最少出岔子的一个。",
      byPosition: {
        past: "你靠一步一步的稳当，走完了一段别人看着很枯燥的路。",
        present: "这件事多半需要耐心，不需要巧劲。",
        guidance: "慢没关系，但要确认还在走。稳和停，现在是哪一种？",
      },
    },
    reversed: {
      // 原文逐字保留，无红线命中（首字母小写 "inertia" 为原书排印，照录不改）
      sourceQuote:
        "inertia, idleness, repose of that kind, stagnation; also placidity, discouragement, carelessness.",
      keywords: ["太慢", "有点闷", "换个节奏"],
      meaning:
        "逆位常被读成「稳变成了不动」。也可能是重复太久，人先没了劲。",
      reversedLens:
        "稳当的做法用久了会变成惯性，惯性和前进长得很像。查一查最近一次真正的进展是什么时候，比再撑一个月有用。那是什么时候？",
    },
  },

  // 星币王后 Queen of Pentacles
  77: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote: "Opulence, generosity, magnificence, security, liberty.",
      keywords: ["照顾得周到", "务实", "有余粮"],
      meaning:
        "星币王后常被放在「把日子过得妥当」的语境里谈：既顾得上人，也顾得上事，还留了余地。",
      byPosition: {
        past: "你曾经把一个不容易的局面照顾得井井有条。",
        present: "你可能是那个负责让事情正常运转的人。",
        guidance: "照顾别人的人，最常忘记给自己留一份。你的那一份留了吗？",
      },
    },
    reversed: {
      // 原文：Evil, suspicion, suspense, fear, mistrust.
      // 筛掉 Evil —— §15 扫描点名的强制剔除词
      sourceQuote: "… suspicion, suspense, fear, mistrust.",
      keywords: ["顾不过来", "都揽下了", "先留一份"],
      meaning:
        "逆位常被读成「照顾的半径超出了自己的补给」。事情还转得动，人已经空了。",
      reversedLens:
        "把所有事都接住的人，通常没有人接住他自己。留一份给自己不是自私，是让这件事还能接着转。今天那一份留了吗？",
    },
  },

  // 星币国王 King of Pentacles
  78: {
    source: SOURCE_PKT,
    placeholder: false,
    upright: {
      // 原文逐字保留，无红线命中
      sourceQuote:
        "Valour, realizing intelligence, business and normal intellectual aptitude, sometimes mathematical gifts and attainments of this kind; success in these paths.",
      keywords: ["稳固", "会经营", "撑得住"],
      meaning:
        "星币国王常被放在「把事情做成、也守得住」的语境里谈：不炫技，靠的是长期的判断和耐性。",
      byPosition: {
        past: "有过一段你把一件事经营到稳的日子，那套办法沿用到了现在。",
        present: "你可能是那个被指望能兜底的人。",
        guidance: "值得留意的是兜底也有限度——把范围说清楚，比一直硬撑更可靠。",
      },
    },
    reversed: {
      // 原文：Vice, weakness, ugliness, perversity, corruption, peril.
      // 筛掉 ugliness —— 以相貌评判人物，撞 §10.1-9；筛掉 peril（危险）——恐吓，撞 §10.1-5。
      // ⚠️ 取证卡片「坑 §9」：PG #43548 此条缺 ugliness / corruption，以 Wikisource（Rider 版）为准
      sourceQuote: "Vice, weakness … perversity, corruption …",
      keywords: ["抓太死", "只看数字", "松一档"],
      meaning:
        "逆位常被读成「经营变成了控制」。也可能是标准全放在了看得见的那部分上。",
      reversedLens:
        "守得住的人最容易把「不能出错」当成唯一标准，久了会把弹性挤没。稳当和僵住之间只差一点余地。留一点余地会怎么样？",
    },
  },
};

/**
 * 取某张牌的释义（1–78）。
 * 78 张已补齐，占位兜底（原 `PLACEHOLDER_READINGS`）随之删除 —— 缺任何一张都不再静默降级为
 * 「示例（占位）」，而是直接编译报错，这正是验收 §15「零占位」想要的效果。
 */
export function readingsFor(id: number): TarotCardReadings {
  return READINGS[id];
}

// ───────────────────────── 综合解读模板（PRD §9.3）─────────────────────────

/** 综合解读按「数量」选模板的四个档位：0/1/2/3。 */
export type SummaryCount = 0 | 1 | 2 | 3;

/** 花色分布档位：集中在某一花色 / 分散 / 没有小阿卡纳。 */
export type SuitBucket = Suit | "mixed" | "none";

/**
 * 综合解读的模板文案。引擎只负责按规则挑句子（`lib/tarot.ts`），文案全在这里。
 * 这一段**全部是本项目编写**，与公版原文无关，不挂 `source`。
 *
 * - 模板里可用 `{cards}` 插入本句涉及的牌名，除此之外不留任何占位符（PRD §9.3）。
 * - 每条自带句末标点，引擎按顺序直接拼接。
 * - **留空字符串 = 这一档不出这句话**（例如三张全是大阿卡纳时不再单说花色）。
 * - 逆位这一维只做中性描述，全正与全逆的情绪基调必须对称（PRD §9.3 / §10.2-5）。
 */
export interface SummaryTemplates {
  /** 按大阿卡纳数量。 */
  major: Record<SummaryCount, string>;
  /** 按花色分布。 */
  suit: Record<SuitBucket, string>;
  /** 按宫廷牌数量。 */
  court: Record<SummaryCount, string>;
  /** 按逆位数量。 */
  reversed: Record<SummaryCount, string>;
  /** 固定收尾：把主动权交回用户（PRD §9.3）。 */
  closing: string;
}

/**
 * true = 综合解读模板尚未人工定稿，页面显示「示例（占位）」（PRD §9.2-9）。
 * **已定稿，故为 false** —— 四组模板与 `closing` 均为人工定稿文案，正文不含任何占位前缀。
 * ⚠️ 这个标志位与正文必须同步：翻成 false 之前，正文里不能还留着「示例（占位）」。
 */
export const SUMMARY_PLACEHOLDER = false;

export const SUMMARY_TEMPLATES: SummaryTemplates = {
  /**
   * 大阿卡纳数量这一维**只说尺度，不说轻重**（PRD §9.3）：
   * 三张全是大牌不等于事情更严重、更要紧，只是这组牌谈的范围不一样。
   * 因此 0 档不写成「缺少大牌」，3 档末句明确把「尺度」和「分量」拆开。
   * ⚠️ 句首刻意避开「其中一张是…」——`court` 那一档就是这个开头，两句常常前后脚出现。
   */
  major: {
    0: "牌面整体贴着日常走，说的是眼前具体的事。",
    1: "大阿卡纳只有一张（{cards}），它谈的范围比另外两张宽一点。",
    2: "大阿卡纳有两张（{cards}），整体谈的范围比日常琐事宽一些。",
    3: "三张都是大阿卡纳（{cards}），整组牌更像在说一个阶段，而不是某一件具体的事。尺度不一样，不等于分量更重。",
  },
  suit: {
    wands: "小阿卡纳集中在权杖（{cards}），话题偏向行动与投入。",
    cups: "小阿卡纳集中在圣杯（{cards}），话题偏向感受与关系。",
    swords: "小阿卡纳集中在宝剑（{cards}），话题偏向想法与沟通。",
    pentacles: "小阿卡纳集中在星币（{cards}），话题偏向手头的资源与安排。",
    mixed: "小阿卡纳分散在不同花色（{cards}），几件事各说各的，没有明显集中在一处。",
    // 三张全是大阿卡纳时不再单说花色（上一句已经说明）
    none: "",
  },
  court: {
    // 没有宫廷牌就不出这句
    0: "",
    1: "其中一张是宫廷牌（{cards}），可以把它读成一种态度或相处方式，而不是某个具体的人。",
    2: "其中两张是宫廷牌（{cards}），人与人之间怎么相处，在这次的牌里占的位置不小。",
    3: "三张都是宫廷牌（{cards}），整组牌几乎都在谈相处的方式。",
  },
  reversed: {
    // 0 档与 3 档是对称的一对（全正 / 全逆），情绪基调必须相当，不得写成吉凶（PRD §9.3 / §10.2-5）。
    // 1 / 2 档句首由「其中一张是…」改为「有一张是…」：`court` 用的正是「其中一张是宫廷牌…」，
    // 两句会前后脚出现，同头读着像复读（改的只是句首，语义与对称性未动）。
    0: "三张都是正位，整体比较外放，牌面更多在说往外走的那一面。",
    1: "有一张是逆位（{cards}），这一张换个角度看会更清楚。",
    2: "有两张是逆位（{cards}），这两处更适合往里看看，而不是急着往外推。",
    3: "三张都是逆位，整体偏向内看——这次的牌更想让你往回看一看，而不是往前赶。",
  },
  closing: "牌只提供一个视角，怎么选还是你说了算。",
};
