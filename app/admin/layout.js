import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Server,
  KeyRound,
  LogOut,
  Settings
} from "lucide-react";

export const metadata = {
  title: "Admin | Mineway",
  description: "Admin Control Panel",
};

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    return redirect("/overview");
  }

  return (
    // ✅ FIX: ใช้ h-screen overflow-hidden บน wrapper และ flex-row ตลอด (ไม่ต้อง responsive toggle)
    <div className="h-screen overflow-hidden bg-[#050505] text-white flex flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* Sidebar — ✅ FIX: ลบ h-auto md:h-screen และ sticky ออก ใช้ flex-shrink-0 แทน */}
      <aside className="w-64 flex-shrink-0 bg-[#0a0c10] border-r border-white/5 flex flex-col h-full z-40 shadow-[10px_0_40px_rgba(0,0,0,0.5)]">

        {/* Brand */}
        <div className="p-8 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 tracking-tighter">
            Mineway
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-gray-400 text-[11px] uppercase tracking-widest font-black">Admin Panel</p>
          </div>
        </div>

        {/* Nav — ✅ FIX: overflow-y-auto ให้ scroll ได้ถ้า nav item เยอะ */}
        <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto custom-scrollbar py-2">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <LayoutDashboard className="h-[18px] w-[18px] text-gray-500 group-hover:text-emerald-400 transition-colors z-10 flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide z-10">Overview</span>
          </Link>

          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <Users className="h-[18px] w-[18px] text-gray-500 group-hover:text-emerald-400 transition-colors z-10 flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide z-10">Users Management</span>
          </Link>

          <Link href="/admin/plans" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <Settings className="h-[18px] w-[18px] text-gray-500 group-hover:text-emerald-400 transition-colors z-10 flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide z-10">Plans & Packages</span>
          </Link>

          <Link href="/admin/tunnels" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <KeyRound className="h-[18px] w-[18px] text-gray-500 group-hover:text-emerald-400 transition-colors z-10 flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide z-10">Tunnels Control</span>
          </Link>

          <div className="pt-6 pb-2">
            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Quick Actions</p>
          </div>

          <Link href="/overview" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group relative border border-transparent hover:border-rose-500">
            <LogOut className="h-[18px] w-[18px] text-gray-500 group-hover:text-rose-400 transition-colors flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide">Exit to Client App</span>
          </Link>
        </nav>

        {/* User Card — ✅ FIX: flex-shrink-0 ป้องกันไม่ให้ถูกบีบหาย */}
        <div className="p-5 flex-shrink-0">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 shadow-inner flex items-center space-x-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-gray-950 font-black shadow-[0_0_15px_rgba(16,217,126,0.5)] z-10 outline outline-2 outline-gray-950 outline-offset-1 flex-shrink-0">
              {session.user.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="z-10 flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{session.user.name || "Administrator"}</p>
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">God Mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content — ✅ FIX: flex-1 min-w-0 overflow-y-auto ให้ scroll ได้ */}
      <main className="flex-1 min-w-0 overflow-y-auto h-full relative bg-[#050505]">
        {/* Background decorations */}
        <div className="fixed top-0 left-64 right-0 h-[500px] bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
        <div className="fixed top-0 right-[10%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto p-6 md:p-10 relative z-10 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
