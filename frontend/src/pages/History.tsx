import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { DivinationRecord, Reading, User } from "../types/contract";
import { authAdapter } from "../lib/authAdapter";
import { readingStore } from "../lib/readingStore";
import { divinationStore } from "../lib/divinationStore";
import { ApiClientError } from "../lib/api";
import { HistoryList } from "../components/HistoryList";
import { DivinationList } from "../components/DivinationList";

/**
 * 我的记录：登录后展示保存过的记录，可删除（隐私红线：可删除）。
 * 两类记录**分区展示**（二十八宿测算 / 六爻卦例，六爻 PRD §23-Q1 选 A）：
 * 各自有可见标题、各自的加载与错误状态，一边挂了不影响另一边。
 * ⚠️ 二十八宿那一区（`readingStore` + `HistoryList` + 删除逻辑）**零改动**，只是被包进了一个 section。
 */
export function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [divinations, setDivinations] = useState<DivinationRecord[]>([]);
  const [divLoading, setDivLoading] = useState(true);
  const [divErr, setDivErr] = useState<string | null>(null);

  useEffect(() => {
    const u = authAdapter.currentUser();
    setUser(u);
    if (!u) {
      setLoading(false);
      setDivLoading(false);
      return;
    }
    let alive = true;
    readingStore
      .list()
      .then((r) => alive && setItems(r))
      .catch((e: unknown) => alive && setErr(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => alive && setLoading(false));
    // 两个端点各拉各的：卦例挂了不该把测算记录一起拖下水
    divinationStore
      .list()
      .then((d) => alive && setDivinations(d))
      .catch((e: unknown) => alive && setDivErr(e instanceof ApiClientError ? e.message : "卦例加载失败"))
      .finally(() => alive && setDivLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!user) {
    return (
      <div className="container narrow center">
        <p className="muted">登录后可查看已保存的测算记录与卦例。</p>
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

  /** 卦例删除是物理删除、不可恢复；二次确认在 `DivinationList` 里（页面内组件，不用浏览器 confirm）。 */
  async function handleDivinationRemove(id: string) {
    setDivErr(null);
    try {
      await divinationStore.remove(id);
      setDivinations(await divinationStore.list());
    } catch (e) {
      setDivErr(e instanceof ApiClientError ? e.message : "删除失败");
    }
  }

  function handleLogout() {
    authAdapter.logout();
    navigate("/");
  }

  return (
    <div className="container narrow">
      <h1 className="page-title">我的记录</h1>
      <p className="muted">
        {user.email} · <button type="button" className="link-btn" onClick={handleLogout}>退出登录</button>
      </p>
      {err && <p className="form-err">{err}</p>}

      <section className="history__section">
        <h2 className="section-h">二十八宿 · 测算记录</h2>
        {loading ? <p className="muted">加载中…</p> : <HistoryList items={items} onRemove={handleRemove} />}
      </section>

      <section className="history__section">
        <h2 className="section-h">六爻 · 卦例</h2>
        {divErr && <p className="form-err">{divErr}</p>}
        {divLoading ? (
          <p className="muted">加载中…</p>
        ) : (
          <DivinationList items={divinations} onRemove={handleDivinationRemove} />
        )}
      </section>

      <p>
        <Link className="btn-ghost" to="/">再测一个</Link>
      </p>
    </div>
  );
}
