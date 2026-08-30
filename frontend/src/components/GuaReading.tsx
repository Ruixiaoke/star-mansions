import { Disclaimer } from "./Disclaimer";
import { GuaChart } from "./GuaChart";
import { hexagramByKey, type Hexagram } from "../data/gua";
import { GUA_READINGS, type GuaOrder, type GuaReading as GuaReadingEntry } from "../data/gua-readings";
import { MOVING_FRAMES, TOPIC_CLOSING, type LiuyaoTopic } from "../data/liuyao-topics";
import { YAO_POSITION_NAMES, hexagramKeyOf, type Casting, type GuaShape, type YaoPosition } from "../lib/liuyao";

/**
 * 结果区（六爻 PRD §4 结果区 / §8 双层分离 / §9 红线 · 产物 C4）。
 *
 * 本组件是**双层分离**落到页面上的那一层，四条不许打折：
 * 1. 〔原文依据〕与〔以下为本项目编写〕是**带可见文字标题的独立区块**，
 *    不靠样式深浅区分（PRD §4 / §8.2）——样式只是帮忙，分不清的责任不能推给颜色。
 * 2. **每个引用层区块外都有显著语境框**（可见文字块，不是小字脚注）：说明这是成书逾两千年的古文、
 *    是古人的记事与议论、**不是对你处境的判词**（PRD §9.2-2 —— 原文「凶」58 次涉 38 卦，
 *    照登不改是 D4 的处理方式，语境框是它的配套，删了语境框等于把「凶」直接甩给用户）。
 * 3. **无动爻时不出之卦板块**（约 17.8% 的卦会这样），不造「同上」的空壳（PRD §5.4 / §16-6）。
 * 4. **不代为取断**：本卦卦辞 / 各动爻爻辞 / 之卦卦辞**并列呈现**，
 *    不写「所以该看第 X 爻」「以之卦为断」（PRD D5）。注文常驻。
 *
 * 白话一律取 `data/gua-readings.ts`（编写层）；`data/gua.ts` 只有原文，没有一个字是本项目写的。
 */

/** 语境框正文（PRD §4 结果区图 / §9.2-2）。每个引用层区块都要带一份。 */
const CONTEXT_NOTE =
  "以下为《周易》古文原文，成书逾两千年，是古人的记事与议论，不是对你处境的判词。";

/** 引用层的固定署名（PRD §8.1 / §6.1 授权：维基文库站方贡献按 CC BY-SA 4.0）。 */
const SOURCE_CITE = "维基文库《周易》· 公有领域 · CC BY-SA 4.0";

/** 不代为取断的注文（PRD §5.4 D5，措辞照 PRD）。 */
const NO_ARBITRATION_NOTE =
  "古人对「多个动爻看哪条」有不同主张（朱熹考变占 / 火珠林纳甲），本页并列呈现，不代为取断。";

/** 未定稿内容的显式标记（CLAUDE.md §7 / PRD §8.4-3）——占位绝不能看起来像定论。 */
const PLACEHOLDER_TAG = "示例（占位）";

/**
 * 卦象 → 64 卦身份。**只走先天序数字键**：`data/gua.ts` 的 `lower`/`upper` 存的是源文用字（繁体
 * 兌 / 離），`data/trigrams.ts` 是简体（兑 / 离），按名字 join 会在这两个卦上静默查空（PRD §10 注）。
 * `lib/liuyao.ts` 刻意没 import 64 卦表（建表时两个工位并行），故这道联结放在页面层。
 */
export function hexagramOfShape(shape: GuaShape): Hexagram {
  return hexagramByKey(hexagramKeyOf(shape));
}

/** 卦序 → 编写层白话。表是 1–64 全覆盖的 `Record`，故必有值。 */
function readingOf(hexagram: Hexagram): GuaReadingEntry {
  return GUA_READINGS[hexagram.order as GuaOrder];
}

/** 爻位数字 → 传统爻位名（初 / 二 … 上）。 */
function positionName(position: YaoPosition): string {
  return YAO_POSITION_NAMES[position - 1];
}

/** 框架句的槽位替换。取值一律来自《说卦》定表的自然象 / 卦德（PRD §8.3，有出处且天然中性）。 */
function fillFrame(sentence: string, shape: GuaShape): string {
  return sentence
    .replaceAll("{lowerNature}", shape.lower.nature)
    .replaceAll("{upperNature}", shape.upper.nature)
    .replaceAll("{lowerVirtue}", shape.lower.virtue)
    .replaceAll("{upperVirtue}", shape.upper.virtue);
}

/**
 * 引用层区块：语境框 + 原文 + 署名。
 * 原文**逐字照登**，不做柔化删改（PRD §8.1）——删改原文是另一种造假，且用户随手一搜就穿帮。
 */
function QuoteBlock({
  title,
  hexagram,
  movingPositions,
}: {
  title: string;
  hexagram: Hexagram;
  /** 要并列展示爻辞的动爻位置；之卦只引卦辞，传空数组。 */
  movingPositions: readonly YaoPosition[];
}) {
  return (
    <section className="panel liuyao-quote">
      <h3 className="section-h">〔原文依据〕{title}</h3>

      {/* 语境框：显著的可见文字块，不是小字脚注、不折叠（PRD §9.2-2） */}
      <p className="liuyao-context" role="note">
        {CONTEXT_NOTE}
      </p>

      <h4 className="liuyao-quote__label">卦辞</h4>
      <blockquote className="liuyao-quote__text">{hexagram.judgment}</blockquote>

      {movingPositions.length > 0 && (
        <>
          <h4 className="liuyao-quote__label">动爻爻辞 · {movingPositions.length} 条（按初→上并列）</h4>
          {movingPositions.map((position) => (
            <blockquote className="liuyao-quote__text" key={position}>
              <span className="liuyao-quote__pos">{positionName(position)}爻</span>
              {hexagram.lines[position - 1]}
            </blockquote>
          ))}
        </>
      )}

      <p className="liuyao-cite">
        {SOURCE_CITE} ·{" "}
        <a href={hexagram.sourceUrl} target="_blank" rel="noreferrer">
          该卦源页
        </a>
      </p>
    </section>
  );
}

/** 一个卦的身份卡（卦名 / 卦画 / 卦序 / 上下卦 / 卦象图）。本卦与之卦共用。 */
function GuaIdentity({ label, shape, hexagram }: { label: string; shape: GuaShape; hexagram: Hexagram }) {
  return (
    <div className="liuyao-gua">
      <p className="liuyao-gua__label">{label}</p>
      <p className="liuyao-gua__symbol" aria-hidden="true">
        {hexagram.symbol}
      </p>
      <h3 className="liuyao-gua__name">{hexagram.name}</h3>
      <p className="liuyao-gua__meta">
        第 {hexagram.order} 卦 · 上{shape.upper.name}下{shape.lower.name} · 卦码{" "}
        <code className="liuyao-gua__code">{shape.code}</code>
      </p>
      <GuaChart yaos={shape.yaos} label={`${label}卦象`} />
    </div>
  );
}

interface GuaReadingProps {
  casting: Casting;
  topic: LiuyaoTopic;
}

export function GuaReading({ casting, topic }: GuaReadingProps) {
  const primary = hexagramOfShape(casting.primary);
  const primaryReading = readingOf(primary);
  const changedShape = casting.changed;
  const changed = changedShape ? hexagramOfShape(changedShape) : null;
  const changedReading = changed ? readingOf(changed) : null;
  const moving = casting.movingPositions;

  const movingFrame =
    moving.length > 0
      ? MOVING_FRAMES.moving.replace("{positions}", moving.map(positionName).join("、"))
      : MOVING_FRAMES.still;

  return (
    <div className="liuyao-reading">
      {/* 所问事项回显（掷前选定、掷后锁定的那一项）+ 来源档次标注（PRD §7.2 / §16-18） */}
      <section className="panel liuyao-reading__topic">
        <h2 className="section-h">所问事项</h2>
        <p className="liuyao-reading__topic-name">{topic.label}</p>
        <p className="liuyao-note">{topic.sourceNote}</p>
      </section>

      <section className="liuyao-reading__guas">
        <GuaIdentity label="本卦" shape={casting.primary} hexagram={primary} />
        {/* 无动爻则整块不渲染（PRD §5.4）：不给一个「同上」的空壳 */}
        {changedShape && changed && <GuaIdentity label="之卦" shape={changedShape} hexagram={changed} />}
      </section>

      {/* 〔本页说明〕= 第三类文字：既不是典籍原文，也不是卦象释义，而是本页的方法论声明。
          §8 双层分离要求页面上每句话都能归位，这一句两层都不属，故给它自己的可见标签。 */}
      <p className="liuyao-note liuyao-note--moving">
        <span className="liuyao-note__label">〔本页说明〕</span>
        {moving.length > 0
          ? `动爻：${moving.map(positionName).join("、")}爻（共 ${moving.length} 爻动）。`
          : "六爻皆静，没有动爻，因此没有之卦。"}{" "}
        {NO_ARBITRATION_NOTE}
      </p>

      {/* 引用层：本卦（卦辞 + 各动爻爻辞并列） */}
      <QuoteBlock title={`本卦 · ${primary.name}`} hexagram={primary} movingPositions={moving} />

      {/* 引用层：之卦（只引卦辞）。无动爻时这一块连同上面的之卦身份卡一起不出现 */}
      {changed && <QuoteBlock title={`之卦 · ${changed.name}`} hexagram={changed} movingPositions={[]} />}

      {/* 编写层：与引用层物理分区块，标题写明是本项目写的（PRD §8.2） */}
      <section className="panel liuyao-written">
        <h3 className="section-h">〔以下为本项目编写〕</h3>
        <p className="liuyao-note">
          下面几段是本项目写的现代白话，不是典籍原文；取象语汇取自《说卦传》，不翻译卦爻辞里的判词。
        </p>

        <h4 className="liuyao-written__label">本卦 · 卦象白话</h4>
        {primaryReading.placeholder && <p className="liuyao-tag">{PLACEHOLDER_TAG}</p>}
        <p className="liuyao-written__text">{primaryReading.vernacular}</p>

        {changedReading && (
          <>
            <h4 className="liuyao-written__label">之卦 · 卦象白话</h4>
            {changedReading.placeholder && <p className="liuyao-tag">{PLACEHOLDER_TAG}</p>}
            <p className="liuyao-written__text">{changedReading.vernacular}</p>
          </>
        )}

        <h4 className="liuyao-written__label">视角提示 · {topic.label}</h4>
        <p className="liuyao-written__text">{fillFrame(topic.frameSentence, casting.primary)}</p>
        <p className="liuyao-written__text">{movingFrame}</p>
        <p className="liuyao-written__closing">{TOPIC_CLOSING}</p>
      </section>

      {/* 红线 §0-1：结果区必须有显著免责，不是 footer 小字 */}
      <Disclaimer />
    </div>
  );
}
