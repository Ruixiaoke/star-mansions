import { useNavigate, useLocation } from "react-router-dom";
import type { BirthInput } from "../types/contract";
import { AuthForm } from "../components/AuthForm";

/** 登录页：邮箱直登（登录 = 注册合一，无独立注册页）。 */
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirect?: string; input?: BirthInput } | null;
  const redirect = state?.redirect ?? "/history";

  return (
    <div className="container narrow">
      <h1 className="page-title">登录 / 注册</h1>
      <AuthForm
        onLoggedIn={() =>
          navigate(redirect, { state: state?.input ? { input: state.input } : undefined })
        }
      />
    </div>
  );
}
