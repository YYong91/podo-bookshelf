import { Home, Search, BookOpen, Library, BarChart3, Download } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BUDGET_URL = import.meta.env.VITE_BUDGET_URL || "http://localhost:5174";

const navItems = [
  { to: "/", icon: Home, label: "정원" },
  { to: "/search", icon: Search, label: "검색" },
  { to: "/bookshelf", icon: BookOpen, label: "책장" },
  { to: "/reviews", icon: Library, label: "목록" },
  { to: "/stats", icon: BarChart3, label: "통계" },
];

function handleExport() {
  const a = document.createElement("a");
  a.href = "/api/export";
  a.download = `podo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

export default function BottomNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white md:fixed md:left-0 md:top-0 md:h-full md:w-60 md:border-r md:border-t-0 md:bg-cream">
      <div className="hidden p-6 md:block">
        <h1 className="text-2xl font-bold text-grape-700">🍇 포도책장</h1>
      </div>
      <div className="flex justify-around py-2 md:flex-col md:gap-1 md:px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                isActive
                  ? "text-grape-700 bg-grape-50 md:border-l-3 md:border-grape-500"
                  : "text-warm-600 hover:bg-warm-100 hover:text-warm-700"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        {/* 모바일 전용: 포도가계부 링크 */}
        <a
          href={BUDGET_URL}
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-warm-600 hover:text-warm-700 md:hidden"
        >
          <span className="text-base">💰</span>
          <span>가계부</span>
        </a>
      </div>
      <div className="hidden md:block md:absolute md:bottom-0 md:left-0 md:right-0 md:px-3 md:pb-3 md:border-t md:border-warm-200 md:pt-3 text-sm space-y-1">
        {user && (
          <div className="px-3 py-2 text-warm-600 font-medium truncate">
            {user.name}
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warm-500 transition-colors hover:text-grape-600 hover:bg-grape-50"
        >
          로그아웃
        </button>
        <a
          href={BUDGET_URL}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warm-500 transition-colors hover:text-grape-600 hover:bg-grape-50"
        >
          <span className="text-base">🍇</span>
          <span>포도가계부</span>
        </a>
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warm-500 transition-colors hover:text-grape-600 hover:bg-grape-50"
        >
          <Download size={18} />
          <span>백업 다운로드</span>
        </button>
      </div>
    </nav>
  );
}
