"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Server, Plus, Trash2, Edit2, ShieldCheck, CheckCircle2, RotateCw, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function NodeClientTable({ initialNodes }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Modal State
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'delete'
  const [selectedNode, setSelectedNode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    url: "localhost:8080",
    isActive: true,
  });

  const openCreateModal = () => {
    setForm({ name: "", url: "localhost:8080", isActive: true });
    setModalType("create");
    setSelectedNode(null);
  };

  const openEditModal = (n) => {
    let host = n.url || "http://localhost:8080";
    if (host.startsWith("https://")) { host = host.substring(8); }
    else if (host.startsWith("http://")) { host = host.substring(7); }

    setForm({
      name: n.name,
      url: host,
      isActive: n.isActive,
    });
    setSelectedNode(n);
    setModalType("edit");
    setDropdownOpen(null);
  };

  const openDeleteModal = (n) => {
    setSelectedNode(n);
    setModalType("delete");
    setDropdownOpen(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedNode(null);
    setIsProcessing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const isEdit = modalType === "edit";
      const payload = { ...form };

      // Auto embed HTTP protocol if missing
      if (!payload.url.startsWith("http://") && !payload.url.startsWith("https://")) {
        payload.url = "http://" + payload.url;
      }

      if (isEdit) payload.id = selectedNode.id;

      const res = await fetch("/api/admin/nodes", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "อัปเดต Node สำเร็จ" : "สร้าง Node ใหม่สำเร็จ");

        // Optimistic UX Update
        const updatedN = isEdit ? data.node : data;
        let newNodes = isEdit
          ? nodes.map(n => n.id === updatedN.id ? updatedN : n)
          : [updatedN, ...nodes];

        setNodes(newNodes);
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

  const handleRegenerateToken = async (id) => {
    if (!confirm("Are you sure? This will break existing server connections relying on the old token.")) return;
    setIsProcessing(true);
    setDropdownOpen(null);
    try {
      const res = await fetch("/api/admin/nodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, regenerateToken: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Regenerated Token");
        setNodes(nodes.map(n => n.id === id ? data.node : n));
      } else {
        toast.error(data.error || "Failed to regenerate");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/admin/nodes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedNode.id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("ลบ Node สำเร็จ");
        setNodes(nodes.filter(n => n.id !== selectedNode.id));
        closeModal();
      } else {
        toast.error(data.error || "ลบ Node ไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("ข้อผิดพลาดเครือข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasDomains = selectedNode?._count?.domains > 0;

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreateModal}
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,217,126,0.3)] transition-all"
        >
          <Plus size={18} className="mr-2" /> Add Node
        </button>
      </div>

      <div className="bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-white/5 rounded-[24px] shadow-xl">
        <div className={`w-full bg-[#121620] rounded-[23px] custom-scrollbar ${dropdownOpen ? 'overflow-visible' : 'overflow-x-auto'}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#121620] border-b border-white/5">
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Node Name</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Connection URL</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Token Auth</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Domains</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Settings</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right last:rounded-tr-[23px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#121620]">
              {nodes.map((n) => (
                <tr key={n.id} className="hover:bg-white/[0.02] transition-colors duration-200 group last:[&>td:first-child]:rounded-bl-[23px] last:[&>td:last-child]:rounded-br-[23px]">
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                        <Server size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-[15px] font-extrabold text-white">
                          {n.name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">ID: {n.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-5">
                    <span className="text-[12px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-1 rounded-md">{n.url}</span>
                  </td>
                  <td className="px-7 py-5 relative max-w-[200px]">
                    <div className="group/token flex items-center gap-2">
                      <span className="text-[12px] font-mono text-gray-400 truncate w-32 filter blur-[4px] hover:blur-none transition-all cursor-pointer">
                        {n.token}
                      </span>
                      <button onClick={() => { navigator.clipboard.writeText(n.token); toast.success("Copied to clipboard!"); }} className="text-gray-500 hover:text-white transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">Hover to view token</p>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${n._count.domains > 0 ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-500"}`}>
                        {n._count.domains} Domains
                      </span>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    {n.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-gray-800 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className={`px-7 py-5 whitespace-nowrap text-right text-sm font-medium relative ${dropdownOpen === n.id ? 'z-50' : 'z-10'}`}>
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === n.id ? null : n.id)}
                      className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800 focus:outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen === n.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)}></div>
                        <div className="absolute right-7 top-10 mt-1 w-48 bg-[#1a1f2b] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in origin-top-right">
                          <button
                            onClick={() => openEditModal(n)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors font-medium"
                          >
                            <Edit2 size={16} /> Edit Settings
                          </button>
                          <button
                            onClick={() => handleRegenerateToken(n.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 transition-colors font-medium border-t border-white/5"
                          >
                            <RotateCw size={16} /> Regenerate Token
                          </button>
                          <button
                            onClick={() => openDeleteModal(n)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-medium border-t border-white/5"
                          >
                            <Trash2 size={16} /> Delete Node
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-7 py-16 text-center text-gray-500 rounded-b-[23px]">
                    <div className="flex flex-col items-center">
                      <Server size={48} className="text-gray-800 mb-4 opacity-50" />
                      <p className="text-lg font-bold text-gray-500">No Nodes found.</p>
                      <p className="text-[13px] text-gray-600 mt-1">Add your physical tunnel server nodes here.</p>
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
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Server className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white">
                    {modalType === "edit" ? "Edit Node" : "Add New Node"}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage your Mineway Server infrastructure instances
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Node Identifier / Name</label>
                <input
                  required type="text"
                  placeholder="ex. TH-1 BKK Datacenter"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#161a22] border border-gray-800 rounded-xl px-4 py-3.5 text-white font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Connection URL</label>
                <input
                  type="text"
                  placeholder="ex. th1.mineway.cloud:8080"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-[#161a22] border border-gray-800 rounded-xl px-4 py-3.5 text-cyan-400 font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-600"
                />
                <p className="text-[11px] text-gray-500 mt-2 px-1">http:// / https:// will be appended in backend. Points to internal Express API port.</p>
              </div>

              <div className="p-5 bg-[#121620] border border-white/5 rounded-[20px] space-y-5 shadow-inner">
                {/* Active Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Node is Active</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Determine if API requests and connections are routed to this node</p>
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
                className="flex-1 py-3.5 rounded-xl text-white font-extrabold hover:brightness-110 shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Save Node"}
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
                  <p className="text-sm text-gray-400 mt-2 font-medium">ลบ Node <span className="text-rose-400 mx-1">{selectedNode?.name}</span> ออกจากระบบ</p>
                </div>

                {hasDomains && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-[16px] w-full text-left mt-2">
                    <p className="text-[13px] font-bold text-rose-400 flex items-center mb-1"><ShieldCheck className="w-4 h-4 mr-1" /> มี Domains ผูกอยู่ {selectedNode?._count?.domains} รายการ</p>
                    <p className="text-[11px] text-rose-300/70">โดเมนเหล่านี้จะสูญเสียการเข้าถึง Node โปรดแก้ไข Domain ให้ชี้ Node ใหม่</p>
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
                {isProcessing ? "Deleting..." : "Delete Node"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </>
  );
}
