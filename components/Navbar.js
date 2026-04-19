"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Star, CreditCard, Sun, Moon, Pickaxe, Menu, X, Hexagon, LogOut, User, BookOpen } from "lucide-react";
import { signOut } from "next-auth/react";
import { useUser } from "@/components/UserProvider";
import { useSettings } from "@/components/SettingsProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useUser();
  const settings = useSettings();

  // Hide navbar on admin, auth, and landing pages
  const hideOn = ["/admin", "/auth", "/"];
  if (hideOn.some(p => p === "/" ? pathname === "/" : pathname.startsWith(p))) return null;

  const mockUser = user || { name: "สมชาย ใจดี", points: 0, plan: "Free" };
  const displayName = mockUser.username || mockUser.email?.split("@")[0] || "User";

  const NAV = [
    { href: "/overview", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/plans", label: "แพ็กเกจ", icon: Star },
    { href: "/payments", label: "เติมเงิน", icon: CreditCard },
    { href: "/docs", label: "คู่มือ", icon: BookOpen },
  ];

  return (
    <>
      <div className="fixed top-4 w-full z-50 flex justify-center px-4">

        {/*  */}
        {profileDropdownOpen && (
          <div className="fixed inset-0 w-screen h-screen z-40" onClick={() => setProfileDropdownOpen(false)}></div>
        )}

        <nav className="w-full max-w-5xl bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl px-3 md:px-4 py-2 flex items-center justify-between shadow-sm transition-all relative z-50">

          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/overview" className="flex items-center gap-2.5 pl-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-sm shrink-0">
                <Pickaxe size={14} />
              </div>
              <span className="font-syne font-bold text-base text-gray-900 dark:text-[#e8ecf4] tracking-tight truncate max-w-[120px] md:max-w-none">{settings.siteName}</span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {NAV.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-all font-medium ${active
                      ? "text-[#10d97e] bg-[#10d97e]/10"
                      : "text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/payments" className="hidden md:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-2.5 py-1 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
              <Hexagon size={14} className="text-amber-500" />
              <span className="font-syne font-extrabold text-amber-600 dark:text-amber-500 text-xs">{mockUser.points?.toLocaleString() || 0} <span className="font-sans text-[10px]">Pts</span></span>
            </Link>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {hydrated ? (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <Sun size={16} className="opacity-0" />}
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden md:block" />

            {/* Profile Pillar */}
            <div className="flex items-center relative">
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 md:px-2 md:py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none"
              >
                <div className="w-8 h-8 md:w-7 md:h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#4d8fff] to-[#9d6fff] flex items-center justify-center text-[12px] md:text-[11px] font-bold text-white shadow-sm overflow-hidden">
                  {mockUser.image ? (
                    <img src={mockUser.image} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    (displayName?.[0]?.toUpperCase() || "?")
                  )}
                </div>
                <span className="text-[13px] font-semibold text-gray-700 dark:text-[#e8ecf4] max-w-[100px] truncate hidden md:block">{displayName}</span>
              </div>

              {/* Profile Dropdown Container */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-14 md:top-12 w-56 bg-white dark:bg-[#0f141e] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl shadow-xl dark:shadow-2xl py-2 animate-slide-up z-[60]">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 mb-1">
                    <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4] truncate">{displayName}</div>
                    <div className="text-[11px] text-gray-500 dark:text-[#8892a4]">{typeof mockUser.plan === 'object' ? mockUser.plan?.displayName : mockUser.plan} Plan</div>
                  </div>
                  <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#e8ecf4] hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors">
                    <User size={16} /> แก้ไขโปรไฟล์และรหัสผ่าน
                  </Link>
                  <Link href="/payments" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#e8ecf4] hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors">
                    <CreditCard size={16} /> เติมเงินและประวัติ
                  </Link>
                  {settings.discordUrl && (
                    <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" /></svg>
                      Discord Server
                    </a>
                  )}
                  <button onClick={() => { setProfileDropdownOpen(false); signOut({ callbackUrl: "/auth/login" }); }} className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-[13px] text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-gray-100 dark:border-[#1e2330] mt-1">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-900 dark:text-[#e8ecf4] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setProfileDropdownOpen(false); }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu (Original Beautiful Clean Design) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[88px] left-4 right-4 bg-white/90 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl p-4 shadow-xl z-40 animate-fade-in">
          <div className="flex flex-col gap-2">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (

                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${active
                    ? "text-[#10d97e] bg-[#10d97e]/10"
                    : "text-gray-600 dark:text-[#8892a4] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <div className="h-px bg-gray-200 dark:bg-white/5 my-2" />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4d8fff] to-[#9d6fff] flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                  {mockUser.image ? (
                    <img src={mockUser.image} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    (displayName?.[0]?.toUpperCase() || "?")
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-gray-900 dark:text-[#e8ecf4]">{displayName}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-amber-500 font-bold">{mockUser.points?.toLocaleString() || 0} Pts</span>
                    <span className="text-gray-300 dark:text-[#4a5568] text-[10px]">|</span>
                    <span className="text-[12px] text-gray-500 dark:text-[#4a5568]">{typeof mockUser.plan === 'object' ? mockUser.plan?.displayName : mockUser.plan}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="p-2 text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-lg">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer so page content doesn't hide behind the floating navbar */}
      <div className="h-[72px]" />
    </>
  );
}
