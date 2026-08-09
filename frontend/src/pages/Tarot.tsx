import { useState, type FormEvent } from "react";
import { Disclaimer } from "../components/Disclaimer";
import { SUIT_META, type TarotCardBase } from "../data/tarot-deck";
import { SOURCE_CITE, SUMMARY_PLACEHOLDER } from "../data/tarot-readings";
import {
  DECK_SIZE,
  POSITIONS,
  clearFieldError,
  drawCards,
  parseDrawInput,
  positionalText,
  readingOf,
  shuffle,
  type DeckOrder,
  type DrawErrors,
  type DrawPick,
  type DrawResult,
  type Orientation,
  type Triple,
} from "../lib/tarot";

const ORIENTATION_ZH: Record<Orientation, string> = { upright: "正位", reversed: "逆位" };
const ORIENTATION_EN: Record<Orientation, string> = { upright: "Upright", reversed: "Reversed" };

const EMPTY_HINT = `填入三个 1–${DECK_SIZE} 的数字，点击抽牌`;
/** 未定稿内容的显式标记（PRD §9.2）——占位绝不能看起来像定论。 */
const PLACEHOLDER_TAG = "示例（占位）";

/** 卡面上的装饰符号：小阿卡纳取花色符号，大阿卡纳取它的编号（PRD §5.2 不用任何牌面插图）。 */
function cardGlyph(card: TarotCardBase): string {
  return card.suit ? SUIT_META[card.suit].glyph : String(card.rank);
}

/**
 * `sourceQuote` 为空时显示什么（PRD §12：**不能静默留白**，否则会被读成「原文就是那样」）。
 * 三种成因分开说：内容层写明的原因（圣杯二「原文缺逆位依据」/「原文全数触线，已略」）优先；
 * 占位阶段则说明只是还没摘录；都没有时兜一句保底，不留空白。
 */
function missingQuoteNote(pick: DrawPick, note: string | undefined): string {
  if (note) return note;
  if (pick.card.placeholder) return `${PLACEHOLDER_TAG} · 原文逐字待摘录`;
  return `原文缺${ORIENTATION_ZH[pick.orientation]}依据`;
}

/**
 * 一张翻开的牌。两件事各自要守住：
 *
 * 1. **双层分离**（PRD v0.3 §9.1 / §12）：〔原文依据〕与〔以下为本项目编写〕**分区块**呈现，
 *    区块标题是可见文字而不只是样式差异 —— 用户必须一眼分得清哪句是公版原文、哪句是我们写的。
 * 2. **逆位不是坏消息**：朝向用可见文字标在牌名后（「宝剑三 · 逆位」），读屏照着念；
 *    正逆两态共用同一套样式，只有文字与装饰符号的方向不同 ——
 *    不用红色 / 警示图标，也不整体旋转正文（PRD §12 / 红线 §10.2-6）。
 */
function CardView({ pick }: { pick: DrawPick }) {
  const meta = POSITIONS[pick.position - 1];
  const reading = readingOf(pick);

  return (
    <article className="tarot-card" data-orientation={pick.orientation}>
      <p className="tarot-card__slot">
        位置 {pick.position} · {meta.name}
      </p>
      <p className="tarot-card__hint">{meta.hint}</p>

      <p className="tarot-card__glyph" aria-hidden="true">
        {cardGlyph(pick.card)}
      </p>

      <h3 className="tarot-card__name">
        {pick.card.nameZh} · {ORIENTATION_ZH[pick.orientation]}
      </h3>
      <p className="tarot-card__en">
        {pick.card.nameEn} · {ORIENTATION_EN[pick.orientation]}
      </p>
      <p className="tarot-card__number">你报的第 {pick.position} 个数字：{pick.inputNumber}</p>

      {pick.card.placeholder && <p className="tarot-tag">{PLACEHOLDER_TAG}</p>}

      {/* 引用层：公版原文逐字，不掺我们的话（PRD §12） */}
      <section className="tarot-card__block tarot-card__block--source">
        <h4 className="tarot-card__block-label">原文依据</h4>
        {reading.sourceQuote ? (
          <blockquote className="tarot-card__quote">{reading.sourceQuote}</blockquote>
        ) : (
          <p className="tarot-card__quote tarot-card__quote--none">
            {missingQuoteNote(pick, reading.sourceQuoteNote)}
          </p>
        )}
        <p className="tarot-card__cite">{SOURCE_CITE}</p>
      </section>

      {/* 编写层：与原文分开，标识写明是我们写的，不挂在韦特名下（PRD §9.2-6 / §12） */}
      <section className="tarot-card__block">
        <h4 className="tarot-card__block-label">以下为本项目编写的现代阐释</h4>
        <ul className="tarot-card__keywords">
          {reading.keywords.map((k, i) => (
            <li key={`${i}-${k}`}>{k}</li>
          ))}
        </ul>
        <p className="tarot-card__text">{positionalText(pick)}</p>
        <p className="tarot-card__text tarot-card__text--sub">{reading.meaning}</p>
      </section>
    </article>
  );
}

/**
 * 三张牌塔罗（docs/prd/tarot-prd.md）。
 * 与二十八宿主线无关的独立工具页：洗牌 / 定正逆 / 抽牌 / 解读全在前端，
 * 不调 `/api/*`、不写 localStorage、不收集任何个人信息（PRD §1 / §13）。
 * 洗牌与校验的逻辑全在 lib/tarot，页面只管渲染。
 */
export function Tarot() {
  // 进入页面自动洗一次；此后只有「重新洗牌」才重排（PRD §6.1）
  const [deck, setDeck] = useState<DeckOrder>(() => shuffle());
  const [raw, setRaw] = useState<Triple<string>>(["", "", ""]);
  const [errors, setErrors] = useState<DrawErrors | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);

  // 提交时统一校验（PRD §7.2）；Enter 键由 form 原生 submit 覆盖
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseDrawInput(raw);
    if (parsed.ok) {
      setErrors(null);
      setResult(drawCards(deck, parsed.input));
    } else {
      // 校验失败不抽牌，且**保留**上一次的合法结果（PRD §7.2 —— 与 /calc 清空结果的做法不同）
      setErrors(parsed.errors);
    }
  }

  // 用户一改这一格就撤掉它的报错，不让过期提示挂在屏幕上（下次提交重新校验）
  function changeAt(index: number, value: string) {
    setRaw((prev) => {
      const next = [...prev] as Triple<string>;
      next[index] = value;
      return next;
    });
    setErrors((prev) => (prev ? clearFieldError(prev, index) : prev));
  }

  function handleReshuffle() {
    setDeck(shuffle());
    // 旧结果不与新牌序同屏，否则会让人以为结果被改过（PRD §6.4）
    setResult(null);
    setErrors(null);
  }

  return (
    <div className="container tarot">
      <header>
        <h1 className="page-title">三张牌塔罗</h1>
        <p className="muted">先洗牌，再报三个数字。</p>
      </header>

      {/* 玩法说明常驻（PRD §4-2）；「不预测未来」与「逆位不是坏牌」两句是红线要求（§10.4） */}
      <section className="panel tarot__rules">
        <p>
          牌堆已经洗好，78 张正面朝下排成一列，每张牌的正逆也一并定好了；你报的数字，就是从这一列里翻开第几张。
        </p>
        <p>逆位不是坏牌，只是换一个角度看同一张牌。</p>
        <p>这是一个娱乐向的自我反思小工具，不预测未来。</p>
        <p>本页不保存任何记录，刷新即清空（刷新会重新洗一副牌）。</p>
      </section>

      <section className="tarot__deck">
        <p className="tarot__deck-state">
          牌已洗好（本次牌序 <code className="tarot__code">#{deck.shuffleCode}</code>）
        </p>
        <button type="button" className="btn-ghost tarot__reshuffle" onClick={handleReshuffle}>
          重新洗牌
        </button>
      </section>

      <form className="panel tarot__form" onSubmit={handleSubmit} noValidate>
        <div className="tarot__inputs">
          {POSITIONS.map((pos, i) => {
            const fieldErr = errors?.fields[i] ?? null;
            const flagged = errors?.flagged[i] ?? false;
            const describedBy =
              [fieldErr ? `tarot-n${pos.index}-err` : null, flagged && errors?.form ? "tarot-form-err" : null]
                .filter(Boolean)
                .join(" ") || undefined;

            return (
              <div className="field" key={pos.key}>
                <label className="field__label" htmlFor={`tarot-n${pos.index}`}>
                  {pos.inputLabel}
                </label>
                <input
                  id={`tarot-n${pos.index}`}
                  className="field__input"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  autoComplete="off"
                  spellCheck={false}
                  value={raw[i]}
                  onChange={(e) => changeAt(i, e.target.value)}
                  aria-invalid={flagged ? true : undefined}
                  aria-describedby={describedBy}
                />
                {fieldErr && (
                  <p className="form-err" id={`tarot-n${pos.index}-err`} role="alert">
                    <span aria-hidden="true">⚠ </span>
                    {fieldErr}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {errors?.form && (
          <p className="form-err tarot__form-err" id="tarot-form-err" role="alert">
            <span aria-hidden="true">⚠ </span>
            {errors.form}
          </p>
        )}

        <button type="submit" className="cta">
          抽牌
        </button>
      </form>

      {/* 结果区常驻在 DOM 里，aria-live 才能在内容变化时播报（PRD §12） */}
      <section className="tarot__result" aria-live="polite">
        {result ? (
          <>
            <div className="tarot__cards">
              {result.picks.map((pick) => (
                <CardView key={pick.position} pick={pick} />
              ))}
            </div>

            <section className="panel tarot__summary">
              <h2 className="section-h">综合解读</h2>
              {SUMMARY_PLACEHOLDER && <p className="tarot-tag">{PLACEHOLDER_TAG}</p>}
              <p className="tarot__summary-text">{result.summary}</p>
            </section>

            <p className="tarot__closing">这不是预测——三张牌只是给你一个重新看待事情的角度。</p>
            <Disclaimer />
          </>
        ) : (
          <p className="muted tarot__empty">{EMPTY_HINT}</p>
        )}
      </section>
    </div>
  );
}
