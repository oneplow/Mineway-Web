"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Lock, ChartBar, Globe, RefreshCcw, Banknote, Pickaxe, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const FEATURES = [
  { icon: <Zap size={28} className="text-emerald-500" />, title: "ติดตั้งง่าย", desc: "แค่ใส่ plugin + API key แล้วเซิร์ฟคุณก็ออนไลน์ได้ทันที ไม่ต้องยุ่งกับ router หรือ port forwarding" },
  { icon: <Lock size={28} className="text-emerald-500" />, title: "ปลอดภัย", desc: "Traffic ถูกเข้ารหัสผ่าน TLS ตลอดเส้นทาง API key ของคุณถูก hash ก่อนเก็บในฐานข้อมูล" },
  { icon: <ChartBar size={28} className="text-emerald-500" />, title: "ดู Traffic แบบ Real-time", desc: "Dashboard แสดง bandwidth, จำนวนผู้เล่น, latency และ uptime ของเซิร์ฟคุณตลอดเวลา" },
  { icon: <Globe size={28} className="text-emerald-500" />, title: "VPS หลายภูมิภาค", desc: "เลือก node ใกล้กับผู้เล่นของคุณ รองรับทั้งไทย สิงคโปร์ และญี่ปุ่น" },
  { icon: <RefreshCcw size={28} className="text-emerald-500" />, title: "Auto-reconnect", desc: "Plugin จะเชื่อมต่อกลับอัตโนมัติหากหลุด ไม่มี downtime ที่ไม่จำเป็น" },
  { icon: <Banknote size={28} className="text-emerald-500" />, title: "ราคาโปร่งใส", desc: "จ่ายตาม bandwidth ที่ใช้จริง ไม่มีค่าใช้จ่ายซ่อนเร้น เริ่มต้นฟรี" },
];

const PLANS = [
  { name: "Free", price: "0", bw: "10 GB/เดือน", players: "5 players", nodes: "1 node" },
  { name: "Starter", price: "99", bw: "100 GB/เดือน", players: "20 players", nodes: "3 nodes", popular: true },
  { name: "Pro", price: "299", bw: "500 GB/เดือน", players: "ไม่จำกัด", nodes: "ทุก node" },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300">
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-[#1e2330] bg-white/90 dark:bg-[#0a0c0f]/90 backdrop-blur-xl px-8 transition-colors duration-300">
        <div className="max-w-[1100px] mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white">
              <Pickaxe size={18} />
            </div>
            <span className="font-syne font-bold text-lg text-gray-900 dark:text-[#e8ecf4] tracking-tight">Mineway</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1e2330] transition-colors"
            >
              {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
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
          <div className="inline-flex items-center gap-2 bg-[#10d97e]/10 border border-[#10d97e]/20 rounded-full px-3.5 py-1.5 mb-8 text-[13px] text-[#10d97e] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10d97e] inline-block pulse-dot" />
            พร้อมให้บริการแล้ววันนี้
          </div>
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
            <Link href="/overview" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-600 dark:text-[#8892a4] text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-[#111318] transition-all">
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
          <div className="text-center mb-16">
            <h2 className="font-syne text-[2.2rem] font-bold tracking-[-0.02em] text-gray-900 dark:text-[#e8ecf4] mb-3">ทุกอย่างที่เซิร์ฟของคุณต้องการ</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-base">ออกแบบมาสำหรับ server owner ที่ต้องการความง่ายและเสถียร</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f,i) => (
              <div key={i} className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-7 hover:border-[#10d97e]/30 transition-all duration-300">
                <div className="mb-4">{f.icon}</div>
                <div className="font-semibold text-[15px] text-gray-900 dark:text-[#e8ecf4] mb-2">{f.title}</div>
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
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-8 border ${plan.popular ? "bg-[#10d97e]/[0.02] dark:bg-[#10d97e]/5 border-[#10d97e]/30" : "bg-white dark:bg-[#111318] border-gray-200 dark:border-[#1e2330]"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10d97e] text-white dark:text-[#0a0c0f] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">ยอดนิยม</div>
                )}
                <div className="font-syne text-[18px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-1">{plan.name}</div>
                <div className="mb-6">
                  <span className={`font-syne text-[34px] font-extrabold ${plan.popular ? "text-[#10d97e]" : "text-gray-900 dark:text-[#e8ecf4]"}`}>฿{plan.price}</span>
                  <span className="text-gray-500 dark:text-[#4a5568] text-sm">/เดือน</span>
                </div>
                <div className="flex flex-col gap-2.5 mb-7">
                  {[plan.bw, plan.players, plan.nodes].map((item,j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#8892a4]">
                      <span className="text-[#10d97e]">✓</span> {item}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className={`block w-full text-center py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  plan.popular 
                    ? "bg-[#10d97e] border-[#10d97e] text-white dark:text-[#0a0c0f] hover:brightness-110" 
                    : "bg-transparent border-gray-200 dark:border-[#1e2330] text-gray-600 dark:text-[#8892a4] hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                  {plan.name === "Free" ? "เริ่มต้นฟรี" : `เลือก ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 py-10 border-t border-gray-200 dark:border-[#1e2330] text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white">
            <Pickaxe size={12} />
          </div>
          <span className="font-syne font-bold text-gray-900 dark:text-[#e8ecf4]">Mineway</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-[#4a5568]">© 2025 Mineway. All rights reserved.</p>
      </footer>
    </div>
  );
}
