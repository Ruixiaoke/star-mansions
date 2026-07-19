import type { Reading } from "../types/contract";

/** 测算记录列表（PRD §6）。 */
export function HistoryList({ items, onRemove }: { items: Reading[]; onRemove?: (id: string) => void }) {
  if (items.length === 0) return <p className="muted">还没有保存的测算记录。</p>;
  return (
    <ul className="history">
      {items.map((r) => (
        <li key={r.id} className="history__item" data-xiang={r.benming.siXiang}>
          <div>
            <p className="history__name">{r.benming.fullName}</p>
            <p className="history__meta">
              公历 {r.solarDate} · 保存于 {new Date(r.createdAt).toLocaleDateString()}
            </p>
          </div>
          {onRemove && (
            <button type="button" className="link-btn" onClick={() => onRemove(r.id)}>
              删除
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
