import { HashRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Result } from "./pages/Result";
import { Login } from "./pages/Login";
import { History } from "./pages/History";
import { About } from "./pages/About";
import { Disclaimer } from "./components/Disclaimer";

// HashRouter：GitHub Pages 子路径下刷新不 404，零服务端配置。
export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="nav">
          <Link to="/" className="nav__brand">二十八宿</Link>
          <nav className="nav__links">
            <NavLink to="/" end>测算</NavLink>
            <NavLink to="/history">我的</NavLink>
            <NavLink to="/about">关于</NavLink>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/result" element={<Result />} />
            <Route path="/login" element={<Login />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="footer">
          <Disclaimer compact />
        </footer>
      </div>
    </HashRouter>
  );
}
