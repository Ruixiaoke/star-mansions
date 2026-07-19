import { useNavigate, Link } from "react-router-dom";
import type { BirthInput } from "../types/contract";
import { BirthdayInput } from "../components/BirthdayInput";

/** 落地页：价值主张 + 生日输入入口（核心 CTA）。 */
export function Landing() {
  const navigate = useNavigate();

  function handleSubmit(input: BirthInput) {
    // 收集输入后跳结果页，由结果页调 /api/compute（展示排盘载入）
    navigate("/result", { state: { input } });
  }

  return (
    <div className="container landing">
      <section className="hero">
        <p className="hero__eyebrow">中国二十八宿 · 值日法</p>
        <h1 className="hero__title">本命星宿</h1>
        <p className="hero__lede">输入你的生日，算出本命星宿，看它的形象、星图与七维解读。</p>
      </section>

      <section className="panel">
        <BirthdayInput onSubmit={handleSubmit} />
      </section>

      <p className="muted center">
        文化 + 娱乐向的自我认知工具，非命理预测。 <Link to="/about">了解依据 / 免责</Link>
      </p>
    </div>
  );
}
