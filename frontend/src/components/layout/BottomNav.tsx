import { Home, PenSquare, Library } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "정원" },
  { to: "/write", icon: PenSquare, label: "쓰기" },
  { to: "/reviews", icon: Library, label: "목록" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:border-r md:border-t-0">
      <div className="hidden p-6 md:block">
        <h1 className="text-2xl font-bold text-grape-700">🍇 포도책방</h1>
      </div>
      <div className="flex justify-around py-2 md:flex-col md:gap-1 md:px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm ${
                isActive ? "text-grape-700 bg-grape-50" : "text-warm-500 hover:text-grape-600"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
