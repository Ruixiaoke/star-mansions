import { useState, type FormEvent } from "react";
import type { User } from "../types/contract";
import { authAdapter } from "../lib/authAdapter";

/**
 * 邮箱直登表单（PRD §6/§8）——登录 = 注册合一，无验证步骤。
 *
 * ⚠️ **表单下方那句鉴权限制告知不许删、不许弱化**（六爻 PRD §14「已知限制」）：
 *    本版 token 由邮箱确定性推出、无秘密值参与，知道邮箱即可读写他人记录。这是 MVP 取舍，
 *    但必须在**用户交出邮箱的那一刻**说清楚，只写在 About 等于没说。
 *    文案纪律：可以说「你能做什么」（可删除、未登录不上传），
 *    **不得**说「只有你能看到」「他人无法读取或删除」「你的数据是安全的」。
 *    `/liuyao` 与 `/history` 的登录引导最终都走本组件，改这一处即覆盖所有入口。
 */
export function AuthForm({ onLoggedIn }: { onLoggedIn?: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const user = await authAdapter.login(email);
      setErr(null);
      onLoggedIn?.(user);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <label className="field">
        <span className="field__label">邮箱</span>
        <input
          className="field__input"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <p className="muted">
        填邮箱即登录 / 建号，无需验证码。邮箱仅作软标识，可随时删除记录与账号（隐私说明见 About）。
      </p>
      {/* 鉴权限制必须在**用户交出邮箱的这一刻**告知，不能只写在 About —— 没人会先读 About 再登录。
          措辞与 About 隐私一节逐字一致（六爻 PRD §14「已知限制」）。 */}
      <p className="muted">
        ⚠️ 本站不验证邮箱所有权，也没有密码或验证码，这意味着
        <strong>知道你邮箱的人，有可能读到或删除你保存的记录</strong>
        （测算记录与卦例都一样，详见 About 隐私说明）。
      </p>
      {err && <p className="form-err">{err}</p>}
      <button className="cta" type="submit" disabled={busy}>
        {busy ? "登录中…" : "登录 / 注册"}
      </button>
    </form>
  );
}
