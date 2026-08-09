# tarot-rws-meanings（韦特体系 78 张牌正逆位释义 · 公版原文）

- **置信度**：**部分验证**
  - 公版状态 / 覆盖率 / 文本形态计数 = **已验证**（全文机读 + 三源交叉核对，非抽样）
  - 中文通行译名分歧 = **部分验证**（仅取到 zh.wikipedia 一个二手源，未见权威标准）
  - 其他公版逆位源 = **未验证 —— 待补**
- **类型**：第三方数据集（公有领域书籍全文，可机读纯文本）
- **版本 / 快照**：A. E. Waite, *The Pictorial Key to the Tarot*（下称 PKT）
  - 初版：William Rider & Son, London。**该书 1922 年重印本版权页原文：「First Published … 1910 / Reprinted … 1922」**〔Wikisource 扫描件 · 官方仓库产物级〕
  - en.wikipedia 表述为「released 1910, dated 1911」（初版书名页印 1911）→ **1910 与 1911 两种年份都在流通，不是笔误**
  - 本卡片所有计数取自 **1922 Rider 重印本扫描件的 Wikisource 校订文本**（Validation date: May 2026，Progress=T 已校订）
- **最后核对**：2026-08-09

## 来源与获取方式

| 源 | 内容 | 等级 | 抓取日期 |
|---|---|---|---|
| **主源** en.wikisource.org `The Pictorial Key to the Tarot/Part 3` | 78 张牌全部释义所在章节；由 Commons 扫描件 `File:The Pictorial Key to the Tarot.pdf`（1922 Rider 重印本，self-scanned）逐页校订 | 原始典籍转写（有页扫背书） | 2026-08-09 |
| **交叉源** Project Gutenberg #43548 | *The Illustrated Key to the Tarot*（L. W. De Laurence, 1918，芝加哥版，公认为 PKT 的翻印）纯文本，`pg43548.txt` | 原始典籍转写 | 2026-08-09 |
| **交叉源** archive.org `A.EWaiteThePictorialKeyToTheTarot` | sacred-texts.com 版面的 2002 年抓取 + OCR | 二手资料 | 2026-08-09 |

取法（可复现）：
```bash
curl -sSL "https://en.wikisource.org/w/api.php?action=parse&page=The%20Pictorial%20Key%20to%20the%20Tarot%2FPart%203&prop=text&formatversion=2&format=json"
curl -sSL "https://www.gutenberg.org/cache/epub/43548/pg43548.txt"
```
⚠️ **sacred-texts.com 直连不可用**：`https://sacred-texts.com/tarot/pkt/index.htm` 与 `www.` 变体均返回 **403 + Cloudflare「Just a moment...」**（curl 与 WebFetch 都被挡，2026-08-09 实测）。别把它写进取数脚本。
⚠️ **Project Gutenberg 没有 Waite 原书**：站内检索 `pictorial key to the tarot` / `waite tarot` 均返回 **"No records found"**；PG 只有 De Laurence 翻印本（#43548）。

## 授权与许可（CLAUDE.md §0-5）

- **许可**：**公有领域**。依据：①作者 Arthur Edward Waite 生 1857-10-02、**卒 1942-05-19**〔Wikidata Q553124〕→ life+70 法域（英/欧）自 2013-01-01 起过期；②首版 1910/1911 → 美国「**Published before 1931: None. In the public domain due to copyright expiration**」〔Cornell 版权期限表〕。Commons 扫描件标 `{{PD-old-70-expired}}`，Wikisource 标 `{{PD-US}}`，PG #43548 为 PD。
- **可否商用**：**可**（PD 原文本身无商用限制）。
- **署名要求**：法律上无。**但**若直接引用原文，建议按学术惯例标 "A. E. Waite, *The Pictorial Key to the Tarot*, 1910"。
- ⚠️ **两条非版权风险**：① PG **版头/版尾的 "Project Gutenberg" 商标条款**适用于 PG 版本 —— 若使用 #43548 必须剥掉版头版尾只取 PD 正文；② #43548 的作者署名是 **De Laurence（翻印者）**，用它当出处会把抄袭者写成作者，**出处应标 Waite**。
- 本卡片**不涉及牌面插图授权**（PRD §17-d 本版不引入插图）。

## 隐私分级（CLAUDE.md §0-3）

- **是否含 PII**：**不含**（19 世纪末 20 世纪初出版物正文）。
- **处理要求**：无特殊要求；可打包进前端 bundle。

## 书内结构（取数必读）

PKT 的**牌面描述**与**占卜释义**分在两处，不在同一节：

| 位置 | 内容 | 条目数 |
|---|---|---|
| Part II §2 `THE TRUMPS MAJOR AND THEIR INNER SYMBOLISM` | 22 张大牌的**图像象征描述**，**无**任何占卜释义 | 22 |
| Part III §2 `THE LESSER ARCANA` | 56 张小牌：描述 + `Divinatory Meanings:` + `Reversed:` | 56 |
| Part III §3 `THE GREATER ARCANA AND THEIR DIVINATORY MEANINGS` | 22 张大牌：`N. The X.—<正位> Reversed: <逆位>` | 22 |
| Part III §4 `SOME ADDITIONAL MEANINGS OF THE LESSER ARCANA` | 56 张小牌的**追加**释义（与主条目不同的另一套） | 56 |
| Part III §5 `THE RECURRENCE OF CARDS IN DEALING` | 同点数多张的组合义，分 `In the Natural Position` / `Reversed` 两张表 | — |

## 覆盖率（逐张核对，非抽样）

| 项 | 结果 |
|---|---|
| 正位（`Divinatory Meanings` / §3 破折号后） | **78 / 78** |
| 逆位（`Reversed`，主条目 §2+§3） | **77 / 78** —— **唯一缺失：圣杯二 Two of Cups** |
| 圣杯二的逆位 | §4 追加条目有：`Two.—… Reversed: Passion.`（**一个词**） |
| **合并 §2/§3/§4 后的逆位覆盖** | **78 / 78** |
| §4 追加条目自身的逆位 | 50 / 56（缺权杖 10/9/8/7/3/2 六张） |

## ⚠️ 文本形态统计（本卡片头号结论）

分类规则（明示，可复算）：**A = 纯词表**（整条无独立限定动词从句，只是逗号/分号分隔的词与名词短语）；**B = 词表 + 一句附注**；**C = 成段叙述**。机器先算词数与句读，再逐条人工判定 78×2 条。

| | n | A 纯词表 | B 词表+1句 | C 成段 | 词数中位数 | ≤10 词 |
|---|---|---|---|---|---|---|
| **逆位 REVERSED** | 77 | **64（83%）** | 12 | **1** | **7** | **51 / 77（66%）** |
| **正位 UPRIGHT** | 78 | 50（64%） | 11 | 17 | **18** | 17 / 78（22%） |

分组看，**逆位在大牌和小牌上一样贫瘠，而正位的小牌明显更丰满**：

| | 正位 A/B/C（中位词数） | 逆位 A/B/C（中位词数） |
|---|---|---|
| 大阿卡纳 22 | 20 / 2 / 0（10 词） | 21 / 1 / 0（7 词） |
| 小阿卡纳 56 | 30 / 9 / 17（**27 词**） | 43 / 11 / 1（**7 词**） |

**唯一一条成段的逆位**是钱币 Ace，且其「成段」部分是对正位的补充说明，不是独立逆位叙述。
计入 §4 的圣杯二（`Passion.`）后：逆位 78 张 = A 65 / B 12 / C 1。

## 样本数据（真实原文，逐字摘录）

正位 → 逆位 对照，覆盖大牌与四花色：

```
Zero. The Fool.—Folly, mania, extravagance, intoxication, delirium, frenzy, bewrayment.
      Reversed: Negligence, absence, distribution, carelessness, apathy, nullity, vanity.      [A · 7 词]

19. The Sun.—Material happiness, fortunate marriage, contentment.
      Reversed: The same in a lesser sense.                                                     [A · 6 词 · 纯回指]

16. The Tower.—Misery, distress, indigence, adversity, calamity, disgrace, deception, ruin.
      It is a card in particular of unforeseen catastrophe.
      Reversed: According to one account, the same in a lesser degree; also oppression,
      imprisonment, tyranny.                                                                    [A · 14 词]

WANDS Nine — Divinatory Meanings: The card signifies strength in opposition. If attacked, the
      person will meet an onslaught boldly; and his build shews that he may prove a formidable
      antagonist. With this main significance there are all its possible adjuncts—delay,
      suspension, adjournment.                                                        [正位 C · 39 词]
      Reversed: Obstacles, adversity, calamity.                                       [逆位 A · 3 词]

CUPS Two — Divinatory Meanings: Love, passion, friendship, affinity, union, concord, sympathy,
      the interrelation of the sexes, …
      （§2 内**没有** Reversed；§4：Two.—… Reversed: Passion.）                        [逆位 A · 1 词]

SWORDS Five — Divinatory Meanings: Degradation, destruction, revocation, infamy, dishonour,
      loss, with the variants and analogues of these.
      Reversed: The same; burial and obsequies.                                       [逆位 A · 5 词 · 回指]

PENTACLES Four — Divinatory Meanings: The surety of possessions, cleaving to that which one has,
      gift, legacy, inheritance.
      Reversed; Suspense, delay, opposition.                                          [逆位 A · 3 词]

WANDS Queen — Reversed: Good, economical, obliging, serviceable. Signifies also—but in certain
      positions and in the neighbourhood of other cards tending in such directions—opposition,
      jealousy, even deceit and infidelity.                                           [逆位 B · 27 词]
```

## 已知质量问题与坑

1. **钱币四的逆位用的是分号**：原文作 `Reversed; Suspense, delay, opposition.` —— 解析脚本正则须写 `Reversed\s*[:;]`，否则会漏掉这张，误判成「缺逆位」。
2. **钱币 Ace 的逆位段直接接章节收尾议论**（"Such are the intimations of the Lesser Arcana…"），按段落切会多切进 ~160 词无关文字，须在该句处截断。
3. **多张逆位是「回指」而非独立内容**：太阳「The same in a lesser sense.」、宝剑五「The same; burial and obsequies.」、宝剑 Ace「The same, but the results are disastrous; …」、塔「the same in a lesser degree」。**脱离正位单独渲染会读不通。**
4. **Waite 的牌名与今日 RWS 通行名不同**：VIII = **Fortitude**（非 Strength）、XX = **The Last Judgment**（非 Judgement）；愚者编号写作 **Zero** 且**排在 20 与 21 之间**，不在开头。
5. **§2 主条目与 §4 追加条目会互相矛盾**（Waite 自述 §4 由他人供稿、"have little connexion with the pictorial designs"）。例：宝剑四主条目逆位「Wise administration…」，§4 逆位「A certain success following wise administration.」—— **须先定死用哪一套，不可混取。**
6. **原文释义与本项目红线大面积冲突**（PRD §10.1/§10.2）：正逆两侧都密集出现 `disaster` `calamity` `evil fatality` `hidden enemies, danger, terror` `imprisonment` `mortality` `失败/破财/疾病/诉讼` 类词，且**大量按性别、发色、肤色断言人物**（"A dark woman, countrywoman…"），另有 `Death.—End, mortality…` 直陈死亡。**不可直译上线。**
7. **Waite 本人否定这套占卜义**：§3 末尾原文 —— "The allocation of a fortune-telling aspect to these cards is the story of a prolonged impertinence."（把算命属性安到这些牌上，是一场旷日持久的僭妄。）引用时不宜宣称「韦特权威解读」。
8. **原文没有 50% 逆位的说法**：全书唯一的逆位产生指令在 §8 —— "Shuffle the entire pack and **turn some of the cards round**, so as to invert their tops."（**"some"，未给比例**）；§7 凯尔特十字法**完全没提**逆位。PRD §6.3 的 50/50 是产品决定，**不能标"依韦特"**。
9. **交叉源 PG #43548 有删节与美式拼法**：78 张里 76/77 条逆位与主源**逐字一致**（差异仅 `ardour/ardor`、`shews/shows`）；**唯一实质差异 = 钱币国王** —— 主源「Vice, weakness, **ugliness**, perversity, **corruption**, peril.」，PG 版「Vice, weakness, perversity, peril.」。**以 Wikisource（Rider 版）为准。**

## 中文通行译名分歧（**部分验证** —— 仅一个二手源）

**未找到任何权威中文标准**（无国标、无公认统一译名表）。以下仅为 zh.wikipedia 内部可见的分歧，**不构成推荐**：

| 英文 | 查到的中文写法 | 依据 |
|---|---|---|
| Pentacles / Coins | **錢幣** · **五角星** · **金幣** · **圓盤**（托特系） | zh.wp「錢幣 (塔羅牌)」：「又稱為'''五角星牌組'''」「在拉丁紙牌中，金幣牌組…」「在托特之書中…'''圓盤牌組'''」 |
| Page | **侍從** · **隨從** | 同站内**自相矛盾**：Template:塔罗牌 用「侍從」，「錢幣 (塔羅牌)」正文用「隨從」 |
| Queen | **皇后** · **王后** | Template 用「皇后」，「錢幣 (塔羅牌)」正文用「王后」 |
| II The High Priestess | **女祭司**（早期作 **女教皇**） | zh.wp「韋特塔羅牌」：「'女教皇'變成了'女祭司'」 |
| Waite（人名） | **韋特** · **偉特** · **伟特** | 条目名「韋特塔羅牌」，正文「莱德·伟特塔罗牌」，书名条目用「愛德華·偉特」 |
| 书名 | **《塔羅牌的圖畫鑰匙》** | zh.wp 同名条目 |
| 花色（其余三个） | 權杖 / 聖杯 / 寶劍（**未见分歧**） | Template:塔罗牌 |

⚠️ **实际会咬手的一处**：III The Empress 与宫廷牌 Queen 在 zh.wp 里**都叫「皇后」**（`皇后 (塔羅牌)` vs `聖杯皇后`）。若两者同屏出现必须消歧。
⚠️ Judgement 的中文（審判 / 審判之日）**只查到「審判」一种**，未找到「審判之日」的可引来源 —— 团队若认为存在该译法，需另行取证。
⚠️ 未能查证：台湾/大陆**出版译本**（如各家中译 PKT）的用词 —— 需要纸质书或有授权的电子书，本次不可得。

## 其他公版逆位源（**未验证 —— 逐条说明**）

| 候选 | 结论 |
|---|---|
| **Papus《Tarot of the Bohemians》** 1896 英译（archive.org `tarotofbohemians00papu`，全文已下载核对） | ❌ **不可用**：全书 `Reversed` / `Divinatory` 出现 **0 次**，无逐牌正逆释义表 |
| **S. L. MacGregor Mathers《The Tarot》(1888)** | ❓ **未找到全文**。检索无结果：archive.org `"occult signification" tarot`、`tarot AND "method of play"`、`creator:("Mathers, S. L. MacGregor")`；Gutenberg `mathers tarot`；Wikisource `MacGregor Mathers Tarot`。**未取到 → 不写结论** |
| **Golden Dawn "Book T"**（archive.org `the-book-t-the-tarot`、`mathers-and-felkin-golden-dawn-book-t-the-tarot-1888`） | ❌ **不建议采用**：均为个人上传的 `opensource` 条目，**无 `licenseurl`、无 `rights`、无出版信息、无 `date`**，版权与文本来源均无法核实 |
| **Etteilla 系公版** | ❓ 只检到法文 `1900legrandetteilla`（Julia Orsini/Blocquel），**未核对内容、未核对版权** |
| **De Laurence 1918（PG #43548）** | ⚠️ 可作**机读便利副本**（见「授权」段两条风险），内容非独立来源 —— 它就是 PKT 的翻印 |

## 在本项目中的消费方

**未接入**。计划消费方：`frontend/src/data/tarot.ts`（PRD §9.1 `TarotCard.upright/reversed` + `source`）。

## 未解决问题

- [ ] #1 Mathers 1888《The Tarot》全文与版权状态 —— 需要：可访问的扫描件或馆藏链接
- [ ] #2 中文译名：无权威标准，出版译本用词未取到 —— 需要：Rick 指定一本参考译本，或直接拍板一套内部译名表
- [ ] #3 §2 主条目 vs §4 追加条目**用哪一套**（或如何合并）未定 —— 需要：Rick 决策，属内容口径
- [ ] #4 Etteilla 系公版文本未核对内容与版权
- [ ] #5 sacred-texts.com 被 Cloudflare 挡，若日后需要该版式需换取法

## 来源清单

| # | URL 或本地路径 | 抓取日期 | 来源等级 |
|---|----------------|----------|----------|
| 1 | <https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot/Part_3> | 2026-08-09 | 原始典籍转写（页扫背书） |
| 2 | <https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot/Part_2> | 2026-08-09 | 原始典籍转写 |
| 3 | <https://en.wikisource.org/wiki/Index:The_Pictorial_Key_to_the_Tarot.pdf> | 2026-08-09 | 原始典籍转写（版本信息） |
| 4 | <https://commons.wikimedia.org/wiki/File:The_Pictorial_Key_to_the_Tarot.pdf> | 2026-08-09 | 扫描件元数据（PD-old-70-expired） |
| 5 | <https://www.gutenberg.org/ebooks/43548> · <https://www.gutenberg.org/cache/epub/43548/pg43548.txt> | 2026-08-09 | 原始典籍转写（交叉核对） |
| 6 | <https://archive.org/details/A.EWaiteThePictorialKeyToTheTarot> | 2026-08-09 | 二手资料（sacred-texts OCR 抓取） |
| 7 | <https://www.wikidata.org/wiki/Q553124>（Waite 生卒 1857-10-02 / 1942-05-19） | 2026-08-09 | 二手资料（权威档案聚合） |
| 8 | <https://guides.library.cornell.edu/copyright/publicdomain> | 2026-08-09 | 二手资料（权威机构版权期限表） |
| 9 | <https://en.wikipedia.org/wiki/The_Pictorial_Key_to_the_Tarot>（"released 1910, dated 1911"） | 2026-08-09 | 二手资料 |
| 10 | <https://zh.wikipedia.org/wiki/Template:塔罗牌> · `/wiki/錢幣_(塔羅牌)` · `/wiki/韋特塔羅牌` · `/wiki/塔羅牌的圖畫鑰匙` | 2026-08-09 | 二手资料 |
| 11 | <https://archive.org/details/tarotofbohemians00papu>（Papus 1896，已核对无逆位） | 2026-08-09 | 原始典籍转写 |
| 12 | <https://archive.org/metadata/the-book-t-the-tarot>（无 license/rights 字段） | 2026-08-09 | 未验证（个人上传） |

⚠️ 模型自身记忆**不算来源**，未写入本表。上表每条均为本次真实抓取。
