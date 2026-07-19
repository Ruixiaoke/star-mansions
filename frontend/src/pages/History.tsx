import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Reading, User } from "../types/contract";
import { authAdapter } from "../lib/authAdapter";
import { readingStore } from "../lib/readingStore";
import { ApiClientError } from "../lib/api";
import { HistoryList } from "../components/HistoryList";

/** 我的测算：登录后展示保存过的记录，可删除（隐私红线：可删除）。 */
export function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = authAdapter.currentUser();
    setUser(u);
    if (!u) {
      setLoading(false);
      return;
    }
    let alive = true;
    readingStore
      .list()
      .then((r) => alive && setItems(r))
      .catch((e: unknown) => alive && setErr(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!user) {
    return (
      <div className="container narrow center">
        <p className="muted">登录后可查看已保存的测算记录。</p>
        <button className="cta" onClick={() => navigate("/login", { state: { redirect: "/history" } })}>
          去登录
        </button>
      </div>
    );
  }

  async function handleRemove(id: string) {
    try {
      await readingStore.remove(id);
      setItems(await readingStore.list());
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "删除失败");
    }
  }

  function handleLogout() {
    authAdapter.logout();
    navigate("/");
  }

  return (
    <div className="container narrow">
      <h1 className="page-title">我的测算</h1>
      <p className="muted">
        {user.email} · <button type="button" className="link-btn" onClick={handleLogout}>退出登录</button>
      </p>
      {err && <p className="form-err">{err}</p>}
      {loading ? <p className="muted">加载中…</p> : <HistoryList items={items} onRemove={handleRemove} />}
      <p>
        <Link className="btn-ghost" to="/">再测一个</Link>
      </p>
    </div>
  );
}
