import { useState, type FormEvent } from "react";
import type { User } from "../types/contract";
import { authAdapter } from "../lib/authAdapter";

/** 邮箱直登表单（PRD §6/§8）——登录 = 注册合一，无验证步骤。 */
export function AuthForm({ onLoggedIn }: { onLoggedIn?: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const user = authAdapter.login(email);
      setErr(null);
      onLoggedIn?.(user);
    } catch (x) {
      setErr((x as Error).message);
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
      {err && <p className="form-err">{err}</p>}
      <button className="cta" type="submit">登录 / 注册</button>
    </form>
  );
}
