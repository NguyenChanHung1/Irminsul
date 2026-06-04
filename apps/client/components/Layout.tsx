import Link from "next/link";
import { ReactNode, useState } from "react";
import { useRouter } from "next/router";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const isActive = (href: string) => router.pathname === href;

  return (
    <div className={`app-shell ${darkMode ? "dark-theme" : "light-theme"}`}>
      {/* Header */}
      <header className="site-header">
        <div className="header-left">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <Link href="/" className="brand">
            <div className="brand-mark">🌿</div>
            <div>
              <h1>Irminsul</h1>
              <p>World Tree of Teyvat</p>
            </div>
          </Link>
        </div>

        <div className="header-right">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <Link href="/profile" className="profile-link">
            👤 Profile
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <nav className="sidebar-nav">
            {/* Main navigation */}
            <div className="nav-section">
              <h3>Core</h3>
              <Link href="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
                🏠 Home
              </Link>
            </div>

            {/* Database pages */}
            <div className="nav-section">
              <h3>Database</h3>
              <Link href="/characters" className={`nav-item ${isActive("/characters") ? "active" : ""}`}>
                🗡️ Characters
              </Link>
              <Link href="/weapons" className={`nav-item ${isActive("/weapons") ? "active" : ""}`}>
                ⚔️ Weapons
              </Link>
              <Link href="/artifacts" className={`nav-item ${isActive("/artifacts") ? "active" : ""}`}>
                ✨ Artifacts
              </Link>
              <Link href="/items" className={`nav-item ${isActive("/items") ? "active" : ""}`}>
                📦 Items
              </Link>
            </div>

            {/* Analytics */}
            <div className="nav-section">
              <h3>Analytics</h3>
              <Link href="/abyss" className={`nav-item ${isActive("/abyss") ? "active" : ""}`}>
                ⚡ Spiral Abyss
              </Link>
              <Link href="/stygian" className={`nav-item ${isActive("/stygian") ? "active" : ""}`}>
                🌑 Stygian Onslaught
              </Link>
              <Link href="/pick-rates" className={`nav-item ${isActive("/pick-rates") ? "active" : ""}`}>
                📊 Pick Rates
              </Link>
              <Link href="/teams" className={`nav-item ${isActive("/teams") ? "active" : ""}`}>
                👥 Teams
              </Link>
            </div>

            {/* Tools */}
            <div className="nav-section">
              <h3>Tools</h3>
              <Link href="/search" className={`nav-item ${isActive("/search") ? "active" : ""}`}>
                🔍 UID Search
              </Link>
              <Link href="/simulator" className={`nav-item ${isActive("/simulator") ? "active" : ""}`}>
                ⚙️ Simulator
              </Link>
            </div>

            {/* Archives */}
            <div className="nav-section">
              <h3>Info</h3>
              <Link href="/about" className={`nav-item ${isActive("/about") ? "active" : ""}`}>
                ℹ️ About
              </Link>
              <Link href="/lore" className={`nav-item ${isActive("/lore") ? "active" : ""}`}>
                📖 Lore
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="page-content">{children}</main>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p>Irminsul — rooted in fantasy, rising through Teyvat.</p>
        <p className="footer-version">v0.1.0 • Built with Next.js + Prisma</p>
      </footer>
    </div>
  );
}
