"use client";

import Link from "next/link";
import { Zap, Lock, ChartBar, Globe, RefreshCcw, Banknote, Pickaxe, Sun, Moon, ArrowRight, Server, Terminal as TerminalIcon } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

const FEATURES = [
  { icon: <Zap className="text-emerald-500" />, title: "ออนไลน์ทันที ไม่มีสะดุด", desc: "แค่ใส่ plugin + API key แล้วเซิร์ฟคุณก็ออนไลน์ได้ทันที ไม่ต้องยุ่งกับ router หรือ port forwarding" },
  { icon: <Lock className="text-blue-500" />, title: "ปลอดภัยสูงสุด", desc: "Traffic ถูกเข้ารหัสผ่าน TLS ตลอดเส้นทาง API key ของคุณถูก hash ก่อนเก็บในฐานข้อมูล" },
  { icon: <Globe className="text-purple-500" />, title: "VPS หลายภูมิภาค", desc: "เลือก node ใกล้กับผู้เล่นของคุณ รองรับทั้งไทย สิงคโปร์ และญี่ปุ่น เพื่อปิงที่ต่ำที่สุด" },
  { icon: <ChartBar className="text-rose-500" />, title: "Real-time Dashboard", desc: "ดู bandwidth, จำนวนผู้เล่น, latency และ uptime ของเซิร์ฟคุณตลอดเวลาผ่านหน้าเว็บ" },
  { icon: <RefreshCcw className="text-amber-500" />, title: "Auto-reconnect", desc: "เชื่อมต่อกลับอัตโนมัติหากเน็ตกระตุก ไม่มี downtime ที่ไม่จำเป็น" },
  { icon: <Banknote className="text-emerald-400" />, title: "ราคาโปร่งใส", desc: "จ่ายตามการใช้งานจริง เริ่มต้นใช้ฟรี ไม่มีค่าใช้จ่ายแอบแฝง" },
];

const PLANS = [
  { name: "Free", price: "0", bw: "10 GB", players: "5", keys: "1", popular: false },
  { name: "Starter", price: "99", bw: "100 GB", players: "20", keys: "3", popular: true },
  { name: "Pro", price: "299", bw: "500 GB", players: "Unlimited", keys: "10", popular: false },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const hydrated = useHydrated();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] dark:from-[#050505] dark:to-[#0a0c10] selection:bg-emerald-500/30 overflow-hidden font-sans transition-colors duration-500 text-gray-900 dark:text-gray-100">

      {/* --- BACKGROUND EFFECTS (Subtle & Slim) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] dark:opacity-[0.02] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* --- SLEEK NAVBAR --- */}
      <div className="fixed top-4 w-full z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl px-4 py-2 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Pickaxe size={14} />
            </div>
            <span className="font-syne font-bold text-base tracking-tight text-gray-900 dark:text-[#e8ecf4]">{settings.siteName}</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {hydrated ? (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <Sun size={16} className="opacity-0" />}
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden md:block" />
            <Link href="/auth/login" className="hidden md:block px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-[#8892a4] hover:text-gray-900 dark:hover:text-white transition-colors">
              เข้าสู่ระบบ
            </Link>
            <Link href="/auth/register" className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#10d97e] text-white dark:text-[#0a0c0f] hover:brightness-110 transition-all shadow-sm">
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </nav>
      </div>

      {/* --- HERO SECTION (SHARP & COMPACT) --- */}
      <section className="relative z-10 pt-32 pb-16 lg:pt-40 lg:pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left: Content */}
          <div className="text-left space-y-6">
            {settings.homeAnnouncement && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full pr-3 pl-1 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="bg-emerald-500 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full">New</span>
                {settings.homeAnnouncement}
              </div>
            )}
            <h1 className="text-4xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.15]">
              เปิดเซิร์ฟให้โลกเห็น <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                ไม่ต้องง้อ Public IP
              </span>
            </h1>
            <p className="text-base lg:text-lg text-gray-500 dark:text-[#8892a4] max-w-lg leading-relaxed">
              เชื่อมต่อเซิร์ฟเวอร์ Minecraft ของคุณสู่โลกกว้างผ่านระบบ Tunnel อัจฉริยะ ติดตั้งง่าย ปลอดภัย ปิงต่ำ พร้อมออนไลน์ในเวลาไม่ถึงนาที
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/auth/register" className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                สร้างเซิร์ฟเวอร์ฟรี <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/overview" className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#8892a4] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                ดู Dashboard สาธิต
              </Link>
            </div>
          </div>

          {/* Right: Floating Code Editor (Sleek) */}
          <div className="relative w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 blur-2xl opacity-10 dark:opacity-20 rounded-full" />

            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="px-4 py-2.5 bg-[#111111] border-b border-white/5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
                <div className="mx-auto flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <TerminalIcon size={10} /> config.yml
                </div>
              </div>
              <div className="p-5 text-[13px] font-mono leading-relaxed text-slate-300">
                <div className="text-slate-500 mb-3"># Configuration</div>
                <div className="flex"><span className="text-cyan-400 w-32">api_key:</span><span className="text-emerald-400">"mw_live_a8f2k..."</span></div>
                <div className="flex"><span className="text-cyan-400 w-32">region:</span><span className="text-amber-300">"ap-southeast-1"</span></div>
                <div className="flex mb-4"><span className="text-cyan-400 w-32">auto_reconnect:</span><span className="text-purple-400">true</span></div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-slate-500 flex items-center gap-2 mb-1 text-xs">
                    <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Output
                  </div>
                  <div className="text-emerald-400">[Mineway] Authenticated successfully.</div>
                  <div className="text-slate-300">[Mineway] Tunnel established: <span className="text-cyan-300">play.server.io</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FEATURES (CLEAN GRID) --- */}
      <section className="relative z-10 py-20 bg-white/50 dark:bg-[#0a0c10]/50 border-y border-gray-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">ระบบพื้นฐานที่แข็งแกร่ง</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-sm md:text-base max-w-xl mx-auto">สถาปัตยกรรมที่ออกแบบมาเพื่อเซิร์ฟเวอร์เกมโดยเฉพาะ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl rounded-xl p-6 ring-1 ring-black/5 dark:ring-white/5 hover:ring-[#10d97e]/30 dark:hover:ring-[#10d97e]/30 transition-colors shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                  {React.cloneElement(f.icon, { size: 20 })}
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-[#8892a4] leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">ราคาที่ตรงไปตรงมา</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-sm md:text-base">เลือกแพ็กเกจที่เหมาะสมกับขนาดเซิร์ฟเวอร์ของคุณ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
            {PLANS.map((p, idx) => (
              <div
                key={idx}
                className={`relative bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 transition-all
                ${p.popular
                    ? 'ring-2 ring-[#10d97e] shadow-2xl shadow-[#10d97e]/20 md:-translate-y-2'
                    : 'ring-1 ring-black/5 dark:ring-white/5 shadow-lg hover:shadow-xl'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                    แนะนำ
                  </div>
                )}

                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>

                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-bold tracking-tight">
                    {p.price === "0" ? "ฟรี" : `฿${p.price}`}
                  </span>
                  {p.price !== "0" && <span className="text-slate-500 text-sm font-medium mb-1">/เดือน</span>}
                </div>

                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-[#e8ecf4]">
                    <Server size={16} className="text-emerald-500 shrink-0" />
                    <span>Bandwidth: <strong>{p.bw}</strong>/เดือน</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ChartBar size={16} className="text-emerald-500 shrink-0" />
                    <span>รองรับผู้เล่น: <strong>{p.players}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Lock size={16} className="text-emerald-500 shrink-0" />
                    <span>จำนวน <strong>{p.keys}</strong> API Keys</span>
                  </div>
                </div>

                <Link
                  href="/auth/register"
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${p.popular
                      ? "bg-[#10d97e] text-white dark:text-[#0a0c0f] hover:brightness-110 shadow-md shadow-[#10d97e]/20"
                      : "bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/5"
                    }`}
                >
                  {p.price === "0" ? "เริ่มต้นฟรี" : `เลือก ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SLEEK FOOTER --- */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-white/5 bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                  <Pickaxe size={16} />
                </div>
                <span className="font-bold text-xl tracking-tight">{settings.siteName}</span>
              </div>
              <p className="text-gray-500 dark:text-[#8892a4] text-sm max-w-xs">
                {settings.siteTagline || "บริการ Tunnel เซิร์ฟเวอร์เกมที่เสถียรและใช้งานง่ายที่สุด"}
              </p>
            </div>

            <div className="flex flex-wrap md:justify-end gap-12">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-[#4a5568] tracking-widest">ระบบ</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/auth/register" className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">สมัครสมาชิก</Link>
                  <Link href="/auth/login" className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">เข้าสู่ระบบ</Link>
                </div>
              </div>

              {(settings.discordUrl || settings.contactEmail) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 dark:text-[#4a5568] tracking-widest">ติดต่อ</h4>
                  <div className="flex flex-col gap-2">
                    {settings.discordUrl && (
                      <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-[#5865F2] transition-colors">
                        Discord
                      </a>
                    )}
                    {settings.contactEmail && (
                      <a href={`mailto:${settings.contactEmail}`} className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">
                        อีเมล
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 dark:text-[#4a5568]">
              {settings.footerText ? `\u00a9 ${settings.footerText}` : `\u00a9 ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}