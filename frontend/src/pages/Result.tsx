import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { BirthInput, ComputeResponse } from "../types/contract";
import { computeBenmingXiu } from "../lib/computeClient";
import { ApiClientError } from "../lib/api";
import { authAdapter } from "../lib/authAdapter";
import { readingStore } from "../lib/readingStore";
import { getReading, ANALYSIS_SECTIONS } from "../data/readings";
import { XiuHero } from "../components/XiuHero";
import { AnalysisSection } from "../components/AnalysisSection";
import { ResultCard } from "../components/ResultCard";
import { Disclaimer } from "../components/Disclaimer";

/** 结果页：调 /api/compute → 本命宿 + 星图 + 七大板块 + 时辰辅助 + 保存/分享。 */
export function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const input = (location.state as { input?: BirthInput } | null)?.input ?? null;

  const [resp, setResp] = useState<ComputeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!input) return;
    let alive = true;
    setResp(null);
    setError(null);
    computeBenmingXiu(input)
      .then((r) => alive && setResp(r))
      .catch((e: unknown) =>
        alive && setError(e instanceof ApiClientError ? e.message : "测算失败，请稍后重试"),
      );
    return () => {
      alive = false;
    };
  }, [input]);

  if (!input) {
    return (
      <div className="container center">
        <p className="muted">没有生日输入。</p>
        <button className="cta" onClick={() => navigate("/")}>去输入生日</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container center">
        <p className="form-err">{error}</p>
        <button className="cta" onClick={() => navigate("/")}>重新测算</button>
      </div>
    );
  }

  if (!resp) {
    return (
      <div className="container center loading">
        <div className="spinner" aria-hidden="true" />
        <p className="muted">排盘中…</p>
      </div>
    );
  }

  const entry = getReading(resp.benming.xiu);
  const timeHelpText = resp.timeZhi ? entry?.timeHelp?.[resp.timeZhi] : undefined;

  function handleSave() {
    const user = authAdapter.currentUser();
    if (!user) {
      navigate("/login", { state: { redirect: "/result", input } });
      return;
    }
    readingStore.save({
      input: resp!.input,
      solarDate: resp!.solarDate,
      benming: resp!.benming,
      userId: user.id,
    });
    setSaved(true);
  }

  return (
    <div className="container result">
      <XiuHero resp={resp} />
      <Disclaimer />

      <div className="analysis-list">
        {entry
          ? ANALYSIS_SECTIONS.map((s) => (
              <AnalysisSection
                key={s.key}
                label={s.label}
                body={entry.sections[s.key]}
                placeholder={entry.placeholder}
              />
            ))
          : (
              <p className="muted">
                「{resp.benming.xiu}」宿的解读内容整理中（示例阶段仅少数宿有内容）。
              </p>
            )}

        {timeHelpText && (
          <AnalysisSection label={`时辰辅助 · ${resp.timeZhi}时`} body={timeHelpText} placeholder />
        )}
      </div>

      <ResultCard resp={resp} />

      <div className="result__actions">
        <button className="cta" onClick={handleSave} disabled={saved}>
          {saved ? "已保存" : "保存这条测算"}
        </button>
        <button className="btn-ghost" onClick={() => navigate("/")}>再测一个</button>
      </div>
    </div>
  );
}
