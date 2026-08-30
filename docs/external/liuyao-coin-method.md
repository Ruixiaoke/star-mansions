# liuyao-coin-method（銅錢起卦頁的外部技術面：npm 生態 + 可機讀卦象數據源）

> **本版產品 = 三枚銅錢 × 六擲 → 六十四卦（本卦 + 之卦）**，不做納甲裝卦。
> 傳統規則、出處與紅線判斷見 [`liuyao-tradition.md`](./liuyao-tradition.md)。
> ⚠️ 早期評估過的「三擲得一經卦」方案已否決，否決依據見 `liuyao-tradition.md` §11。

- **置信度**：**部分驗證**
  - npm 包元數據（版本 / 發佈日 / 許可證 / 下載量 / 依賴 / 是否帶類型）= **已驗證**（npm registry 官方 API 實查）
  - `lunar-javascript` 無起卦能力 = **已驗證**（本地 `node_modules` 實跑，真實輸出見下）
  - 64 卦數據源可用性與完整性 = **已驗證**（64/64 全量抓取 + 三重機器核對）
  - 各候選包的**內部算法正確性 / 數據質量** = **未驗證**（僅讀 README 與元數據，**未逐包跑測試、未核對其 64 卦表**）
- **類型**：依賴調研 + 數據源
- **最後核對**：2026-08-30

本卡片只管「代碼層面拿什麼」。

---

## 1. 結論先行

1. **`lunar-javascript`（本倉已依賴）完全不含起卦 / 卦象能力** —— 且它的 `getLiuYao()` 是**日本六曜**，不是六爻。**這是本卡片頭號坑。**
2. **npm 上沒有一個「可放心引入」的易經庫**：候選全部週下載 < 250，多數為 2026 年新發、單維護者、無測試背書；`iching-shifa` 還是 **GPL-3.0-or-later**（傳染性許可）。**且沒有一個提供中文的八經卦《說卦》屬性表**。
3. **推薦：不引新依賴，自建 64 卦表 + 8 經卦表** —— 64 卦數據可從 zh.wikisource《周易》全量取得
   （公版 + CC BY-SA，本次已做完整性與一致性核對，見 §4），八卦屬性取自《說卦傳》（見 §3.6）；
   核心算法（`爻數 = 6 + 陽面數` → 內外卦 → 查表 → 之卦）約幾十行。
   引庫的收益抵不上供應鏈與許可風險（`CLAUDE.md §1`），且**沒有一個候選包提供中文的《說卦》屬性表**。**最終取捨由 Rick 定。**

---

## 2. ⚠️ 頭號坑：`lunar-javascript.getLiuYao()` **不是六爻**

本地實跑（`node`，`node_modules/lunar-javascript@1.7.7`，2026-08-30）：

```
$ node probe-lunar.js
version pkg: 1.7.7
getLiuYao() => "赤口"
getXiu()    => "虚"
total methods: 219
methods matching /gua|yao|hex|gram|64/i: [ 'getLiuYao' ]
```

- `LIU_YAO` 在 `lunar.js` 裡的 i18n 值是 **`先胜 / 先负 / 友引 / 佛灭 / 大安 / 赤口`** —— 這是**日本曆法的「六曜」（Rokuyō）**，
  與《周易》六爻**毫無關係**。〔`node_modules/lunar-javascript/lunar.js:3918`、`:7489-7494`、`:1917` · 本地產物〕
- 全庫 **`卦` 字出現 0 次、`爻` 字出現 0 次**（`grep -o` 實測）；`Lunar` 實例 219 個方法裡，
  名字沾 gua/yao/hex 的**只有這個假朋友**。
- 結論：**六爻頁不能靠 `lunar-javascript` 起卦**。它在本項目的職責仍只是農曆換算（`CLAUDE.md §3`）。
  ⚠️ 若日後要做**納甲裝卦**（需日辰月建干支），才會用到它的 `getDayInGanZhi()` 等 —— **那些方法本次未驗證**。

---

## 3. npm 生態調研（registry 官方 API 實查，2026-08-30）

| 包 | 版本 | 最新發佈 | 週下載 | 許可證 | TS 類型 | 運行依賴 | 備註 |
|---|---|---|---|---|---|---|---|
| `i-ching` | 0.3.5 | **2017-10-23** | 70 | MIT | ❌ 無 | `lodash`, `seedrandom` | 英文體系（trigram/hexagram 元數據 + `ask()`）；**8 年未更新** |
| `liuyao` | 0.5.1 | 2026-08-22 | **225** | MIT | ✅ | `solarlunar` | README 自述數據「sourced from works such as **Zeng Shan Bu Yi**（增刪卜易）」；含 `Hexagram.fromQuaternary('111222')`、`toChanged()`、六神表；**首發 2026-05，單維護者** |
| `iching-shifa` | 1.8.0 | 2026-07-01 | 44 | ⚠️ **GPL-3.0-or-later** | ✅ | `tyme4ts` | 功能最全（大衍/略筮/納甲/世應/六親/六獸/旬空/神煞、《高島易斷》卦例）；**許可證有傳染性，閉源產品慎用** |
| `iching-divination` | 1.0.0 | 2025-10-06 | 65 | MIT | ✅ | 無 | 明確「銅錢法」；`performDivination()` / `performManualDivination([6\|7\|8\|9]×6)`；**只發過 1 個版本** |
| `yarrow-divination` | 1.1.0 | 2026-01-15 | 11 | MIT | ✅ | 無 | **大衍蓍草法**（非擲錢）；自述含 64 卦全庫（卦辭/爻辭）；**repository 欄位為空** |
| `@taoracle/najia` | 0.1.0 | 2026-07-27 | 18 | MIT | ✅ | `tyme4ts` | 六爻納甲排盤；**只有 1 個版本，發佈當天** |
| `@soul-atelier/core` | 0.5.0 | 2026-07-19 | 1752 | MIT | ❌ | 無 | 「干支/五行/八卦六十四卦/洛書」原語；下載量最高但**與其他指標不成比例，未核實** |
| `hexagram-encode` / `iching.js` / `iching` / `generate-gua` | — | 2022 及更早 | 5–10 | MIT/ISC | ❌ | — | 玩具級 / 用途不符 |

**取數方式（可復現）**：
```bash
curl -s "https://registry.npmjs.org/-/v1/search?text=iching&size=12"
curl -s "https://registry.npmjs.org/<pkg>"                          # 版本 / 許可證 / 依賴 / 類型
curl -s "https://api.npmjs.org/downloads/point/last-week/<pkg>"     # 週下載量
```
〔<https://registry.npmjs.org> · <https://api.npmjs.org> · 官方 API · 抓取 2026-08-30〕

### 3.1 若要引入，卡片必答三問（`CLAUDE.md §1`）

- **為什麼需要它**：只為省一張 64 卦靜態表 + 十幾行位運算。**收益很小。**
- **有沒有更輕的替代**：有 —— **自建 `frontend/src/data/liuyao-gua.ts`**（64 條，數據來源見 §4），
  與現有 `frontend/src/data/tarot-deck.ts` 的做法一致（本項目塔羅牌也是自建數據，未引庫）。
- **許可證**：`iching-shifa` = **GPL-3.0-or-later（不建議）**；其餘候選 MIT/ISC。

### 3.2 ⚠️ 未驗證項（不得當作採納依據）

- **沒有跑過任何候選包**，未核對其 64 卦表 / 卦序 / 之卦計算是否正確。
- **未審計代碼**。多個包是 2026 年新發、單維護者、無測試徽章；週下載 < 250 意味著**社區驗證極弱**。
- `@soul-atelier/core` 的 1752 週下載與其它指標（5 個版本、2026-07 首發）**不匹配**，本次未查明原因。

---

## 3.5 ⚠️ 候選包都不提供中文八卦屬性（六爻版也要用經卦：內卦 / 外卦）

| 需求欄位 | npm 上有現成的嗎 |
|---|---|
| 三爻陰陽編碼 / 先天序 / Unicode 符號 | ✅ `i-ching` 的 `trigram(n)` 有 `binary` `lines` `character` `number`〔README · 官方倉庫產物〕 |
| 中文卦名 / 自然象 | ✅ `i-ching` 有 `chineseName`（如 `兌`）`chineseImage`（如 `澤`）〔同上〕 |
| **《說卦》卦德 / 動物 / 身體 / 家人 / 後天方位** | ❌ **未見任何包提供**。`i-ching` 只有英文 `attribute`（`joyful`）`images`（`swamp, lake`）`familyRelationship`（`third daughter`） |
| **五行（金木水火土）** | ❌ `i-ching` 無。`@soul-atelier/core` 自述有「八卦/六十四卦」原語，**未驗證** |
| **問事類目對照（求名/求利/出行…）** | ❌ **未見任何包提供** |

⚠️ **`i-ching` 的英文名稱有版權疑問**：它的 `names`（`The Joyous`、`Great Possessing`）與卦名譯法屬 Wilhelm–Baynes 系譯名。
**本次未查證 Wilhelm–Baynes 譯本的版權狀態** —— 本項目是中文產品，建議**完全不用英文名**，需要英文時只用 **Unicode 官方字符名**（`TRIGRAM FOR LAKE` 等，見 §4.3）。

**結論**：`i-ching` 能省的那部分（位編碼 + Unicode 符號）本來就是十幾行；**真正的內容（中文屬性表 + 64 卦原文）必須自建**，
數據源見 §3.6 與 §4，逐欄出處見 [`liuyao-tradition.md`](./liuyao-tradition.md) §9.1。**引庫沒有淨收益。**

---

## 3.6 八經卦數據源（寫白話疏解的素材 · 已驗證）

| 源 | 提供什麼 | 授權 | 取法 |
|---|---|---|---|
| **zh.wikisource `周易/說卦`** | 卦德（第七章）· 動物（第八）· 身體（第九）· 家人（第十）· 取象（第十一）· **後天方位（第五章，只給 6 個卦）** | 公版 + CC BY-SA 4.0 | `action=parse&page=周易/說卦` |
| **《古今圖書集成》卷544** | 八卦象例（☰–☷ 帶 Unicode 符號）· 八卦次序（先天序 1–8）· 八宮所屬（五行） | 公版 | 同上 |
| **Unicode UCD** | `U+2630–2637` 八卦符號 + 官方英文名 | 碼位無版權 | `UnicodeData.txt` |
| **《梅花易數》卷一** | 八卦 × 26–27 個**問事類目**對照表 + `方道`（補齊《說卦》缺的坤/兌方位） | 公版（頁面 header 掛 `PD-old`）| `action=parse&page=梅花易數/卷一` |

⚠️ **《梅花易數》權威等級低於《易傳》**（託名邵雍、不入四庫）—— 引用時措辭必須區分，詳見 `liuyao-tradition.md` §6.2。
⚠️ **該書「謀望」印作「謀旺」**（訛字），解析時要 alias。
⚠️ **《說卦》沒有給坤、兌的方位**，用《梅花易數》「方道」欄補 —— **來源等級不同，數據模型裡建議分欄記來源**；
欄位命名用 `houtianDirection`，**先天方位本次未取到完整原文，不要填**（`liuyao-tradition.md` §9.2）。

**★《說卦》紅線優勢（實測）**：全文 `凶` 0 次、`厲` 0 次、`咎` 0 次、`吉` 0 次 —— 純取象、不作吉凶判斷。
64 卦爻辭「凶」58 次涉 38 卦，但**白話疏解用《說卦》語彙來寫**，就有一套既有出處又天然中性的詞庫。
詳見 [`liuyao-tradition.md`](./liuyao-tradition.md) §5。

---

## 4. 64 卦表怎麼取（本版主力數據源 · 已驗證）

### 4.1 主源 · zh.wikisource《周易》

- **獲取**：`周易/<卦名>` 共 64 頁，MediaWiki API：
  ```bash
  curl -s "https://zh.wikisource.org/w/api.php?action=parse&page=%E5%91%A8%E6%98%93/%E4%B9%BE&prop=wikitext&format=json&formatversion=2"
  ```
- **每頁可直接提取**：`周易　第 N 卦` → 通行本卦序；`<下卦>下<上卦>上` → 上下卦；
  `[[File:Iching-hexagram-NN.svg|alt=䷀]]` → Unicode 卦符；`易經：` 區塊 → 卦辭 + 6 條爻辭。

**全量核對結果（2026-08-30 實跑）**：

| 核對項 | 結果 |
|---|---|
| 64 頁全部存在，`第 N 卦` 序號集合 == 1..64 | ✅ |
| 序號 == `alt` 卦符碼位 `U+4DC0 + n − 1` | ✅ **64/64** |
| 64 個 (下卦, 上卦) 組合互異 | ✅ |
| 卦辭 + 6 條爻辭齊全 | ✅ 64/64（乾坤另有用九/用六）|
| 與《古今圖書集成》卷544 八宮卦名蘊含的上下卦交叉核對 | ✅ **59/59 一致，0 不一致**（餘 5 卦因該書機器標點插進卦名，自動解析失敗，非數據缺失）|

### 4.2 ⚠️ 解析坑（實測，必看）

1. **`-{ }-` 語言轉換標記**：`乾` 頁寫作 `-{乾}-下-{乾}-上`，正則不先剝 `-\{(?:T\|)?([^{}]*)\}-` 就匹配不到上下卦。
2. **圖片標記三種寫法**：`[[File:Iching-hexagram-11.svg|alt=䷊]]`、`[[Image:Yijing12.jpg|alt=䷋]]`、
   **鼎卦有拼寫錯誤 `alr=䷱`**（不是 `alt`）。正則須寫 `al[tr]=`。
3. **爻題後的標點不統一**：63 卦用全角冒號 `初九：`，**唯獨「否」卦用逗號 `初六，`**。
4. **異體字**：`无`（非「無」）、`恒`（非「恆」）、`无妄`（《古今圖書集成》作「無妄」）—— 跨源比對必須做別名表。
5. **`《古今圖書集成》卷544` 的標點是機器加的**（頁面自帶 `{{Machine punctuation|古詩文斷句 v2.1}}` 標記），
   卦名中間會被插入 `、` `，`（如 `地火，《明夷》`）。**別直接正則切卦名。**
6. **64 個卦頁本身沒有版權模板**（實測 0/64 帶 `PD-old`），靠站點總條款兜底。

### 4.3 授權與許可（`CLAUDE.md §0-5`）

| 源 | 許可 | 可否商用 | 署名 |
|---|---|---|---|
| **zh.wikisource** 文本 | 底本先秦文獻 = **公有領域**；站方貢獻按 WMF 條款 **CC BY-SA 4.0 + GFDL** | **可** | 建議標「文本據 zh.wikisource《周易》，CC BY-SA 4.0」 |
| **Unicode** 4DC0–4DFF 卦符 / 2630–2637 卦符 / 268A–268B 陰陽爻 | 字符碼位本身無版權；`UnicodeData.txt` 屬 Unicode 資料檔 | **可**（只用碼位）| 無 |
| **ctext.org** | 站方明文「may not be republished without express written permission」+「**嚴禁使用自動下載軟體下載本網站的大量網頁**」 | ⚠️ **不可批量轉載** | — |

〔<https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use> · <https://ctext.org/faq/zh> · <https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt> · 均抓取 2026-08-30〕

### 4.4 隱私分級（`CLAUDE.md §0-3`）

- **不含 PII**（古籍正文 + 靜態卦表），可打進前端 bundle。
- ⚠️ **產品側**：用戶選的「想問什麼事」+ 卦象若要落庫，就落進 `readings` 同一套隱私約束（可刪除、不外發）。**本次未設計該表。**

---

## 5. 可直接照抄的最小算法（六擲版）

```ts
// ── 一擲三錢 → 一爻。yangFaces = 三枚中「陽面」的個數。
// 本項目採「背為陽」（甲說）；異說見 liuyao-tradition.md §2.2，兩說概率分布對稱，工程影響為零。
// 出處：儲泳《祛疑說》「皆三則成九…兩三一二則成八」；《古今圖書集成》卷544「一背為單…純字為交」
const yaoValue = 6 + yangFaces;                      // 6 交/老陰, 7 單/少陽, 8 拆/少陰, 9 重/老陽
const isYang   = yaoValue === 7 || yaoValue === 9;
const isMoving = yaoValue === 6 || yaoValue === 9;   // 動爻

// ── 六擲，自下而上：lines[0] = 初爻 … lines[5] = 上爻
// 出處：《古今圖書集成》卷544「自下而上，三擲內卦成」+「復如前法再擲，合成一卦」
// 內卦（下卦）= lines[0..2]，外卦（上卦）= lines[3..5]

// ── 經卦編碼：先天序 = 1 + binary(初→上, 陽=0 陰=1)，初爻為最高位
// 乾1 兌2 離3 震4 巽5 坎6 艮7 坤8（卷544〈八卦次序〉，已機器核對 8/8）
const trigramIndex = (t: boolean[]) =>            // t = [初, 二, 三]，true = 陽
  parseInt(t.map(y => (y ? "0" : "1")).join(""), 2);   // 0..7；Unicode 符號 = U+2630 + index

// ── 之卦：「重變為拆，交變為單」（卷544）；朱熹「用九故老陽變為少陰，用六故老陰變為少陽」
const changedLine = (yv: number) => (yv === 9 ? 8 : yv === 6 ? 7 : yv);
const hasChange   = lines.some(yv => yv === 6 || yv === 9);   // 無動爻則不存在之卦

// ── 本卦 / 之卦 → 卦名：以 (下卦, 上卦) 查 64 卦表（§4.1 從 wikisource 取得，組合互異已驗證）
```

**動爻數概率（實算，UI 要能處理各種情況）**：
```
0 動爻 17.80%   1 動爻 35.60%   2 動爻 29.66%   3 動爻 13.18%
4 動爻  3.30%   5 動爻  0.44%   6 動爻  0.024%
```
→ **17.8% 的卦沒有之卦**，結果區必須能優雅處理「之卦不存在」。

⚠️ **不要**用「先天序」當 64 卦的卦序 —— 那是另一套（通行本卦序見 §4.1，逐卦從 wikisource 讀 `第 N 卦`）。
⚠️ **不要**把「先天序」和「先天方位」混為一談：序號有多源明文，**方位出自邵雍、不見於《說卦》經文**。
⚠️ **兩個「老少」同名不同義**：爻的老少（6/7/8/9）決定動不動；《卜筮全書·繫辭八卦象類歌》另有一套給**八卦**分類的
「乾=老陽、坎艮震=少陽、坤=老陰、離兌巽=少陰」，**二者無關**。欄位建議命名 `yaoValue` vs `guaYinYangClass`
（`liuyao-tradition.md` §7）。
⚠️ 本版**不做納甲** ⇒ **不做六親 / 六神 / 世應 / 用神**，這些概念在無納甲時不成立（`liuyao-tradition.md` §10）。

## 6. 本項目內的使用位置

**未接入。** 計劃消費方見 `docs/prd/liuyao-prd.md`：`frontend/src/lib/liuyao.ts` + `frontend/src/data/`（64 卦表 + 8 經卦表），
比照既有 `frontend/src/data/tarot-deck.ts` / `frontend/src/lib/tarot.ts` 的自建數據模式。

---

## 7. 未解決問題

- [ ] #1 候選 npm 包**一個都沒實跑/未核對數據** —— 需要：若 Rick 傾向引庫，再跑一輪逐包驗證
- [ ] #2 `@soul-atelier/core` 週下載 1752 與其他指標不匹配，原因未查明
- [ ] #3 若做**納甲裝卦**，`lunar-javascript` 的干支類方法（日辰/月建）**未驗證** —— 需要：本地實跑 + 官方 API 文檔 <https://6tail.cn/calendar/api.html>（本次未抓）
- [ ] #4 wikisource 64 頁的**文本校勘質量**未評估（頁面標 `Textquality|50%`）—— 需要：與紙本或另一公版底本比對
- [ ] #5 64 卦的**中文卦名異體字**（无/無、恒/恆、坼/拆）需定一套內部標準寫法
- [ ] #6 Wilhelm–Baynes 英文譯名的版權狀態**未查證** —— 需要：若產品要出英文版再查
- [ ] #7 `@soul-atelier/core` 自述的「八卦/六十四卦原語」內容**未驗證**

## 來源清單

| # | URL 或本地路徑 | 抓取日期 | 來源等級 |
|---|---|---|---|
| 1 | <https://registry.npmjs.org/-/v1/search?text=iching> 等 6 組檢索 + 各包 `registry.npmjs.org/<pkg>` | 2026-08-30 | 官方 API |
| 2 | <https://api.npmjs.org/downloads/point/last-week/><pkg> | 2026-08-30 | 官方 API |
| 3 | `node_modules/lunar-javascript/lunar.js`（`:1917` `:3918` `:7489-7494`）+ `package.json`（v1.7.7, MIT）+ 本地 `node` 實跑輸出 | 2026-08-30 | 官方倉庫產物 / 本地實測 |
| 4 | <https://zh.wikisource.org/wiki/周易> + `周易/<卦名>` 64 頁（MediaWiki API `action=parse`）| 2026-08-30 | 原始典籍轉寫 |
| 5 | <https://zh.wikisource.org/wiki/欽定古今圖書集成/博物彙編/藝術典/第544卷>（交叉核對源）| 2026-08-30 | 原始典籍轉寫 |
| 6 | <https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt>（4DC0–4DFF 64 字 / 2630–2637 / 268A–268F）| 2026-08-30 | 官方標準 |
| 7 | <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use> | 2026-08-30 | 官方文檔 |
| 8 | <https://ctext.org/faq/zh> · <https://ctext.org/faq> | 2026-08-30 | 官方文檔 |

⚠️ 模型自身記憶**不算來源**，未寫入本表。
