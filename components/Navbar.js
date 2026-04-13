"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, Star, CreditCard, Sun, Moon, Pickaxe, Menu, X, Hexagon, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useUser } from "@/components/UserProvider";
import { useSettings } from "@/components/SettingsProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useUser();
  const settings = useSettings();

  useEffect(() => setMounted(true), []);

  // Hide navbar on admin, auth, and landing pages
  const hideOn = ["/admin", "/auth", "/"];
  if (hideOn.some(p => p === "/" ? pathname === "/" : pathname.startsWith(p))) return null;

  const mockUser = user || { name: "สมชาย ใจดี", points: 0, plan: "Free" };

  const NAV = [
    { href: "/overview", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/plans", label: "แพ็กเกจ", icon: Star },
    { href: "/payments", label: "เติมเงิน", icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-50 ring-1 ring-black/5 dark:ring-white/5 bg-white/70 dark:bg-[#0a0c10]/80 backdrop-blur-2xl px-4 md:px-8 transition-colors duration-300 shadow-sm dark:shadow-none">
      <div className="max-w-[1100px] mx-auto h-16 flex items-center justify-between">

        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/overview" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_10px_rgba(16,217,126,0.3)]">
              <Pickaxe size={16} />
            </div>
            <span className="font-syne font-extrabold text-lg text-gray-900 dark:text-[#e8ecf4] tracking-tight">{settings.siteName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] transition-all font-medium border border-transparent ${active
                    ? "text-[#10d97e] bg-[#10d97e]/10 border-[#10d97e]/20 shadow-sm"
                    : "text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-[#e8ecf4] hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/5 dark:hover:border-white/5"
                    }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/payments" className="hidden md:flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
            <Hexagon size={16} className="text-amber-500" />
            <span className="font-syne font-extrabold text-amber-600 dark:text-amber-500 text-sm">{mockUser.points.toLocaleString()} <span className="font-sans text-xs">Pts</span></span>
          </Link>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/5 transition-all"
          >
            {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
          </button>

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-black/5 dark:border-white/5 relative">
            <div className="text-right hidden lg:block">
              <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4] leading-tight">{mockUser.username}</div>
              <div className="text-[11px] text-gray-500 dark:text-[#4a5568]">{typeof mockUser.plan === 'object' ? mockUser.plan?.displayName : mockUser.plan} Plan</div>
            </div>
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d8fff] to-[#9d6fff] flex items-center justify-center text-[13px] font-bold text-white shadow-sm cursor-pointer hover:brightness-110 transition-all select-none overflow-hidden"
            >
              {mockUser.image ? (
                <img src={mockUser.image} alt={mockUser.username} className="w-full h-full object-cover" />
              ) : (
                (mockUser.username?.[0]?.toUpperCase() || "?")
              )}
            </div>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[45]" onClick={() => setProfileDropdownOpen(false)}></div>
                <div className="absolute right-0 top-14 w-56 bg-white/90 dark:bg-[#0f141e]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-2xl shadow-xl dark:shadow-2xl py-2 animate-slide-up z-50">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 mb-1">
                    <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4]">{mockUser.username}</div>
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
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
                      Discord Server
                    </a>
                  )}
                  <button onClick={() => { setProfileDropdownOpen(false); signOut({ callbackUrl: "/auth/signin" }); }} className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-[13px] text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-gray-100 dark:border-[#1e2330] mt-1">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-xl text-gray-900 dark:text-[#e8ecf4] hover:bg-black/5 dark:hover:bg-white/5 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/5 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[65px] left-0 right-0 bg-white/90 dark:bg-[#0f141e]/90 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/5 p-4 shadow-xl z-40 animate-fade-in">
          <div className="flex flex-col gap-2">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all border ${active
                    ? "text-[#10d97e] bg-[#10d97e]/10 border-[#10d97e]/20"
                    : "text-gray-600 dark:text-[#8892a4] border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/5 dark:hover:border-white/5"
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <div className="h-px bg-gray-200 dark:bg-[#1e2330] my-2" />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4d8fff] to-[#9d6fff] flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                  {mockUser.image ? (
                    <img src={mockUser.image} alt={mockUser.username} className="w-full h-full object-cover" />
                  ) : (
                    (mockUser.username?.[0]?.toUpperCase() || "?")
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-gray-900 dark:text-[#e8ecf4]">{mockUser.username}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-amber-500 font-bold">{mockUser.points.toLocaleString()} Pts</span>
                    <span className="text-gray-300 dark:text-[#4a5568] text-[10px]">|</span>
                    <span className="text-[12px] text-gray-500 dark:text-[#4a5568]">{typeof mockUser.plan === 'object' ? mockUser.plan?.displayName : mockUser.plan}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
