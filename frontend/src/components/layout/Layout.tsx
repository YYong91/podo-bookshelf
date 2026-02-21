import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LogOut } from "lucide-react";
import BottomNav from "./BottomNav";
import { useAuth } from "../../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream font-sans">
      <Toaster position="top-center" />
      {user && (
        <header className="fixed top-0 right-0 z-40 flex items-center gap-2 px-4 py-2 text-xs text-warm-500">
          <span className="font-medium text-warm-700">{user.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-warm-100"
            title="로그아웃"
          >
            <LogOut size={12} />
          </button>
        </header>
      )}
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
