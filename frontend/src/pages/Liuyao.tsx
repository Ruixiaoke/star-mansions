import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoinToss } from "../components/CoinToss";
import { DivinationList, formatSavedAt } from "../components/DivinationList";
import { GuaChart } from "../components/GuaChart";
import { GuaReading, hexagramOfShape } from "../components/GuaReading";
import { LIUYAO_TOPICS, findTopic, type LiuyaoTopic, type TopicKey } from "../data/liuyao-topics";
import { ApiClientError } from "../lib/api";
import { authAdapter } from "../lib/authAdapter";
import { divinationStore, type LiuyaoPayload } from "../lib/divinationStore";
import {
  YAO_COUNT,
  castingFromCode,
  castingOf,
  tossOnce,
  yaoFromToss,
  type Casting,
  type Six,
  type Toss,
  type Yao,
  type YaoPosition,
} from "../lib/liuyao";
import type { DivinationRecord, User } from "../types/contract";

/**
 * 六爻起卦（`docs/prd/liuyao-prd.md`）。三枚铜钱 × 六掷成卦，自下而上。
 *
 * **流程铁律三条（PRD §3，实现时不许打折）**：
 * 1. **所问事项必须在第一掷之前选定**，第一掷落定后**锁定不可改** —— 锁定后下拉框整个换成只读回显，
 *    不是加个提示了事。理由：传统「一事一占」的仪轨，以及产品诚信（不能看到卦象再回头改题目）。
 * 2. **每一掷都由用户主动点击触发**，没有「一键掷完六次」——引擎也刻意只给 `tossOnce`（§17）。
 * 3. **掷出不可撤销、不可重掷单爻**；要改只能整卦重来，且二次确认走**页面内组件**，
 *    **不用浏览器 `confirm()`**（PRD §13）。
 *
 * 起卦全在前端（纯随机 + 静态表），断网也能掷卦看结果；**未登录不发任何写请求**（PRD §16-28）——
 * 保存按钮换成登录引导，`divinationStore` 里另有一道无 token 就地抛的兜底。
 */

/** 起卦的仪轨类原文（PRD §9.2-4 建议置于显著位置：古人自己对占卜的态度，比自撰话术更有说服力）。 */
const RITUAL_QUOTES = [
  "卜以決疑。既卜之後，若可若否，悉憑卦象，毋率己意……再覆再占，以瀆先聖。",
  "《易》曰：初筮告，再三瀆，瀆則不告。",
];
const RITUAL_CITE = "《卜筮全书·易卦全书凡例》，见《钦定古今图书集成》卷 544 · 公有领域";
const RITUAL_URL =
  "https://zh.wikisource.org/wiki/欽定古今圖書集成/博物彙編/藝術典/第544卷";

/** 两档来源在下拉框里的分组标题（PRD §7.1 / §16-18：《梅花易数》必须降级标注，不与《易传》并称经典）。 */
const TOPIC_GROUPS = [
  { tier: "zhouli" as const, label: "据《周礼·春官·大卜》八命（经文）" },
  { tier: "meihua" as const, label: "据《梅花易数》（传邵雍撰，明清流传本）" },
];

export function Liuyao() {
  const navigate = useNavigate();

  const [topicKey, setTopicKey] = useState<TopicKey | "">("");
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [confirming, setConfirming] = useState(false);

  const [user] = useState<User | null>(() => authAdapter.currentUser());
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [recordsErr, setRecordsErr] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveErr, setSaveErr] = useState<string | null>(null);
  /** 回看：由卦码还原卦象，**不重新掷**（PRD §5.5）。 */
  const [reviewId, setReviewId] = useState<string | null>(null);

  const confirmRef = useRef<HTMLButtonElement>(null);

  const topic: LiuyaoTopic | undefined = topicKey ? findTopic(topicKey) : undefined;
  const locked = tosses.length > 0; // 第一掷落定即锁题
  const yaos: Yao[] = tosses.map(yaoFromToss);
  const casting: Casting | null = tosses.length === YAO_COUNT ? castingOf(yaos as Six<Yao>) : null;

  // 登录用户进页面就拉一次卦例；未登录一个请求都不发（PRD §16-28）
  useEffect(() => {
    if (!user) return;
    let alive = true;
    divinationStore
      .list()
      .then((list) => alive && setRecords(list))
      .catch((e: unknown) => alive && setRecordsErr(e instanceof ApiClientError ? e.message : "卦例加载失败"));
    return () => {
      alive = false;
    };
  }, [user]);

  // 二次确认弹出后把焦点移到确认按钮上，键盘用户不必自己找
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  /**
   * 掷一次。`tossOnce` 刻意放在 setState 之外调用 —— React 严格模式会重复执行状态更新函数，
   * 放进去会多消耗一次随机数、且两次结果不同（伪造/丢弃掷币结果，撞 PRD §5.1「不做任何兜底修正」）。
   */
  function handleToss() {
    if (!topic || tosses.length >= YAO_COUNT) return;
    const next = tossOnce((tosses.length + 1) as YaoPosition);
    setTosses([...tosses, next]);
  }

  /** 整卦重来：清空回到第 ① 步（含解锁所问事项）。单爻不可重掷、上一掷不可撤销（PRD §3 铁律 3）。 */
  function handleReset() {
    setTosses([]);
    setTopicKey("");
    setConfirming(false);
    setSaveState("idle");
    setSaveErr(null);
  }

  async function handleSave() {
    if (!casting || !topic) return;
    setSaveErr(null);
    setSaveState("saving");
    const payload: LiuyaoPayload = {
      tosses,
      yaos,
      primaryOrder: hexagramOfShape(casting.primary).order,
      changedOrder: casting.changed ? hexagramOfShape(casting.changed).order : null,
      movingPositions: casting.movingPositions,
    };
    try {
      await divinationStore.save({ topic: topic.key, code: casting.primary.code, payload });
      setSaveState("saved");
      setRecords(await divinationStore.list());
    } catch (e: unknown) {
      setSaveState("idle");
      setSaveErr(e instanceof ApiClientError ? e.message : "保存失败");
    }
  }

  async function handleRemove(id: string) {
    setRecordsErr(null);
    try {
      await divinationStore.remove(id);
      if (reviewId === id) setReviewId(null);
      setRecords(await divinationStore.list());
    } catch (e: unknown) {
      setRecordsErr(e instanceof ApiClientError ? e.message : "删除失败");
    }
  }

  const tossDisabledReason = !topic
    ? "请先在上面选定「所问事项」，选定后才能掷币 —— 一事一占，题目不能在看到卦象之后再改。"
    : tosses.length >= YAO_COUNT
      ? "六爻已成，本卦不再接受新的掷币；要另起一卦请用下面的「重新起卦」。"
      : null;

  const reviewRecord = reviewId ? (records.find((r) => r.id === reviewId) ?? null) : null;
  const reviewCasting = reviewRecord ? castingFromCode(reviewRecord.code) : null;
  const reviewTopic = reviewRecord ? findTopic(reviewRecord.topic) : undefined;

  return (
    <div className="container liuyao">
      <header>
        <h1 className="page-title">六爻起卦</h1>
        <p className="muted">三枚铜钱 · 六掷成卦 · 以钱代蓍</p>
      </header>

      {/* 玩法与定位常驻。§7.3 的诚实定位、§5.2 的「背为阳」注文都在这里，不折叠、不藏进二级页 */}
      <section className="panel liuyao__rules">
        <p>
          <strong>本页只做起卦与原文呈现，不做传统六爻的纳甲断卦。</strong>
          起卦一步一步依《卜筮全书·以钱代蓍画法》：一掷三枚铜钱得一爻，掷六次自下而上成一卦；
          第 1–3 掷成内卦，第 4–6 掷成外卦。
        </p>
        <p>
          钱面记法本页采「<strong>背为阳</strong>」：爻数 = 6 + 三枚里背面的枚数（0 背为交 ×、1 背为单 ⚊、
          2 背为拆 ⚋、3 背为重 ○），重与交为动爻。古籍对钱之何面为阳另有异说，宋人已称「未知孰是」，
          两种约定下四种爻象的概率对称，因此本页不做切换开关。
        </p>
        <p>每一掷都要你自己点一次；掷出的结果不可撤销、不可重掷单爻，要改只能整卦重来。</p>
        <p>不登录也能完整起卦看结果，只是存不了；在你点「保存到我的卦例」之前，本页不向后端发送任何数据。</p>
      </section>

      {/* 引用层：古人自己对占卜的态度（PRD §9.2-4）。照登原文，配语境说明与出处 */}
      <section className="panel liuyao-quote liuyao__ritual">
        <h2 className="section-h">〔原文依据〕古人怎么看占卜</h2>
        <p className="liuyao-context" role="note">
          以下两句是古籍原文，说的是古人自己对占卜的态度，不是对你处境的判词。
        </p>
        {RITUAL_QUOTES.map((quote) => (
          <blockquote className="liuyao-quote__text" key={quote}>
            {quote}
          </blockquote>
        ))}
        <p className="liuyao-cite">
          {RITUAL_CITE} ·{" "}
          <a href={RITUAL_URL} target="_blank" rel="noreferrer">
            源页
          </a>
        </p>
      </section>

      {/* ① 所问事项：掷币前必选，第一掷后锁定（PRD §3 流程铁律 1） */}
      <section className="panel liuyao__topic">
        <h2 className="section-h">所问事项</h2>
        {locked && topic ? (
          <div className="liuyao__topic-locked">
            <p className="liuyao__topic-name">
              {topic.label}
              <span className="liuyao-tag">已锁定</span>
            </p>
            <p className="liuyao-note">
              第一掷已经落定，所问事项不再可改 —— 一事一占，不能看到卦象之后再回头换题目。
              要换题目请整卦重来。
            </p>
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor="liuyao-topic">
              选一件想问的事（必选）
            </label>
            <select
              id="liuyao-topic"
              className="field__input liuyao__select"
              value={topicKey}
              onChange={(e) => setTopicKey(e.target.value as TopicKey | "")}
            >
              <option value="">请选择…</option>
              {TOPIC_GROUPS.map((group) => (
                <optgroup label={group.label} key={group.tier}>
                  {LIUYAO_TOPICS.filter((t) => t.sourceTier === group.tier).map((t) => (
                    <option value={t.key} key={t.key}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        {!locked && topic && (
          <>
            <p className="liuyao__topic-hint">{topic.hint}</p>
            <p className="liuyao-note">{topic.sourceNote}</p>
          </>
        )}
      </section>

      {/* ② 掷币区 */}
      <CoinToss
        count={tosses.length}
        last={tosses.length > 0 ? tosses[tosses.length - 1] : null}
        disabled={!topic || tosses.length >= YAO_COUNT}
        disabledReason={tossDisabledReason}
        onToss={handleToss}
      />

      {/* ③ 卦象区：随掷逐爻生长；六爻成卦后由结果区展示本卦 / 之卦两张图 */}
      {!casting && (
        <section className="panel liuyao__chart">
          <h2 className="section-h">卦象</h2>
          <GuaChart yaos={yaos} label="卦象" />
        </section>
      )}

      {/* ④⑤ 结果区。区块常驻在 DOM 里，aria-live 才能在第六掷落定时播报（同 /tarot 的做法） */}
      <section className="liuyao__result" aria-live="polite">
        {casting && topic && (
          <>
            <GuaReading casting={casting} topic={topic} />

            <div className="liuyao__actions">
              {user ? (
                <>
                  <button
                    type="button"
                    className="cta"
                    onClick={handleSave}
                    disabled={saveState !== "idle"}
                  >
                    {saveState === "saving" ? "保存中…" : saveState === "saved" ? "已保存" : "保存到我的卦例"}
                  </button>
                  {saveState === "saved" && <p className="liuyao-note">已存进下面的「我的卦例」，可随时删除。</p>}
                </>
              ) : (
                <div className="liuyao__signin">
                  <p className="liuyao-note">
                    未登录：这一卦只在你的浏览器里，不会上传、也不会保存。登录后才能存下来。
                    去登录会离开本页，当前这一卦需要重新起。
                  </p>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => navigate("/login", { state: { redirect: "/liuyao" } })}
                  >
                    去登录
                  </button>
                </div>
              )}
              {saveErr && (
                <p className="form-err" role="alert">
                  <span aria-hidden="true">⚠ </span>
                  {saveErr}
                </p>
              )}

              {/* 二次确认走页面内组件，**不用浏览器 confirm**（PRD §13） */}
              {confirming ? (
                <div className="liuyao__confirm" role="alertdialog" aria-labelledby="liuyao-confirm-title">
                  <p id="liuyao-confirm-title">
                    重新起卦会清空当前这一卦，并把所问事项一并解锁。掷出的结果不能撤销，也不能只重掷某一爻 ——
                    确定整卦重来吗？
                  </p>
                  <div className="liuyao__confirm-actions">
                    <button type="button" className="cta" onClick={handleReset} ref={confirmRef}>
                      确定，重新起卦
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setConfirming(true)}>
                  重新起卦
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* 卦例回看（登录用户）。「我的」页面另有一份分区列表（PRD §23-Q1 选 A），两处共用 DivinationList */}
      <section className="panel liuyao__records">
        <h2 className="section-h">我的卦例</h2>
        {!user ? (
          <p className="muted">登录后可以把起过的卦存下来，之后回这里回看或删除。</p>
        ) : (
          <>
            {recordsErr && (
              <p className="form-err" role="alert">
                <span aria-hidden="true">⚠ </span>
                {recordsErr}
              </p>
            )}
            <DivinationList
              items={records}
              onRemove={handleRemove}
              onReview={(id) => setReviewId(reviewId === id ? null : id)}
              reviewingId={reviewId}
            />
          </>
        )}
      </section>

      {/* 回看：卦象由卦码还原，不重新掷（PRD §5.5）；分类键不认识时如实说明，不猜 */}
      {reviewRecord && (
        <section className="liuyao__review" aria-live="polite">
          <h2 className="section-h">回看 · 存于 {formatSavedAt(reviewRecord.createdAt)}</h2>
          {reviewCasting && reviewTopic ? (
            <GuaReading casting={reviewCasting} topic={reviewTopic} />
          ) : (
            <p className="muted">
              这条卦例还原不出来（卦码或所问事项无法识别），只能显示原始卦码 <code>{reviewRecord.code}</code>。
            </p>
          )}
        </section>
      )}
    </div>
  );
}
