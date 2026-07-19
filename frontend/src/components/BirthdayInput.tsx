import { useState, type FormEvent } from "react";
import type { BirthInput, Calendar } from "../types/contract";

/** 时辰 → 代表小时（用于调后端；本命宿按「日」定，时辰只驱动辅助板块）。 */
const SHICHEN: { label: string; hour: number }[] = [
  { label: "子时 (23–01)", hour: 0 },
  { label: "丑时 (01–03)", hour: 2 },
  { label: "寅时 (03–05)", hour: 4 },
  { label: "卯时 (05–07)", hour: 6 },
  { label: "辰时 (07–09)", hour: 8 },
  { label: "巳时 (09–11)", hour: 10 },
  { label: "午时 (11–13)", hour: 12 },
  { label: "未时 (13–15)", hour: 14 },
  { label: "申时 (15–17)", hour: 16 },
  { label: "酉时 (17–19)", hour: 18 },
  { label: "戌时 (19–21)", hour: 20 },
  { label: "亥时 (21–23)", hour: 22 },
];

const YEARS = Array.from({ length: 2100 - 1900 + 1 }, (_, i) => 2100 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** 生日输入（公历/农历切换 + 年月日 + 时辰含「不确定」）——核心输入（PRD §6）。 */
export function BirthdayInput({
  onSubmit,
  loading = false,
}: {
  onSubmit: (input: BirthInput) => void;
  loading?: boolean;
}) {
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hourSel, setHourSel] = useState<string>("unknown");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const hour = hourSel === "unknown" ? null : SHICHEN[Number(hourSel)].hour;
    onSubmit({
      calendar,
      year,
      month,
      day,
      hour,
      isLeapMonth: calendar === "lunar" ? isLeapMonth : false,
    });
  }

  return (
    <form className="birthday" onSubmit={handleSubmit}>
      <div className="seg-group" role="group" aria-label="历法">
        <button type="button" className="seg" data-active={calendar === "solar"} onClick={() => setCalendar("solar")}>
          公历
        </button>
        <button type="button" className="seg" data-active={calendar === "lunar"} onClick={() => setCalendar("lunar")}>
          农历
        </button>
      </div>

      <div className="birthday__grid">
        <label className="field">
          <span className="field__label">年</span>
          <select className="field__input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">月</span>
          <select className="field__input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">日</span>
          <select className="field__input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">时辰</span>
          <select className="field__input" value={hourSel} onChange={(e) => setHourSel(e.target.value)}>
            <option value="unknown">不确定</option>
            {SHICHEN.map((s, i) => (
              <option key={i} value={i}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {calendar === "lunar" && (
        <label className="checkbox">
          <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
          <span>闰月</span>
        </label>
      )}

      <button type="submit" className="cta" disabled={loading}>
        {loading ? "排盘中…" : "测算本命宿"}
      </button>
    </form>
  );
}
