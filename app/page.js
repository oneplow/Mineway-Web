"use client";

import Link from "next/link";
import { Zap, Lock, ChartBar, Globe, RefreshCcw, Banknote, Pickaxe, Sun, Moon } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

const FEATURES = [
  { icon: <Zap size={28} className="text-emerald-500" />, title: "ติดตั้งง่าย", desc: "แค่ใส่ plugin + API key แล้วเซิร์ฟคุณก็ออนไลน์ได้ทันที ไม่ต้องยุ่งกับ router หรือ port forwarding" },
  { icon: <Lock size={28} className="text-emerald-500" />, title: "ปลอดภัย", desc: "Traffic ถูกเข้ารหัสผ่าน TLS ตลอดเส้นทาง API key ของคุณถูก hash ก่อนเก็บในฐานข้อมูล" },
  { icon: <ChartBar size={28} className="text-emerald-500" />, title: "ดู Traffic แบบ Real-time", desc: "Dashboard แสดง bandwidth, จำนวนผู้เล่น, latency และ uptime ของเซิร์ฟคุณตลอดเวลา" },
  { icon: <Globe size={28} className="text-emerald-500" />, title: "VPS หลายภูมิภาค", desc: "เลือก node ใกล้กับผู้เล่นของคุณ รองรับทั้งไทย สิงคโปร์ และญี่ปุ่น" },
  { icon: <RefreshCcw size={28} className="text-emerald-500" />, title: "Auto-reconnect", desc: "Plugin จะเชื่อมต่อกลับอัตโนมัติหากหลุด ไม่มี downtime ที่ไม่จำเป็น" },
  { icon: <Banknote size={28} className="text-emerald-500" />, title: "ราคาโปร่งใส", desc: "จ่ายตาม bandwidth ที่ใช้จริง ไม่มีค่าใช้จ่ายซ่อนเร้น เริ่มต้นฟรี" },
];

const PLANS = [
  { name: "Free", price: "0", bw: "10 GB/เดือน", players: "5 players", keys: "1 API Key" },
  { name: "Starter", price: "99", bw: "100 GB/เดือน", players: "20 players", keys: "3 API Keys (+ซื้อช่องได้)" , popular: true },
  { name: "Pro", price: "299", bw: "500 GB/เดือน", players: "ไม่จำกัด", keys: "10 API Keys (+ซื้อช่องได้)" },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const hydrated = useHydrated();

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] dark:from-[#050505] dark:to-[#0a0c10]">
      <nav className="sticky top-0 z-50 ring-1 ring-black/5 dark:ring-white/5 bg-white/70 dark:bg-[#0a0c10]/80 backdrop-blur-2xl px-8 transition-colors duration-300 shadow-sm dark:shadow-none">
        <div className="max-w-[1100px] mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white">
              <Pickaxe size={18} />
            </div>
            <span className="font-syne font-bold text-lg text-gray-900 dark:text-[#e8ecf4] tracking-tight">{settings.siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/5 transition-all"
            >
              {hydrated ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
            </button>
            <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-[#8892a4] hover:bg-gray-100 dark:hover:bg-[#1e2330] transition-colors">
              เข้าสู่ระบบ
            </Link>
            <Link href="/auth/register" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#10d97e] text-white dark:text-[#0a0c0f] hover:brightness-110 transition-all">
              สมัครฟรี
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative px-8 pt-32 pb-20 text-center overflow-hidden">
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[radial-gradient(ellipse,rgba(16,217,126,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-[760px] mx-auto animate-fade-in">
          {settings.homeAnnouncement && (
            <div className="inline-flex items-center gap-2 bg-[#10d97e]/10 border border-[#10d97e]/20 rounded-full px-3.5 py-1.5 mb-8 text-[13px] text-[#10d97e] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10d97e] inline-block pulse-dot" />
              {settings.homeAnnouncement}
            </div>
          )}
          <h1 className="font-syne text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-gray-900 dark:text-[#e8ecf4] mb-6">
            เปิดเซิร์ฟ Minecraft<br />
            <span className="text-[#10d97e]">ให้โลกเข้าถึงได้</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-[#8892a4] leading-[1.7] max-w-[540px] mx-auto mb-12">
            ไม่มี Public IP? ไม่เป็นไร ติดตั้ง plugin ใส่ API key แล้วเซิร์ฟของคุณก็ออนไลน์ผ่าน VPS ของเราทันที
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#10d97e] text-white dark:text-[#0a0c0f] text-[15px] font-semibold hover:brightness-110 transition-all">
              เริ่มต้นฟรี →
            </Link>
            <Link href="/overview" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-[#10d97e] bg-[#10d97e]/10 ring-1 ring-[#10d97e]/20 mb-6 dark:border-[#1e2330] text-gray-600 dark:text-[#8892a4] text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-[#111318] transition-all">
              ดู Dashboard Demo
            </Link>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto mt-16 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl overflow-hidden shadow-2xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1e2330] flex items-center gap-2 bg-gray-50 dark:bg-transparent">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-xs text-gray-500 dark:text-[#4a5568] font-mono">config.yml</span>
          </div>
          <div className="p-6 font-mono text-[13px] leading-[2.0] text-left">
            <div><span className="text-gray-400 dark:text-[#4a5568]"># Mineway Plugin Configuration</span></div>
            <div><span className="text-blue-500 dark:text-[#4d8fff]">api_key</span><span className="text-gray-400 dark:text-[#8892a4]">: </span><span className="text-[#10d97e]">&quot;mw_live_a8f2k9x1m3n7p4q6&quot;</span></div>
            <div><span className="text-blue-500 dark:text-[#4d8fff]">region</span><span className="text-gray-400 dark:text-[#8892a4]">: </span><span className="text-amber-500 dark:text-[#f5c842]">&quot;ap-southeast-1&quot;</span></div>
            <div><span className="text-blue-500 dark:text-[#4d8fff]">auto_reconnect</span><span className="text-gray-400 dark:text-[#8892a4]">: </span><span className="text-purple-500 dark:text-[#9d6fff]">true</span></div>
            <div className="mt-3"><span className="text-gray-400 dark:text-[#4a5568]">&gt; </span><span className="text-[#10d97e]">[Mineway] ✓ Tunnel established — play.yourserver.mineway.io</span></div>
          </div>
        </div>
      </section>

      <section className="px-8 py-24 border-t border-gray-200 dark:border-[#1e2330]">
        <div className="max-w-[1100px] mx-auto">
          <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[32px] p-12 text-center shadow-xl">
            <h2 className="text-3xl md:text-5xl font-syne font-black mb-6 text-gray-900 dark:text-[#e8ecf4]">พร้อมที่จะรันเซิร์ฟเวอร์แล้วหรือยัง?</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-base">ออกแบบมาสำหรับ server owner ที่ต้องการความง่ายและเสถียร</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f,i) => (
              <div key={i} className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/5 hover:-translate-y-1 hover:shadow-2xl hover:ring-black/10 dark:hover:ring-white/10 transition-all duration-300 shadow-xl">
                <div className="mb-4 bg-black/5 dark:bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ring-black/5 dark:ring-white/5">{f.icon}</div>
                <div className="font-bold text-[16px] text-gray-900 dark:text-[#e8ecf4] mb-2">{f.title}</div>
                <div className="text-[14px] text-gray-500 dark:text-[#8892a4] leading-[1.6]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-24 border-t border-gray-200 dark:border-[#1e2330]">
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-syne text-[2.2rem] font-bold tracking-[-0.02em] text-gray-900 dark:text-[#e8ecf4] mb-3">ราคาเรียบง่าย</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-base">เริ่มต้นฟรี อัปเกรดเมื่อพร้อม</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((p, idx) => (
              <div key={idx} className={`bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-8 rounded-[24px] transition-all flex flex-col relative ${p.popular ? 'ring-2 ring-[#10d97e] transform md:-translate-y-4 shadow-2xl shadow-[#10d97e]/20' : 'ring-1 ring-black/5 dark:ring-white/5 shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:ring-black/10 dark:hover:ring-white/10'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10d97e] text-white dark:text-[#0a0c0f] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">ยอดนิยม</div>
                )}
                <div className="font-syne text-[18px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1 my-6 border-b border-black/5 dark:border-white/5 pb-6">
                  <span className="text-4xl font-black text-gray-900 dark:text-[#e8ecf4]">{p.price}</span>
                  <span className="text-gray-500 font-bold">฿/เดือน</span>
                </div>
                <div className="flex flex-col gap-2.5 mb-7">
                  {[p.bw, p.players, p.keys].map((item,j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#8892a4]">
                      <span className="text-[#10d97e]">✓</span> {item}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className={`block w-full text-center py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  p.popular 
                    ? "bg-[#10d97e] border-[#10d97e] text-white dark:text-[#0a0c0f] hover:brightness-110" 
                    : "bg-transparent border-gray-200 dark:border-[#1e2330] text-gray-600 dark:text-[#8892a4] hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                  {p.name === "Free" ? "เริ่มต้นฟรี" : `เลือก ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 py-16 border-t border-gray-200 dark:border-[#1e2330]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
            {/* Brand */}
            <div className="max-w-[300px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white">
                  <Pickaxe size={14} />
                </div>
                <span className="font-syne font-bold text-lg text-gray-900 dark:text-[#e8ecf4]">{settings.siteName}</span>
              </div>
              {settings.siteTagline && (
                <p className="text-sm text-gray-500 dark:text-[#8892a4] leading-relaxed">{settings.siteTagline}</p>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-12">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">เมนู</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/auth/register" className="text-sm text-gray-600 dark:text-[#8892a4] hover:text-[#10d97e] transition-colors">สมัครสมาชิก</Link>
                  <Link href="/auth/login" className="text-sm text-gray-600 dark:text-[#8892a4] hover:text-[#10d97e] transition-colors">เข้าสู่ระบบ</Link>
                  <Link href="/overview" className="text-sm text-gray-600 dark:text-[#8892a4] hover:text-[#10d97e] transition-colors">Dashboard</Link>
                </div>
              </div>

              {(settings.discordUrl || settings.contactEmail) && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">ติดต่อเรา</h4>
                  <div className="flex flex-col gap-2">
                    {settings.discordUrl && (
                      <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-[#8892a4] hover:text-[#5865F2] transition-colors flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
                        Discord
                      </a>
                    )}
                    {settings.contactEmail && (
                      <a href={`mailto:${settings.contactEmail}`} className="text-sm text-gray-600 dark:text-[#8892a4] hover:text-[#10d97e] transition-colors flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        {settings.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-gray-200 dark:border-[#1e2330] text-center">
            <p className="text-xs text-gray-400 dark:text-[#4a5568]">{settings.footerText ? `\u00a9 ${settings.footerText}` : `\u00a9 ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
