import { Disclaimer } from "../components/Disclaimer";

/** 关于 / 免责 / 隐私（红线落地页）。 */
export function About() {
  return (
    <div className="container narrow about">
      <h1 className="page-title">关于 · 免责 · 隐私</h1>

      <section className="about__block">
        <h2 className="section-h">测算依据</h2>
        <p>
          本命宿采用《宿曜经》按农历生日的定宿法：依出生的农历月与农历日，从该月「望宿」起、
          按二十七宿序（去牛宿）顺数「农历日 + 13」位定出本命宿，与出生年份、时辰无关。
          公历 / 农历换算由成熟历法库 <code>lunar-javascript</code> 负责，本命宿算法依《宿曜经》原文并经多样本交叉校验。
        </p>
        <p className="muted">
          注：老黄历的「值日星宿」（每日轮值、逐年变）与《宿曜经》按农历生日的「本命宿」是不同概念，本站取后者。
        </p>
        <p className="muted">
          星图按装饰 / 示意处理，不宣称天文精确。各宿释义依该宿的传统属性
          （四象方位、七政五行、禽象与星官本义，多见于《史记·天官书》《步天歌》等星象体系）整理编写，
          作传统文化 / 娱乐参考，不冒充权威定论，亦不作吉凶恐吓。
        </p>
      </section>

      <section className="about__block">
        <h2 className="section-h">免责声明</h2>
        <Disclaimer />
      </section>

      <section className="about__block">
        <h2 className="section-h">隐私说明</h2>
        <p>
          生日与邮箱属敏感个人信息：仅用于测算与（登录后）保存记录；未登录不强制留存；
          邮箱免验证直登、仅作软标识；你可随时删除自己的记录与账号；不向第三方售卖。
        </p>
      </section>
    </div>
  );
}
