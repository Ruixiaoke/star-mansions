import { useEffect, useRef, useState } from "react";
import { hexagramOfShape } from "./GuaReading";
import { findTopic } from "../data/liuyao-topics";
import { castingFromCode } from "../lib/liuyao";
import type { DivinationRecord } from "../types/contract";

/**
 * 卦例列表（六爻 PRD §20 产物 P1 / §23-Q1 选 A）。「我的」页面与 `/liuyao` 页内回看**共用这一个组件**。
 *
 * 比照 `components/HistoryList.tsx` 的写法，但**不复用 `.history__item` 样式类** ——
 * 那个类挂着 `border-left: 3px solid var(--xiang)`（四象色），四象色是二十八宿主线的分类语义色，
 * 挪给六爻会污染视觉语言（六爻 PRD §13 / CLAUDE.md §4-2）。故另走 `.liuyao__record*`。
 *
 * ⚠️ 删除是**物理删除、不可恢复**（PRD §14：用户以为删掉了就该是删掉了，服务端不做软删标记），
 *    比「重新起卦」更不可逆，因此**必须二次确认**；确认走页面内组件，
 *    **不许用浏览器 `confirm()`**（PRD §13 —— 浏览器弹窗还会阻塞整个自动化会话）。
 */

/** 保存时间的本地化显示；`createdAt` 不合法就原样回显，不猜。 */
export function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

interface DivinationListProps {
  items: DivinationRecord[];
  onRemove?: (id: string) => void;
  /** 传了才显示「回看」按钮（`/liuyao` 页内回看用；「我的」页面不传，不在那里展开整卦）。 */
  onReview?: (id: string) => void;
  /** 正在回看的那条，用于把按钮切成「收起」。 */
  reviewingId?: string | null;
}

/** 由卦码还原卦名（**不重新掷**，PRD §5.5）。卦码坏了就如实说，不猜一个卦出来。 */
function guaNamesOf(code: string): { primary: string; changed: string | null } | null {
  const casting = castingFromCode(code);
  if (!casting) return null;
  return {
    primary: hexagramOfShape(casting.primary).name,
    changed: casting.changed ? hexagramOfShape(casting.changed).name : null,
  };
}

export function DivinationList({ items, onRemove, onReview, reviewingId }: DivinationListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 同一时刻只会开一个确认块，单个 ref 够用；开了就把焦点送过去，键盘用户不必自己找
  useEffect(() => {
    if (pendingId) confirmRef.current?.focus();
  }, [pendingId]);

  if (items.length === 0) return <p className="muted">还没有保存的卦例。</p>;

  return (
    <ul className="liuyao__record-list">
      {items.map((record) => {
        const names = guaNamesOf(record.code);
        const topicLabel = findTopic(record.topic)?.label ?? record.topic;
        const confirming = pendingId === record.id;

        return (
          <li className="liuyao__record" key={record.id}>
            <div>
              <p className="liuyao__record-name">
                {names ? names.primary : "卦码无法解析"}
                {names?.changed && <span className="liuyao__record-changed"> 之卦 {names.changed}</span>}
              </p>
              <p className="liuyao__record-meta">
                {topicLabel} · 卦码 <code>{record.code}</code> · 存于 {formatSavedAt(record.createdAt)}
              </p>
            </div>

            <div className="liuyao__record-actions">
              {onReview && (
                <button type="button" className="link-btn" onClick={() => onReview(record.id)}>
                  {reviewingId === record.id ? "收起" : "回看"}
                </button>
              )}
              {onRemove && !confirming && (
                <button type="button" className="link-btn" onClick={() => setPendingId(record.id)}>
                  删除
                </button>
              )}
            </div>

            {onRemove && confirming && (
              <div
                className="liuyao__confirm"
                role="alertdialog"
                aria-labelledby={`liuyao-del-${record.id}`}
              >
                <p id={`liuyao-del-${record.id}`}>
                  删除这条卦例后<strong>不可恢复</strong>：服务端是物理删除，不做回收站、也不留软删标记。
                  确定删除吗？
                </p>
                <div className="liuyao__confirm-actions">
                  <button
                    type="button"
                    className="cta"
                    ref={confirmRef}
                    onClick={() => {
                      setPendingId(null);
                      onRemove(record.id);
                    }}
                  >
                    确定删除
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setPendingId(null)}>
                    取消
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
