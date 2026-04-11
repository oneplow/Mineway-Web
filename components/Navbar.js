"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, Star, CreditCard, Sun, Moon, Pickaxe, Menu, X, Hexagon, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Navbar({ user }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const mockUser = user || { name: "สมชาย ใจดี", points: 247, plan: "Starter" };

  const NAV = [
    { href: "/overview", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/plans", label: "แพ็กเกจ", icon: Star },
    { href: "/payments", label: "เติมเงิน", icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-[#1e2330] bg-white/90 dark:bg-[#0a0c0f]/90 backdrop-blur-xl px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto h-16 flex items-center justify-between">

        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/overview" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_10px_rgba(16,217,126,0.3)]">
              <Pickaxe size={16} />
            </div>
            <span className="font-syne font-extrabold text-lg text-gray-900 dark:text-[#e8ecf4] tracking-tight">Mineway</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] transition-all font-medium ${active
                    ? "text-[#10d97e] bg-[#10d97e]/10"
                    : "text-gray-500 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-[#e8ecf4] hover:bg-gray-100 dark:hover:bg-[#1e2330]"
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
            className="p-2 rounded-xl text-gray-500 dark:text-[#8892a4] hover:bg-gray-100 dark:hover:bg-[#1e2330] transition-colors"
          >
            {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
          </button>

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-[#1e2330] relative">
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
                <div className="absolute top-[120%] right-0 min-w-[200px] bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-opacity py-2">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-[#1e2330] lg:hidden mb-1">
                    <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4]">{mockUser.username}</div>
                    <div className="text-[11px] text-gray-500 dark:text-[#8892a4]">{typeof mockUser.plan === 'object' ? mockUser.plan?.displayName : mockUser.plan} Plan</div>
                  </div>
                  <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#e8ecf4] hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors">
                    <User size={16} /> แก้ไขโปรไฟล์และรหัสผ่าน
                  </Link>
                  <Link href="/payments" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 dark:text-[#e8ecf4] hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors">
                    <CreditCard size={16} /> เติมเงินและประวัติ
                  </Link>
                  <button onClick={() => { setProfileDropdownOpen(false); signOut({ callbackUrl: "/auth/signin" }); }} className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-[13px] text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-gray-100 dark:border-[#1e2330] mt-1">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-xl text-gray-900 dark:text-[#e8ecf4] hover:bg-gray-100 dark:hover:bg-[#1e2330] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[65px] left-0 right-0 bg-white dark:bg-[#0a0c0f] border-b border-gray-200 dark:border-[#1e2330] p-4 shadow-xl z-40 animate-fade-in">
          <div className="flex flex-col gap-2">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${active
                    ? "text-[#10d97e] bg-[#10d97e]/10 border border-[#10d97e]/20"
                    : "text-gray-600 dark:text-[#8892a4] hover:bg-gray-50 dark:hover:bg-[#1e2330]"
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
