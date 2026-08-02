import { useState, type FormEvent } from "react";
import { evaluate, type Operator } from "../lib/arithmetic";

const OPERATORS: { value: Operator; label: string }[] = [
  { value: "add", label: "加法（+）" },
  { value: "sub", label: "减法（−）" },
];

const EMPTY_HINT = "请输入两个整数并点击显示答案";

/**
 * 整数加减法计算器（docs/prd/addition-subtraction-prd.md）。
 * 与二十八星宿测算无关的独立工具页；校验/计算全部委托 lib/arithmetic。
 * 输入框用 type="text"（不用 number）：number 会把「abc」直接吞成空串，
 * 分不出「空」和「非法字符」两种提示；且移动端数字键盘打不出负号。
 */
export function Calculator() {
  const [rawA, setRawA] = useState("");
  const [rawB, setRawB] = useState("");
  const [op, setOp] = useState<Operator>("add");
  const [errors, setErrors] = useState<{ a?: string; b?: string }>({});
  const [expression, setExpression] = useState<string | null>(null);

  // 提交时才校验（PRD §4.4）；Enter 键由 form 原生 submit 覆盖（PRD §7）。
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = evaluate(rawA, rawB, op);
    if (result.ok) {
      setErrors({});
      setExpression(result.expression);
    } else {
      // 校验失败不计算，并清掉上一次结果，避免旧答案与新错误同屏（PRD §4.4）
      setErrors(result.errors);
      setExpression(null);
    }
  }

  // 用户一改这一格就撤掉它的报错，不让过期提示挂在屏幕上（下次提交重新校验）
  function changeA(value: string) {
    setRawA(value);
    if (errors.a) setErrors((prev) => ({ ...prev, a: undefined }));
  }

  function changeB(value: string) {
    setRawB(value);
    if (errors.b) setErrors((prev) => ({ ...prev, b: undefined }));
  }

  return (
    <div className="container narrow">
      <h1 className="page-title">整数加减法计算器</h1>
      <p className="muted">输入两个整数，选择加法或减法，点击「显示答案」查看结果。</p>

      <form className="panel calc" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="calc-a">
            整数 A
          </label>
          <input
            id="calc-a"
            className="field__input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={rawA}
            onChange={(e) => changeA(e.target.value)}
            aria-invalid={errors.a ? true : undefined}
            aria-describedby={errors.a ? "calc-a-err" : undefined}
          />
          {errors.a && (
            <p className="form-err" id="calc-a-err" role="alert">
              <span aria-hidden="true">⚠ </span>
              {errors.a}
            </p>
          )}
        </div>

        {/* 同名 radio 天然成组，组名由 fieldset/legend 给出 —— 不再叠 role="radiogroup"，避免读屏重复播报 */}
        <fieldset className="calc__ops">
          <legend className="field__label">运算类型</legend>
          <div className="seg-group">
            {OPERATORS.map((o) => (
              <label key={o.value} className="seg calc__seg" data-active={op === o.value}>
                <input
                  className="calc__radio"
                  type="radio"
                  name="operator"
                  value={o.value}
                  checked={op === o.value}
                  onChange={() => setOp(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field__label" htmlFor="calc-b">
            整数 B
          </label>
          <input
            id="calc-b"
            className="field__input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={rawB}
            onChange={(e) => changeB(e.target.value)}
            aria-invalid={errors.b ? true : undefined}
            aria-describedby={errors.b ? "calc-b-err" : undefined}
          />
          {errors.b && (
            <p className="form-err" id="calc-b-err" role="alert">
              <span aria-hidden="true">⚠ </span>
              {errors.b}
            </p>
          )}
        </div>

        <button type="submit" className="cta">
          显示答案
        </button>
      </form>

      {/* 结果区常驻在 DOM 里，aria-live 才能在内容变化时播报（PRD §9 无障碍） */}
      <div className="calc__result" aria-live="polite">
        {expression ? (
          <p className="calc__expression">{expression}</p>
        ) : (
          <p className="muted calc__hint">{EMPTY_HINT}</p>
        )}
      </div>
    </div>
  );
}
