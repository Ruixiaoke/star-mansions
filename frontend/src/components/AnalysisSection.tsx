/** 一个解读板块（标题 + 正文）——七大板块与时辰辅助板块都复用它（PRD §6）。 */
export function AnalysisSection({
  label,
  body,
  placeholder = false,
}: {
  label: string;
  body: string;
  placeholder?: boolean;
}) {
  return (
    <section className="analysis">
      <h2 className="analysis__title">
        {label}
        {placeholder && <span className="analysis__tag">示例占位</span>}
      </h2>
      <p className="analysis__body">{body}</p>
    </section>
  );
}
