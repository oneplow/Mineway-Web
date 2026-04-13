"use client";
import React, { useEffect, useState, useRef } from "react";
import { X, Copy, ShieldCheck, Trash2, Calendar, HardDrive, Globe, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import TunnelAnalyticsChart from "./TunnelAnalyticsChart";
import TunnelTeamManager from "./TunnelTeamManager";

function StatusBadge({ status }) {
  const cfg = {
    active: { base: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#10d97e]", dot: "bg-emerald-500 dark:bg-[#10d97e]", label: "ONLINE" },
    inactive: { base: "bg-gray-100 dark:bg-[#1e2330] text-gray-500 dark:text-[#8892a4]", dot: "bg-gray-400 dark:bg-[#4a5568]", label: "OFFLINE" },
    suspended: { base: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-[#ff4d4d]", dot: "bg-red-500 dark:bg-[#ff4d4d]", label: "SUSPENDED" },
  }[status] || { base: "bg-gray-100 dark:bg-[#1e2330] text-gray-500", dot: "bg-gray-400", label: status?.toUpperCase() };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wider ${cfg.base}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

export default function KeyDetailsDrawer({ isOpen, onClose, apiKey, onCopy, onToggle, onDeleteRequest, onResetRequest }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const lastKeyRef = useRef(null);



  // Keep a snapshot of the last valid apiKey so we can render during exit animation
  if (apiKey) {
    lastKeyRef.current = apiKey;
  }
  const displayKey = apiKey || lastKeyRef.current;

  // Handle mount/unmount timing
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => {
        setIsMounted(false);
        lastKeyRef.current = null; // Clear snapshot after exit animation completes
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trigger enter animation AFTER browser has painted the initial (hidden) frame
  useEffect(() => {
    if (isMounted && isOpen) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isMounted, isOpen]);

  // Reset internal state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setActiveTab("overview"), 300);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  if (!isMounted || !displayKey) return null;

  const rxGB = (displayKey.rxBytes / (1024 * 1024 * 1024)).toFixed(2);
  const txGB = (displayKey.txBytes / (1024 * 1024 * 1024)).toFixed(2);



  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] md:w-[450px] bg-[#f8fafc] dark:bg-[#0a0c0f] border-l border-gray-200 dark:border-[#1e2330] shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-[#111318] border-b border-gray-200 dark:border-[#1e2330]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#e8ecf4] mb-1">{displayKey.name}</h2>
            <StatusBadge status={displayKey.status} />
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e2330] rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#1e2330] [&::-webkit-scrollbar-thumb]:rounded-full">

          <div className="flex bg-gray-100 dark:bg-[#0a0c0f] p-1 rounded-xl mb-2 border border-gray-200 dark:border-white/5">
            <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Overview</button>
            <button onClick={() => setActiveTab('analytics')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Analytics</button>
            <button onClick={() => setActiveTab('team')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${activeTab === 'team' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Team</button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">

              {/* Key Prefix */}
              <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-5 shadow-sm">
                <div className="text-[12px] font-bold text-gray-500 dark:text-[#8892a4] uppercase tracking-widest mb-3">API Key Prefix</div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0a0c0f] p-3 rounded-xl border border-gray-100 dark:border-[#1e2330]">
                  <code className="font-mono text-[14px] text-gray-900 dark:text-[#e8ecf4] flex-1 break-all select-all">{displayKey.prefix}••••••••</code>
                  <button
                    onClick={() => onCopy(displayKey.prefix)}
                    className="p-2 text-gray-500 dark:text-[#8892a4] bg-white dark:bg-[#111318] hover:text-[#10d97e] dark:hover:text-[#10d97e] hover:shadow-sm border border-gray-200 dark:border-[#1e2330] rounded-lg transition-all"
                    title="คัดลอก Prefix"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-[#4a5568] mt-3">
                  กุญแจเต็มจะแสดงครั้งเดียวตอนสร้างเท่านั้น ใช้ Prefix นี้เพื่อระบุตัวตนของ Key
                </p>
              </div>

              {/* Connection Address */}
              {displayKey.assignedPort && (
                <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-5 shadow-sm">
                  <div className="text-[12px] font-bold text-gray-500 dark:text-[#8892a4] uppercase tracking-widest mb-3">ที่อยู่สำหรับเชื่อมต่อ</div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0a0c0f] p-3 rounded-xl border border-gray-100 dark:border-[#1e2330]">
                    <code className="font-mono text-[14px] text-[#10d97e] flex-1 break-all select-all">{displayKey.subdomain || "mineway.cloud"}:{displayKey.assignedPort}</code>
                    <button
                      onClick={() => onCopy(`${displayKey.subdomain || "mineway.cloud"}:${displayKey.assignedPort}`)}
                      className="p-2 text-gray-500 dark:text-[#8892a4] bg-white dark:bg-[#111318] hover:text-[#10d97e] dark:hover:text-[#10d97e] hover:shadow-sm border border-gray-200 dark:border-[#1e2330] rounded-lg transition-all"
                      title="คัดลอกที่อยู่"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-[#4a5568] mt-3">
                    ใช้ที่อยู่นี้ได้ทั้ง Java Edition และ Bedrock Edition
                  </p>
                </div>
              )}

              {/* Stats Info */}
              <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-5 shadow-sm">
                <div className="text-[12px] font-bold text-gray-500 dark:text-[#8892a4] uppercase tracking-widest mb-4">ข้อมูลการเชื่อมต่อ</div>
                <div className="space-y-4">

                  {/* 
                TODO: Uncomment this block when Multi-Region support is fully implemented 
              */}
                  <div className="hidden items-center gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl"><Globe size={18} /></div>
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500 dark:text-[#8892a4]">ภูมิภาค (Region)</div>
                      <div className="font-semibold text-gray-900 dark:text-[#e8ecf4]">{displayKey.region}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl"><HardDrive size={18} /></div>
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500 dark:text-[#8892a4]">แบนด์วิดท์ (In / Out)</div>
                      <div className="font-mono text-sm text-gray-900 dark:text-[#e8ecf4]">
                        <span className="text-[#10d97e]">{rxGB} GB</span> <span className="text-gray-300 dark:text-[#4a5568]">/</span> <span className="text-blue-500">{txGB} GB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl"><Calendar size={18} /></div>
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500 dark:text-[#8892a4]">วันที่สร้าง</div>
                      <div className="font-semibold text-gray-900 dark:text-[#e8ecf4]">{new Date(displayKey.createdAt).toLocaleDateString('th-TH')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl"><Calendar size={18} /></div>
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500 dark:text-[#8892a4]">ใช้งานล่าสุด</div>
                      <div className="font-semibold text-gray-900 dark:text-[#e8ecf4]">
                        {displayKey.lastUsedAt ? new Date(displayKey.lastUsedAt).toLocaleString('th-TH') : "ยังไม่เคยใช้งาน"}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-fade-in pt-2">
              <TunnelAnalyticsChart tunnelId={displayKey.id} />
            </div>
          )}

          {activeTab === 'team' && (
            <div className="animate-fade-in pt-2">
              <TunnelTeamManager tunnelId={displayKey.id} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white dark:bg-[#111318] border-t border-gray-200 dark:border-[#1e2330] space-y-3">
          <button
            onClick={() => onToggle(displayKey)}
            className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border font-bold transition-colors ${displayKey.status === 'active'
              ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20'
              : 'border-[#10d97e]/30 bg-[#10d97e]/10 text-[#10d97e] hover:bg-[#10d97e]/20'
              }`}
          >
            <ShieldCheck size={18} />
            {displayKey.status === 'active' ? "ระงับการเชื่อมต่อชั่วคราว (Pause)" : "เปิดการเชื่อมต่อ (Resume)"}
          </button>

          <button
            onClick={() => onResetRequest(displayKey)}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#111318] hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-500 font-bold transition-colors"
          >
            <RefreshCw size={18} />
            สุ่มสร้างกุญแจใหม่ (Reset Key)
          </button>

          <button
            onClick={() => onDeleteRequest(displayKey)}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#111318] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 font-bold transition-colors"
          >
            <Trash2 size={18} />
            ลบ API Key ถาวร
          </button>
        </div>

      </div>
    </div>
  );
}
