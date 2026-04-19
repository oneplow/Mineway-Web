"use client";
import React, { useState } from "react";
import {
  Copy, Terminal, Server, ShieldCheck, Download, Code, Pickaxe,
  Box, Zap, ChevronRight, CheckCircle2, BookOpen, Layers, Play
} from "lucide-react";
import toast from "react-hot-toast";

// --- Components ---

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.success("คัดลอกคำสั่งแล้ว!");
}

function CodeBlock({ code, title, language = "bash" }) {
  return (
    <div className="mt-5 rounded-2xl overflow-hidden bg-[#09090b] ring-1 ring-white/10 shadow-xl group">
      {/* Mac-like Window Header */}
      <div className="px-4 py-3 bg-[#18181b] flex justify-between items-center border-b border-white/5">
        <div className="flex gap-2 items-center">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          {title && <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">{title}</span>}
        </div>
        <button
          onClick={() => copyToClipboard(code)}
          className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-[#e4e4e7] font-mono text-[13px] leading-relaxed relative">
        {!title && (
          <button
            onClick={() => copyToClipboard(code)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-white/10"
          >
            <Copy size={14} />
          </button>
        )}
        <pre className="whitespace-pre-wrap"><code className={`language-${language}`}>{code}</code></pre>
      </div>
    </div>
  );
}

function TimelineStep({ number, title, children, isLast = false }) {
  return (
    <div className="relative pl-10 md:pl-12 pb-12">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] bg-gradient-to-b from-[#10d97e]/40 to-transparent dark:from-[#10d97e]/20" />
      )}

      {/* Step Number Circle */}
      <div className="absolute left-0 top-0 w-[32px] h-[32px] rounded-full bg-white dark:bg-[#09090b] border-2 border-[#10d97e] text-[#10d97e] flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(16,217,126,0.2)] z-10">
        {number}
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl p-6 md:p-8 shadow-sm ring-1 ring-zinc-200 dark:ring-white/5 hover:ring-[#10d97e]/30 dark:hover:ring-[#10d97e]/30 transition-all duration-300">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">{title}</h3>
        <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[15px]">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("plugin");

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-[#10d97e]/30 font-sans">

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center z-0">
        <div className="w-[800px] h-[500px] bg-[#10d97e]/10 dark:bg-[#10d97e]/5 blur-[120px] rounded-full absolute -top-40 opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="max-w-[1100px] mx-auto p-4 md:p-8 lg:p-12 relative z-10 pt-12 md:pt-20">

        {/* Header Hero */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-white">
              ติดตั้ง <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10d97e] to-[#0ea865]">Mineway</span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
              เชื่อมต่อเซิร์ฟเวอร์ของคุณสู่โลกกว้างได้อย่างปลอดภัยและรวดเร็ว เลือกรูปแบบการติดตั้งที่ตรงกับโครงสร้างระบบของคุณด้านล่างนี้
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Sidebar Navigation */}
          <div className="lg:w-1/3 shrink-0">
            <div className="sticky top-24 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 pl-2">เลือกวิธีการติดตั้ง</h4>

              <button
                onClick={() => setActiveTab("plugin")}
                className={`flex flex-col text-left p-5 rounded-2xl transition-all duration-300 ${activeTab === "plugin"
                  ? "bg-white dark:bg-[#18181b] ring-2 ring-[#10d97e] shadow-lg scale-[1.02]"
                  : "bg-zinc-100 dark:bg-white/5 ring-1 ring-zinc-200 dark:ring-white/5 hover:bg-white dark:hover:bg-white/10 hover:scale-[1.01]"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${activeTab === 'plugin' ? 'bg-[#10d97e]/20 text-[#10d97e]' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'}`}>
                    <Pickaxe size={24} />
                  </div>
                  {activeTab === 'plugin' && <div className="w-2 h-2 rounded-full bg-[#10d97e] shadow-[0_0_10px_#10d97e]"></div>}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">Minecraft Plugin</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">เหมาะสำหรับเซิร์ฟเวอร์ Java ทั่วไป ติดตั้งง่าย โยนไฟล์จบ</p>
              </button>

              <button
                onClick={() => setActiveTab("cli")}
                className={`flex flex-col text-left p-5 rounded-2xl transition-all duration-300 ${activeTab === "cli"
                  ? "bg-white dark:bg-[#18181b] ring-2 ring-[#10d97e] shadow-lg scale-[1.02]"
                  : "bg-zinc-100 dark:bg-white/5 ring-1 ring-zinc-200 dark:ring-white/5 hover:bg-white dark:hover:bg-white/10 hover:scale-[1.01]"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${activeTab === 'cli' ? 'bg-[#10d97e]/20 text-[#10d97e]' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'}`}>
                    <Terminal size={24} />
                  </div>
                  {activeTab === 'cli' && <div className="w-2 h-2 rounded-full bg-[#10d97e] shadow-[0_0_10px_#10d97e]"></div>}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">Standalone CLI</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">เจาะอุโมงค์ระดับ OS อิสระทุกพอร์ต สำหรับผู้ดูแลระบบ</p>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-2/3">

            {/* PLUGIN TAB */}
            {activeTab === "plugin" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TimelineStep number="1" title="สร้างและคัดลอก API Key">
                  ไปที่หน้า <strong className="text-zinc-900 dark:text-white">ภาพรวม (Overview)</strong> บนแดชบอร์ด กดปุ่มสร้าง Key เลือกภูมิภาค (Region) ที่ใกล้คุณที่สุด จากนั้นคัดลอก <code>API Key</code> เก็บไว้
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-mono text-zinc-500">
                    <Layers size={14} /> รูปแบบ: mw_live_xxxx...
                  </div>
                </TimelineStep>

                <TimelineStep number="2" title="ดาวน์โหลดและติดตั้ง Plugin">
                  เลือกดาวน์โหลดไฟล์ <code>.jar</code> ที่ตรงกับ Core เซิร์ฟเวอร์ของคุณ นำไปวางในโฟลเดอร์ <code>plugins/</code> หรือ <code>mods/</code>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                    <a href="/jars/mineway-bukkit.jar" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#10d97e] to-[#0ea865] p-[1px] transition-all hover:shadow-[0_0_20px_rgba(16,217,126,0.3)] hover:-translate-y-0.5">
                      <div className="flex h-full items-center gap-3 rounded-[11px] bg-white dark:bg-[#18181b] p-3 transition-colors group-hover:bg-transparent">
                        <div className="p-2 rounded-lg bg-[#10d97e]/10 text-[#10d97e] group-hover:bg-white/20 group-hover:text-white"><Download size={18} /></div>
                        <span className="font-bold text-zinc-900 dark:text-white group-hover:text-white">Bukkit / Paper</span>
                      </div>
                    </a>

                    <a href="/jars/mineway-proxy.jar" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-400 to-zinc-600 p-[1px] transition-all hover:-translate-y-0.5">
                      <div className="flex h-full items-center gap-3 rounded-[11px] bg-white dark:bg-[#18181b] p-3 transition-colors group-hover:bg-transparent">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 group-hover:bg-white/20 group-hover:text-white"><Box size={18} /></div>
                        <span className="font-bold text-zinc-900 dark:text-white group-hover:text-white">Velocity / Bungee</span>
                      </div>
                    </a>

                    <a href="/jars/mineway-forge.jar" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#e4a663] to-[#c88239] p-[1px] transition-all hover:-translate-y-0.5">
                      <div className="flex h-full items-center gap-3 rounded-[11px] bg-white dark:bg-[#18181b] p-3 transition-colors group-hover:bg-transparent">
                        <div className="p-2 rounded-lg bg-[#e4a663]/10 text-[#c88239] group-hover:bg-white/20 group-hover:text-white"><Box size={18} /></div>
                        <span className="font-bold text-zinc-900 dark:text-white group-hover:text-white">Forge</span>
                      </div>
                    </a>

                    <a href="/jars/mineway-fabric.jar" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ded0a1] to-[#bfa871] p-[1px] transition-all hover:-translate-y-0.5">
                      <div className="flex h-full items-center gap-3 rounded-[11px] bg-white dark:bg-[#18181b] p-3 transition-colors group-hover:bg-transparent">
                        <div className="p-2 rounded-lg bg-[#bfa871]/10 text-[#bfa871] group-hover:bg-white/20 group-hover:text-white"><Box size={18} /></div>
                        <span className="font-bold text-zinc-900 dark:text-white group-hover:text-white">Fabric</span>
                      </div>
                    </a>

                    <a href="/jars/mineway-neoforge.jar" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#e46363] to-[#c83939] p-[1px] transition-all hover:-translate-y-0.5">
                      <div className="flex h-full items-center gap-3 rounded-[11px] bg-white dark:bg-[#18181b] p-3 transition-colors group-hover:bg-transparent">
                        <div className="p-2 rounded-lg bg-[#e46363]/10 text-[#c83939] group-hover:bg-white/20 group-hover:text-white"><Box size={18} /></div>
                        <span className="font-bold text-zinc-900 dark:text-white group-hover:text-white">NeoForge</span>
                      </div>
                    </a>
                  </div>
                </TimelineStep>

                <TimelineStep number="3" title="สร้างไฟล์ Config ครั้งแรก">
                  สตาร์ทเซิร์ฟเวอร์ของคุณตามปกติ หรือหากเปิดอยู่แล้ว ให้พิมพ์คำสั่งด้านล่างนี้ในหน้าต่างคอนโซล เพื่อสร้างไฟล์ <code>config.yml</code>
                  <CodeBlock code="reload" />
                </TimelineStep>

                <TimelineStep number="4" title="ตั้งค่า API Key">
                  เข้าไปที่โฟลเดอร์ <code>plugins/Mineway/</code> เปิดไฟล์ <code>config.yml</code> และนำ Key ที่คัดลอกมาใส่ให้ถูกต้อง
                  <CodeBlock language="yaml" title="plugins/Mineway/config.yml" code={`# ใส่ API Key ที่คัดลอกมาจากเว็บไซต์ตรงนี้\napi_key: "mw_live_abc123..."\n\n# [Optional] หากเป้าหมายเซิร์ฟเวอร์คุณไม่ใช่ 25565 ให้เปลี่ยนได้ที่นี่\ntarget_tcp_port: 25565\ntarget_udp_port: 19132\n\nauto_reconnect: true\nreconnect_delay: 5`} />
                </TimelineStep>

                <TimelineStep number="5" title="รีโหลดเพื่อใช้งาน!" isLast={true}>
                  พิมพ์คำสั่งนี้ในเกม หรือ คอนโซลของเซิร์ฟเพื่อยืนยันการตั้งค่า:
                  <CodeBlock code="/mineway reload" />

                  <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-[#10d97e]/10 to-transparent border border-[#10d97e]/20 flex gap-4 items-start">
                    <div className="p-2 rounded-full bg-[#10d97e]/20 text-[#10d97e] shrink-0 mt-1">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-[#10d97e] font-bold text-lg mb-1">เชื่อมต่อสำเร็จ! 🎉</h4>
                      <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                        คุณสามารถก๊อปปี้ <code>Connection IP</code> จากหน้าแดชบอร์ดบนเว็บ แปะเข้าช่อง Multiplayer ในเกมเพื่อนัดเพื่อนมาแจมได้เลยทันที (สถานะในหน้าเว็บจะขึ้นแถบสีเขียวว่า Connected)
                      </p>
                    </div>
                  </div>
                </TimelineStep>
              </div>
            )}

            {/* CLI TAB */}
            {activeTab === "cli" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TimelineStep number="1" title="ดาวน์โหลด CLI Tool">
                  โหลดตัวคลิก <code>mineway-cli.jar</code> ตัวนี้ตัวเดียวจบ ทำงานครอบคลุมทุกระบบปฏิบัติการที่เป็นมิตรกับ Java (Windows, Linux, macOS)
                  <div className="mt-5">
                    <a href="/jars/mineway-cli.jar" className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-xl hover:shadow-white/10">
                      <Download size={20} /> ดาวน์โหลด Mineway CLI
                    </a>
                  </div>
                </TimelineStep>

                <TimelineStep number="2" title="รันคำสั่งเจาะพอร์ต">
                  เปิด Terminal (หรือ CMD) ตรงโฟลเดอร์ที่คุณวางไฟล์ไว้ เลือกใช้งานตามความเหมาะสมของเซิร์ฟเวอร์คุณ:

                  <div className="space-y-4 mt-6">
                    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 p-5 transition-all hover:border-[#10d97e]/50">
                      <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white mb-2 text-sm">
                        <Zap size={16} className="text-[#10d97e]" /> 1. สำหรับ Minecraft ปกติ
                      </div>
                      <p className="text-sm text-zinc-500 mb-4">ระบบจะจัดการแมพพอร์ต 25565 (Java) และ 19132 (Bedrock) ให้อัตโนมัติ</p>
                      <CodeBlock code={`java -jar mineway-cli.jar --key mw_live_XXXXX`} />
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 p-5 transition-all hover:border-amber-500/50">
                      <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white mb-2 text-sm">
                        <Server size={16} className="text-amber-500" /> 2. Custom Port / เกมอื่นๆ
                      </div>
                      <p className="text-sm text-zinc-500 mb-4">กำหนดพอร์ตปลายทางเอง เหมาะสำหรับ FiveM, เว็บเซิร์ฟเวอร์ หรือพอร์ตเฉพาะกิจ</p>
                      <CodeBlock code={`java -jar mineway-cli.jar --key mw_live_XXXXX --port 8080`} />
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 p-5 transition-all hover:border-purple-500/50">
                      <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white mb-2 text-sm">
                        <Layers size={16} className="text-purple-500" /> 3. สาย GeyserMC แยกท่อ
                      </div>
                      <p className="text-sm text-zinc-500 mb-4">บังคับแยกพอร์ต TCP และ UDP ให้ชี้ไปคนละพอร์ตบนเครื่องเดียวกันแบบเป๊ะๆ</p>
                      <CodeBlock code={`java -jar mineway-cli.jar --key mw_live_XXXXX --tcp-port 25566 --udp-port 19135`} />
                    </div>
                  </div>
                </TimelineStep>

                <TimelineStep number="3" title="การควบคุม (Console Commands)" isLast={true}>
                  ขณะที่โปรแกรม CLI รันอยู่ คุณสามารถพิมพ์คำสั่งเหล่านี้ลงไปโดยตรงเพื่อควบคุมอุโมงค์:

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/5 flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Terminal size={16} />
                      </div>
                      <div>
                        <code className="text-blue-600 dark:text-blue-400 font-bold">status</code>
                        <div className="text-xs text-zinc-500 mt-1">เช็คสถานะการเชื่อมต่อ และจำนวนผู้เล่น</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/5 flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <Play size={16} className="rotate-90" />
                      </div>
                      <div>
                        <code className="text-red-600 dark:text-red-400 font-bold">stop</code>
                        <div className="text-xs text-zinc-500 mt-1">ปิดการทำงานและตัดการเชื่อมต่ออย่างปลอดภัย</div>
                      </div>
                    </div>
                  </div>
                </TimelineStep>
              </div>
            )}

          </div>
        </div>

        {/* Footer Helper */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-white/5 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            ติดปัญหาตรงไหนหรือเปล่า? <a href="#" className="font-medium text-[#10d97e] hover:underline underline-offset-4 decoration-[#10d97e]/30">เปิด Ticket คุยกับแอดมินใน Discord</a> ได้ตลอดเวลาเลยครับ
          </p>
        </div>

      </div>
    </div>
  );
}