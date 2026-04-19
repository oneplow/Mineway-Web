"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { createPortal } from "react-dom";
import { MoreVertical, Globe, Plus, Trash2, Edit2, ShieldCheck, CheckCircle2, ChevronDown, Server } from "lucide-react";
import toast from "react-hot-toast";

function PingBadge({ ping }) {
  if (ping === undefined) return <span className="text-[10px] text-gray-500">Checking...</span>;
  if (ping === -1) return <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 rounded-full">Offline</span>;
  
  let colorClass = "text-emerald-500";
  let dotClass = "bg-emerald-500";
  if (ping > 150) {
    colorClass = "text-red-500";
    dotClass = "bg-red-500";
  } else if (ping > 50) {
    colorClass = "text-amber-500";
    dotClass = "bg-amber-500";
  }

  return (
    <span className={`flex items-center gap-1 text-[11px] font-bold ${colorClass} bg-white/5 px-2 rounded-full py-0.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
      {ping}ms
    </span>
  );
}

export default function DomainClientTable({ initialDomains, nodes }) {
  const [domains, setDomains] = useState(initialDomains);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  const [pingResults, setPingResults] = useState({});

  React.useEffect(() => {
    if (!domains || domains.length === 0) return;
    const fetchPings = async () => {
      const results = { ...pingResults };
      let changed = false;
      const promises = domains.map(async (d) => {
        if (results[d.id] !== undefined) return; // already scanned
        
        // If domain has no node linked, it's effectively offline
        if (!d.nodeId) {
          results[d.id] = -1;
          changed = true;
          return;
        }

        changed = true;
        try {
          const res = await fetch(`/api/nodes/ping?nodeId=${d.nodeId}`);
          if (!res.ok) throw new Error("Ping failed");
          
          const data = await res.json();
          results[d.id] = data.ping !== undefined ? data.ping : -1;
        } catch (e) {
          results[d.id] = -1;
        }
      });
      await Promise.all(promises);
      if (changed) setPingResults(results);
    };
    fetchPings();
  }, [domains]);

  // Modal State
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'delete'
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    domain: "",
    description: "",
    nodeId: "",
    cloudflareZoneId: "",
    isDefault: false,
    isActive: true,
  });

  const openCreateModal = () => {
    setForm({ domain: "", description: "", nodeId: "", cloudflareZoneId: "", isDefault: false, isActive: true });
    setModalType("create");
    setSelectedDomain(null);
  };

  const openEditModal = (d) => {
    setForm({
      domain: d.domain,
      description: d.description || "",
      nodeId: d.nodeId || "",
      cloudflareZoneId: d.cloudflareZoneId || "",
      isDefault: d.isDefault,
      isActive: d.isActive,
    });
    setSelectedDomain(d);
    setModalType("edit");
    setDropdownOpen(null);
  };

  const openDeleteModal = (d) => {
    setSelectedDomain(d);
    setModalType("delete");
    setDropdownOpen(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedDomain(null);
    setIsProcessing(false);
    setNodeDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const isEdit = modalType === "edit";
      const payload = { ...form };
      
      if (!payload.nodeId) delete payload.nodeId;
      
      if (isEdit) payload.id = selectedDomain.id;

      const res = await fetch("/api/admin/domains", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "อัปเดตโดเมนสำเร็จ" : "สร้างโดเมนใหม่สำเร็จ");
        
        // Optimistic UX Update
        const updatedD = isEdit ? data.domain : data;
        let newDomains = isEdit 
          ? domains.map(d => d.id === updatedD.id ? updatedD : d)
          : [updatedD, ...domains];

        // Ensure only one default exists in local state
        if (updatedD.isDefault) {
           newDomains = newDomains.map(d => d.id === updatedD.id ? d : { ...d, isDefault: false });
        }
        
        setDomains(newDomains);
        closeModal();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      toast.error("ข้อผิดพลาดเครือข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDomain) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/admin/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedDomain.id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("ลบโดเมนสำเร็จ");
        setDomains(domains.filter(d => d.id !== selectedDomain.id));
        closeModal();
      } else {
        toast.error(data.error || "ลบโดเมนไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("ข้อผิดพลาดเครือข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasTunnels = selectedDomain?._count?.apiKeys > 0;

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreateModal}
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,217,126,0.3)] transition-all"
        >
          <Plus size={18} className="mr-2" /> Add Domain
        </button>
      </div>

      <div className="bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-white/5 rounded-[24px] shadow-xl">
        <div className={`w-full bg-[#121620] rounded-[23px] custom-scrollbar ${dropdownOpen ? 'overflow-visible' : 'overflow-x-auto'}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#121620] border-b border-white/5">
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Domain</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tunnel Endpoint</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tunnels</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Settings</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right last:rounded-tr-[23px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#121620]">
              {domains.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors duration-200 group last:[&>td:first-child]:rounded-bl-[23px] last:[&>td:last-child]:rounded-br-[23px]">
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                        <Globe size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-[15px] font-extrabold text-white flex items-center gap-2">
                           {d.domain}
                           {d.isDefault && (
                             <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">Default</span>
                           )}
                           <PingBadge ping={pingResults[d.id]} />
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">ID: {d.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-5">
                    <span className="text-[13px] text-gray-400 font-medium">{d.description || "—"}</span>
                  </td>
                  <td className="px-7 py-5">
                    <div className="flex items-center space-x-2">
                       {d.node ? (
                         <span className="text-[12px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-1 rounded-md">{d.node.name}</span>
                       ) : (
                         <span className="text-[12px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-md">Unassigned</span>
                       )}
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                       <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${d._count.apiKeys > 0 ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-500"}`}>
                         {d._count.apiKeys} Tunnels
                       </span>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                     {d.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                     ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-gray-800 text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Inactive
                        </span>
                     )}
                  </td>
                  <td className={`px-7 py-5 whitespace-nowrap text-right text-sm font-medium relative ${dropdownOpen === d.id ? 'z-50' : 'z-10'}`}>
                    <button 
                      onClick={() => setDropdownOpen(dropdownOpen === d.id ? null : d.id)}
                      className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800 focus:outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen === d.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)}></div>
                        <div className="absolute right-7 top-10 mt-1 w-48 bg-[#1a1f2b] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in origin-top-right">
                          <button
                            onClick={() => openEditModal(d)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors font-medium"
                          >
                            <Edit2 size={16} /> Edit Settings
                          </button>
                          <button
                            onClick={() => openDeleteModal(d)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-medium border-t border-white/5"
                          >
                            <Trash2 size={16} /> Delete Domain
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-7 py-16 text-center text-gray-500 rounded-b-[23px]">
                    <div className="flex flex-col items-center">
                      <Globe size={48} className="text-gray-800 mb-4 opacity-50" />
                      <p className="text-lg font-bold text-gray-500">No domains found.</p>
                      <p className="text-[13px] text-gray-600 mt-1">Add a domain to allow users to create subdomains.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {(modalType === "create" || modalType === "edit") && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
           <div className="relative bg-[#0a0c10] border border-gray-800 rounded-[28px] w-full max-w-lg animate-scale-up shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
             
             {/* Modal Header */}
             <div className="px-8 py-6 border-b border-gray-800 bg-gray-900/30 flex-shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                   <Globe className="w-5 h-5 text-cyan-400" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-extrabold text-white">
                     {modalType === "edit" ? "Edit Domain" : "Add New Domain"}
                   </h3>
                   <p className="text-sm text-gray-400 mt-1">
                     ตั้งค่าโดเมนสำหรับระบบ Subdomain Tunnel
                   </p>
                 </div>
               </div>
             </div>

             {/* Modal Body */}
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Domain Name</label>
                  <input 
                    required type="text"
                    placeholder="ex. lexten.store, mineway.me" 
                    value={form.domain} 
                    onChange={e => setForm({ ...form, domain: e.target.value })}
                    className="w-full bg-[#161a22] border border-gray-800 rounded-xl px-4 py-3.5 text-white font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-600" 
                  />
                  <p className="text-[11px] text-gray-500 mt-2 px-1">กรอกชื่อโดเมนเท่านั้น ห้ามพิมพ์ * หรือ http://</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Description (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Short description for this domain" 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#161a22] border border-gray-800 rounded-xl px-4 py-3.5 text-white font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-600" 
                  />
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Physical Node (Infrastructure)</label>
                  <div
                    onClick={() => setNodeDropdownOpen(!nodeDropdownOpen)}
                    className="w-full bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm font-bold outline-none cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-500 shadow-inner transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                       <Server size={16} className="text-cyan-400" />
                       <span>{form.nodeId && nodes ? nodes.find(n => n.id === form.nodeId)?.name : "-- Select a Node --"}</span>
                       {form.nodeId && nodes && (
                         <span className="text-gray-500 font-mono text-[11px] ml-1">({nodes.find(n => n.id === form.nodeId)?.url})</span>
                       )}
                    </span>
                    <ChevronDown size={18} className={`text-gray-500 transition-transform ${nodeDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {nodeDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[105]" onClick={() => setNodeDropdownOpen(false)}></div>
                      <div className="absolute top-[105%] left-0 right-0 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-xl shadow-xl z-[110] overflow-hidden animate-fade-in py-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {nodes?.map(n => (
                           <div
                             key={n.id}
                             onClick={() => { setForm({ ...form, nodeId: n.id }); setNodeDropdownOpen(false); }}
                             className={`px-4 py-3 cursor-pointer text-[14px] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors ${form.nodeId === n.id ? 'bg-[#10d97e]/10 text-[#10d97e] font-bold' : 'text-gray-700 dark:text-[#8892a4]'}`}
                           >
                             <span className="flex items-center gap-2">
                               <Server size={14} />
                               <span>{n.name}</span>
                               <span className="text-[11px] text-gray-500 font-mono ml-1">— {n.url}</span>
                             </span>
                             <div className="flex items-center gap-3">
                               {form.nodeId === n.id && <CheckCircle2 size={16} className="text-[#10d97e]" />}
                             </div>
                           </div>
                        ))}
                        {(!nodes || nodes.length === 0) && (
                           <div className="px-4 py-4 text-center text-sm text-gray-500">No nodes available.</div>
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-[11px] text-gray-500 mt-2 px-1">เลือก Node Server ที่โดเมนนี้จะเชื่อมต่อ</p>
                </div>

                <div className="bg-[#121620] border border-white/5 rounded-2xl p-5 shadow-inner">
                  <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 px-1">Cloudflare Zone ID (สำหรับฟีเจอร์ VIP Custom Port)</label>
                  <input 
                    type="text"
                    placeholder="เช่น 023e105f4ecef8ad9ca31a8372d0c353" 
                    value={form.cloudflareZoneId} 
                    onChange={e => setForm({ ...form, cloudflareZoneId: e.target.value })}
                    className="w-full bg-[#1a1f2b] border border-indigo-500/20 rounded-xl px-4 py-3 text-[13px] text-white font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-600" 
                  />
                  <p className="text-[11px] text-gray-500 mt-2 px-1">ระบบจะใช้ Zone ID นี้ร่วมกับ Token ใน .env เพื่อสร้าง SRV Records ให้อัตโนมัติ (ใส่หรือไม่ใส่ก็ได้)</p>
                </div>

                <div className="p-5 bg-[#121620] border border-white/5 rounded-[20px] space-y-5 shadow-inner">
                   {/* Default Toggle */}
                   <label className="flex items-center justify-between cursor-pointer group">
                     <div>
                       <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Set as Default Domain</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">หากไม่พบการกำหนดระบบจะเลือกโดเมนนี้ให้อัตโนมัติในหน้าสร้าง Tunnel</p>
                     </div>
                     <div className="relative inline-block w-11 h-6 align-middle select-none flex-shrink-0 mr-2">
                       <input type="checkbox" id="default-toggle" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="peer sr-only" />
                       <div className={`block h-6 w-11 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${form.isDefault ? 'bg-cyan-500' : 'bg-gray-700'}`}></div>
                       <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out pointer-events-none ${form.isDefault ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                   </label>
                   
                   <div className="h-px w-full bg-white/5"></div>

                   {/* Active Toggle */}
                   <label className="flex items-center justify-between cursor-pointer group">
                     <div>
                       <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Domain is Active</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">กุญแจใหม่จะสามารถเลือกโดเมนนี้ได้ แต่ไม่มีผลกับ tunnel เก่าที่ใช้โดเมนนี้ไปแล้ว</p>
                     </div>
                     <div className="relative inline-block w-11 h-6 align-middle select-none flex-shrink-0 mr-2">
                       <input type="checkbox" id="active-toggle" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="peer sr-only" />
                       <div className={`block h-6 w-11 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${form.isActive ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                       <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out pointer-events-none ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                   </label>
                </div>
             </div>

             {/* Modal Footer */}
             <div className="px-8 py-5 border-t border-gray-800 bg-gray-900/30 flex gap-4 flex-shrink-0">
                <button 
                  onClick={closeModal}
                  disabled={isProcessing}
                  className="px-6 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-xl text-white font-extrabold hover:brightness-110 shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Saving..." : "Save Domain"}
                </button>
             </div>

           </div>
         </div>,
         document.body
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
           <div className="relative bg-[#0d1017] border border-gray-800 rounded-[28px] w-full max-w-md animate-scale-up shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
             
             <div className="p-8 pb-6">
                <div className="flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Trash2 className="w-8 h-8 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white leading-tight">ยืนยันลบทิ้ง?</p>
                    <p className="text-sm text-gray-400 mt-2 font-medium">ลบโดเมน <span className="text-rose-400 mx-1">{selectedDomain?.domain}</span> ออกจากระบบ</p>
                  </div>
                  
                  {hasTunnels && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-[16px] w-full text-left mt-2">
                       <p className="text-[13px] font-bold text-rose-400 flex items-center mb-1"><ShieldCheck className="w-4 h-4 mr-1" /> มี Tunnel ผูกอยู่ {selectedDomain?._count?.apiKeys} รายการ</p>
                       <p className="text-[11px] text-rose-300/70">หากลบ โดเมนที่ผูกกับ Tunnel เหล่านี้จะกลายเป็นค่าว่าง (NULL) การทำงานอาจผิดพลาดได้ แนะนำให้ปิด Active แทนการลบ</p>
                    </div>
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
                 onClick={handleDelete}
                 disabled={isProcessing}
                 className="flex-1 py-3.5 rounded-xl text-white font-extrabold hover:brightness-110 shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
               >
                 {isProcessing ? "Deleting..." : "Delete Domain"}
               </button>
             </div>
             
           </div>
         </div>,
         document.body
      )}

    </>
  );
}
