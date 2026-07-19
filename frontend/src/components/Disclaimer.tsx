/** 免责声明（红线 §0-1 / PRD §12）——结果页与 About 页必须显著可见。 */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "disclaimer disclaimer--compact" : "disclaimer"} role="note">
      <strong>免责声明：</strong>
      内容为传统文化 / 娱乐参考，不构成任何人生、医疗、投资、婚姻等决策建议。
    </p>
  );
}
