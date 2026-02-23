import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      <Toaster position="top-center" />
      <main className="pb-20 md:pb-0 md:pl-60">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
