"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { createPortal } from "react-dom";
import { MoreVertical, ArrowUpRight, ArrowDownRight, KeyRound, Wifi, WifiOff, ShieldAlert, Trash2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function TunnelClientTable({ initialTunnels }) {
  const [tunnels, setTunnels] = useState(initialTunnels);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'delete' or 'suspend'
  const [selectedTunnel, setSelectedTunnel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = (tunnel, type) => {
    setSelectedTunnel(tunnel);
    setActiveModal(type);
    setDropdownOpen(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTunnel(null);
    setIsProcessing(false);
  };

  const handleUpdate = async () => {
    if (!selectedTunnel || !activeModal) return;
    setIsProcessing(true);

    try {
      const payload = { tunnelId: selectedTunnel.id };
      
      if (activeModal === "delete") {
        payload.action = "delete";
      } else if (activeModal === "suspend") {
        payload.action = selectedTunnel.status === "active" ? "suspend" : "activate";
      }

      const res = await fetch("/api/admin/tunnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "อัปเดตข้อมูลสำเร็จ!");
        
        // Update local state
        if (activeModal === "delete") {
          setTunnels(tunnels.filter(t => t.id !== selectedTunnel.id));
        } else {
          setTunnels(tunnels.map(t => t.id === selectedTunnel.id ? { ...t, status: payload.action === "activate" ? "active" : "suspended" } : t));
        }
        
        closeModal();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการอัปเดต");
      }
    } catch (err) {
      console.error(err);
      toast.error("มีปัญหาเครือข่ายในการติดต่อเซิร์ฟเวอร์");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-white/5 rounded-[24px] shadow-xl">
        <div className="w-full bg-[#121620] rounded-[23px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121620] border-b border-white/5">
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest first:rounded-tl-[23px]">Status</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tunnel / Port</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Owner</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Bandwidth (TX / RX)</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Sync</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right last:rounded-tr-[23px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#121620]">
              {tunnels.map((t) => {
                const rxMB = (Number(t.rxBytes) / 1024 / 1024).toFixed(2);
                const txMB = (Number(t.txBytes) / 1024 / 1024).toFixed(2);
                
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors duration-200 group last:[&>td:first-child]:rounded-bl-[23px] last:[&>td:last-child]:rounded-br-[23px]">
                    <td className="px-7 py-5 whitespace-nowrap">
                      {t.status === "active" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${t.status === "suspended" ? "bg-red-500/10 text-red-500" : "bg-gray-800 text-gray-500"}`}>
                          <WifiOff className="w-3 h-3" />
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-[12px] text-gray-500 mt-0.5 font-mono">
                        th.mineway.me:{t.assignedPort || "pending"}
                      </div>
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-black text-white text-xs shadow-lg">
                          {(t.user?.username || t.user?.email || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-300">{t.user?.username || t.user?.email || "Deleted"}</span>
                      </div>
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-blue-400 font-bold">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                          {txMB} MB
                        </div>
                        <div className="flex items-center text-emerald-400 font-bold">
                          <ArrowDownRight className="w-3.5 h-3.5 mr-1.5" />
                          {rxMB} MB
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-[13px] font-medium text-gray-500">
                      {t.lastUsedAt ? formatDistanceToNow(new Date(t.lastUsedAt), { addSuffix: true }) : "Never"}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={() => setDropdownOpen(dropdownOpen === t.id ? null : t.id)}
                        className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800 focus:outline-none"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {dropdownOpen === t.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)}></div>
                          <div className="absolute right-7 top-10 mt-1 w-48 bg-[#1a1f2b] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in origin-top-right">
                            {t.status === "active" ? (
                              <button
                                onClick={() => openModal(t, "suspend")}
                                className="w-full text-left px-4 py-2.5 text-sm text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 transition-colors font-medium"
                              >
                                <ShieldAlert size={16} /> ระงับ Tunnel ชั่วคราว
                              </button>
                            ) : (
                              <button
                                onClick={() => openModal(t, "suspend")}
                                className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors font-medium"
                              >
                                <ShieldCheck size={16} /> เปิดใช้งาน Tunnel
                              </button>
                            )}
                            <button
                              onClick={() => openModal(t, "delete")}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-medium"
                            >
                              <Trash2 size={16} /> ลบ Tunnel ออกถาวร
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {tunnels.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-7 py-16 text-center text-gray-500 rounded-b-[23px]">
                    <div className="flex flex-col items-center">
                      <KeyRound size={48} className="text-gray-800 mb-4" />
                      <p className="text-lg font-bold text-gray-500">No active tunnels found.</p>
                      <p className="text-sm text-gray-600 mt-1">Users need to create tunnels from their dashboard.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Output */}
      {activeModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-[#0d1017] border border-gray-800 rounded-[28px] w-full max-w-md animate-scale-up shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <div className="px-8 py-6 border-b border-gray-800 bg-gray-900/30">
               <h3 className="text-2xl font-extrabold text-white">
                 {activeModal === "delete" ? "Delete Tunnel" : (selectedTunnel?.status === "active" ? "Suspend Tunnel" : "Activate Tunnel")}
               </h3>
               <p className="text-sm text-gray-400 mt-1">
                 Targeting tunnel: <span className="text-emerald-400 font-bold">{selectedTunnel?.name}</span>
               </p>
            </div>

            <div className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {activeModal === "delete" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white leading-tight">ยืนยันลบ Tunnel ถาวร?</p>
                      <p className="text-sm text-gray-400 mt-2">คุณกำลังจะลบ Tunnel นี้ทิ้ง (การกระทำนี้ไม่สามารถย้อนกลับได้)</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedTunnel?.status === "active" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                      {selectedTunnel?.status === "active" ? (
                         <ShieldAlert className="w-8 h-8 text-amber-500" />
                      ) : (
                         <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white leading-tight">
                        {selectedTunnel?.status === "active" ? "ยืนยันระงับใช้งาน Tunnel?" : "ยืนยันเปิดใช้งาน Tunnel?"}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">คุณแน่ใจหรือไม่ที่จะทำการเปลี่ยนสถานะ Tunnel นี้</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-800 bg-gray-900/30 flex gap-4">
              <button 
                onClick={closeModal}
                disabled={isProcessing}
                className="px-6 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isProcessing}
                className={`flex-1 py-3.5 rounded-xl text-white font-extrabold hover:brightness-110 shadow-lg transition-all disabled:opacity-50 ${
                  activeModal === "delete" || selectedTunnel?.status === "active" 
                    ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.2)]" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_20px_rgba(16,217,126,0.2)]"
                }`}
              >
                {isProcessing ? "Processing..." : "Confirm & Save"}
              </button>
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
