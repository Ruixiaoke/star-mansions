/**
 * 释义库（XiuEntry × 28）—— 静态内容，前端直接读（PRD §9）。
 *
 * 🚨 内容纪律（红线 §0-2 / PRD §10）：正式文案须基于可查传统资料整理、标注来源、人工定稿。
 *    scaffold 阶段只放【示例·占位】文本，绝不 AI 现编冒充权威；未定稿一律显式标占位。
 *    释义库补全（全 28 宿真内容）是独立的内容工作量，另行排期。
 */

export interface XiuSections {
  meaning: string;
  benming: string;
  life: string;
  personality: string;
  career: string;
  wealth: string;
  love: string;
}

export interface XiuEntry {
  xiu: string;
  /** true = 示例占位，未定稿 */
  placeholder: boolean;
  sections: XiuSections;
  /** 时辰辅助：地支 → 文案（PRD §7 决策 3）。占位。 */
  timeHelp?: Partial<Record<string, string>>;
}

/** 结果页七大解读板块的顺序与标题（PRD §4）。 */
export const ANALYSIS_SECTIONS: { key: keyof XiuSections; label: string }[] = [
  { key: "meaning", label: "意义" },
  { key: "benming", label: "本命" },
  { key: "life", label: "一生命运" },
  { key: "personality", label: "性格" },
  { key: "career", label: "事业" },
  { key: "wealth", label: "财运" },
  { key: "love", label: "爱情" },
];

function placeholderSections(xiu: string): XiuSections {
  const note = (dim: string) =>
    `【示例·占位】此处为「${xiu}」宿的「${dim}」解读示例。正式内容将基于可查传统资料整理、标注来源、人工定稿后替换，当前不作任何权威结论。`;
  return {
    meaning: note("意义"),
    benming: note("本命"),
    life: note("一生命运"),
    personality: note("性格"),
    career: note("事业"),
    wealth: note("财运"),
    love: note("爱情"),
  };
}

/**
 * 示例条目：仅列少数宿做流程演示（含测试日期 1998-06-15 对应的「危」）。
 * 其余宿暂无条目 → 结果页显示「内容整理中」占位。
 */
const ENTRIES: Record<string, XiuEntry> = {
  危: {
    xiu: "危",
    placeholder: true,
    sections: placeholderSections("危"),
    timeHelp: {
      子: "【示例·占位】子时相关的时辰辅助文案示例。",
      未: "【示例·占位】未时相关的时辰辅助文案示例。",
    },
  },
  房: {
    xiu: "房",
    placeholder: true,
    sections: placeholderSections("房"),
  },
};

export function getReading(xiu: string): XiuEntry | null {
  return ENTRIES[xiu] ?? null;
}
