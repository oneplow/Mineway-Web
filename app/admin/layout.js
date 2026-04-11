import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
    <div className="h-screen overflow-hidden bg-[#050505] text-white flex flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <AdminSidebar user={session.user} />

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
