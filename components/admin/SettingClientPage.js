"use client";

import React, { useState } from "react";
import { Save, RefreshCw, AlertCircle, Globe, Megaphone, CreditCard, Wrench, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const SETTING_GROUPS = [
  {
    label: "General",
    description: "ข้อมูลพื้นฐานและตัวตนของแพลตฟอร์ม",
    icon: Globe,
    color: "emerald",
    keys: ["siteName", "siteTagline", "siteDescription", "footerText"],
  },
  {
    label: "Announcements",
    description: "ข้อความประกาศที่แสดงในหน้าเว็บ",
    icon: Megaphone,
    color: "amber",
    keys: ["homeAnnouncement", "dashboardAnnouncement"],
  },
  {
    label: "Social & Contact",
    description: "ช่องทางติดต่อและโซเชียลมีเดีย",
    icon: MessageSquare,
    color: "blue",
    keys: ["discordUrl", "contactEmail"],
  },
  {
    label: "Payment",
    description: "การตั้งค่าระบบรับชำระเงินและ PromptPay",
    icon: CreditCard,
    color: "sky",
    keys: ["promptpay_number", "promptpay_name", "truemoney_phone"],
  },
  {
    label: "Pricing & Logic",
    description: "ค่าใช้จ่ายและตรรกะการทำงานของระบบ",
    icon: CreditCard,
    color: "violet",
    keys: ["customPortPrice", "defaultTunnelExpiryDays", "extraKeyPrice"],
  },
  {
    label: "Maintenance",
    description: "การตั้งค่าโหมดปิดปรับปรุงระบบ",
    icon: Wrench,
    color: "rose",
    keys: ["maintenanceMode", "maintenanceMessage"],
  },
];

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    glow: "bg-emerald-500/10",
    hint: "text-emerald-500/80",
    hintBg: "bg-emerald-500/5",
    hintBorder: "border-emerald-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    glow: "bg-amber-500/10",
    hint: "text-amber-500/80",
    hintBg: "bg-amber-500/5",
    hintBorder: "border-amber-500/10",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    glow: "bg-blue-500/10",
    hint: "text-blue-500/80",
    hintBg: "bg-blue-500/5",
    hintBorder: "border-blue-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon: "text-violet-400",
    glow: "bg-violet-500/10",
    hint: "text-violet-500/80",
    hintBg: "bg-violet-500/5",
    hintBorder: "border-violet-500/10",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "text-rose-400",
    glow: "bg-rose-500/10",
    hint: "text-rose-500/80",
    hintBg: "bg-rose-500/5",
    hintBorder: "border-rose-500/10",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: "text-sky-400",
    glow: "bg-sky-500/10",
    hint: "text-sky-500/80",
    hintBg: "bg-sky-500/5",
    hintBorder: "border-sky-500/10",
  },
};

const HINTS = {
  siteName: "ชื่อนี้จะแสดงใน Navbar, Footer, และหน้าแรกทั้งหมด",
  siteTagline: "แสดงถัดจากชื่อเว็บ เช่น 'Minecraft Server Gateway'",
  siteDescription: "ใช้สำหรับ SEO Meta Description ในหน้าแรก",
  footerText: "ข้อความลิขสิทธิ์ด้านล่างเว็บ เช่น '2025 Mineway. All rights reserved.'",
  homeAnnouncement: "Badge เล็กๆ บนหน้าแรก (เว้นว่าง = ซ่อน)",
  dashboardAnnouncement: "แถบประกาศสีส้มด้านบนหน้า Dashboard (เว้นว่าง = ซ่อน)",
  discordUrl: "ลิงก์เชิญเข้า Discord Server ของคุณ",
  contactEmail: "อีเมลสำหรับให้ผู้ใช้ติดต่อ",
  customPortPrice: "จำนวน Points ที่จะถูกหักเมื่อผู้ใช้เลือก VIP Custom Port",
  defaultTunnelExpiryDays: "จำนวนวันก่อนที่ Tunnel จะหมดอายุนับจากวันสร้าง",
  maintenanceMode: "ใส่ 'true' เพื่อเปิดโหมดปิดปรับปรุง หรือ 'false' เพื่อปิด",
  maintenanceMessage: "ข้อความที่จะแสดงให้ผู้ใช้เห็นขณะระบบปิดปรับปรุง",
  promptpay_number: "เบอร์โทรหรือเลขบัตรประชาชนที่ผูกกับ PromptPay สำหรับรับเงิน",
  promptpay_name: "ชื่อบัญชีที่จะแสดงให้ผู้ใช้เห็น เช่น 'นาย สมชาย ใจดี'",
  truemoney_phone: "เบอร์ทรูมันนี่สำหรับรับเงินซองอั่งเปา",
};

export default function SettingClientPage({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState(null);

  const getSettingByKey = (key) => settings.find((s) => s.key === key);

  const handleUpdate = async (key, value) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        toast.success("บันทึกการตั้งค่าสำเร็จ");
        const updated = await res.json();
        const exists = settings.some((s) => s.key === key);
        if (exists) {
          setSettings(settings.map((s) => (s.key === key ? updated : s)));
        } else {
          setSettings([...settings, updated]);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      toast.error("การเชื่อมต่อล้มเหลว");
    } finally {
      setSavingKey(null);
    }
  };

  const handleChange = (key, value) => {
    const exists = settings.some((s) => s.key === key);
    if (exists) {
      setSettings(settings.map((s) => (s.key === key ? { ...s, value } : s)));
    } else {
      setSettings([...settings, { key, value }]);
    }
  };

  const isLongText = (key) => ["siteDescription", "maintenanceMessage", "dashboardAnnouncement"].includes(key);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Site Configuration
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            จัดการการตั้งค่าทั้งหมดของแพลตฟอร์มจากจุดเดียว
          </p>
        </div>
      </div>

      {SETTING_GROUPS.map((group) => {
        const colors = colorMap[group.color];
        const GroupIcon = group.icon;
        const groupSettings = group.keys.map((k) => getSettingByKey(k) || { key: k, value: "" });

        if (groupSettings.length === 0) return null;

        return (
          <div
            key={group.label}
            className="bg-[#0a0c10]/90 backdrop-blur-xl border border-gray-800 rounded-[24px] p-6 shadow-xl relative overflow-hidden"
          >
            {/* Group Header */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/5">
              <div className={`h-11 w-11 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                <GroupIcon className={`h-5 w-5 ${colors.icon}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{group.label}</h3>
                <p className="text-[12px] text-gray-500 font-medium">{group.description}</p>
              </div>
            </div>

            {/* Settings Rows */}
            <div className="space-y-5">
              {groupSettings.map((s) => (
                <div key={s.key} className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-bold text-white">
                        {s.label || s.key}
                      </span>
                      <code className="text-[9px] bg-white/5 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                        {s.key}
                      </code>
                    </div>
                    {HINTS[s.key] && (
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {HINTS[s.key]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 lg:flex-shrink-0">
                    {isLongText(s.key) ? (
                      <textarea
                        value={s.value}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        rows={2}
                        className="bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white font-mono text-sm w-full lg:w-[360px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        className="bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white font-mono text-sm w-full lg:w-[360px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                      />
                    )}

                    <button
                      onClick={() => handleUpdate(s.key, s.value)}
                      disabled={savingKey === s.key}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex-shrink-0 ${
                        savingKey === s.key
                          ? "bg-gray-800 text-gray-500 cursor-wait"
                          : "bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {savingKey === s.key ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Informational Note */}
      <div className="p-5 bg-[#0a0c10]/90 border border-gray-800 rounded-[24px] flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
          การตั้งค่าทั้งหมดจะมีผลทันทีหลังกด Save โดยหน้าเว็บจะดึงค่าใหม่เมื่อผู้ใช้โหลดหน้าเว็บครั้งถัดไป
          <br />
          <span className="text-gray-600">
            หากต้องการเพิ่มค่าตั้งค่าใหม่ สามารถเพิ่มได้ผ่านฐานข้อมูลโดยตรง (ตาราง SiteSetting)
          </span>
        </p>
      </div>
    </div>
  );
}
