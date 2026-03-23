import { Home, Search, BookOpen, Library, BarChart3, Download, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "https://auth.podonest.com";

const navItems = [
  { to: "/", icon: Home, label: "정원" },
  { to: "/search", icon: Search, label: "검색" },
  { to: "/bookshelf", icon: BookOpen, label: "책장" },
  { to: "/reviews", icon: Library, label: "목록" },
  { to: "/stats", icon: BarChart3, label: "통계" },
];

async function handleExport() {
  try {
    const res = await api.get("/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `podo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("백업 다운로드에 실패했어요");
  }
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
      </div>
      <div className="hidden md:block md:absolute md:bottom-0 md:left-0 md:right-0 md:px-3 md:pb-3 md:border-t md:border-warm-200 md:pt-3 text-sm space-y-1">
        {user && (
          <div className="flex items-center gap-1 px-3 py-1.5">
            <a
              href={AUTH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm font-medium text-warm-600 hover:text-grape-600 truncate"
              title="계정 관리"
            >
              {user.name}
            </a>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-warm-400 hover:text-grape-600 hover:bg-grape-50 transition-colors"
              title="로그아웃"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
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
