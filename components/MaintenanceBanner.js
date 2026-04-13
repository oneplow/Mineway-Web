"use client";

import { useSettings } from "@/components/SettingsProvider";
import { Wrench, Pickaxe } from "lucide-react";

export default function MaintenanceBanner() {
  const settings = useSettings();

  if (settings.maintenanceMode !== "true") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] dark:from-[#050505] dark:to-[#0a0c10] flex items-center justify-center px-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto mb-8 w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white">
            <Pickaxe size={14} />
          </div>
          <span className="font-syne font-bold text-lg text-gray-900 dark:text-[#e8ecf4]">{settings.siteName}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          ระบบปิดปรับปรุงชั่วคราว
        </h1>
        <p className="text-gray-500 dark:text-[#8892a4] leading-relaxed">
          {settings.maintenanceMessage || "ระบบกำลังปรับปรุง กรุณากลับมาใหม่ภายหลัง"}
        </p>
        <div className="mt-8 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          กำลังดำเนินการ...
        </div>
      </div>
    </div>
  );
}
