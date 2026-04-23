"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, ShieldAlert, ShieldCheck, Diamond, UserCog, UserPlus, Trash2, Mail, Lock, User as UserIcon, X, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function UserClientTable({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'points', 'role', 'create', 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "USER" });
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close dropdown when interacting outside (simplified handling)
  // Usually done with a ref, but here we can just close on any overlay click.

  const openModal = (user, type) => {
    setSelectedUser(user);
    setActiveModal(type);
    setDropdownOpen(null);
    if (type === "points") setInputValue("100"); // default top-up amount
    if (type === "quota") setInputValue("1"); // default extra keys
    if (type === "role" && user) setInputValue(user.role === "ADMIN" ? "USER" : "ADMIN");
    if (type === "create") setFormData({ username: "", email: "", password: "", role: "USER" });
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setInputValue("");
    setFormData({ username: "", email: "", password: "", role: "USER" });
    setIsProcessing(false);
  };

  const handleUpdate = async () => {
    if (!activeModal) return;
    setIsProcessing(true);

    try {
      if (activeModal === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("สร้างผู้ใช้งานใหม่สำเร็จ!");
          setUsers([data.user, ...users]);
          closeModal();
        } else {
          toast.error(data.error || "เกิดข้อผิดพลาดในการสร้าง");
        }
        return;
      }

      if (activeModal === "delete") {
        const res = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("ลบผู้ใช้งานสำเร็จ!");
          setUsers(users.filter(u => u.id !== selectedUser.id));
          closeModal();
        } else {
          toast.error(data.error || "ลบผู้ใช้ไม่สำเร็จ");
        }
        return;
      }

      // Update Points, Role, or Quota
      const payload = { userId: selectedUser.id };
      if (activeModal === "points") {
        payload.action = "adjustPoints";
        payload.pointAmount = Number(inputValue);
      } else if (activeModal === "quota") {
        payload.action = "adjustQuota";
        payload.pointAmount = Number(inputValue);
      } else if (activeModal === "role") {
        payload.action = "updateRole";
        payload.role = inputValue;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ!");
        
        // Update local state instantly
        setUsers(users.map(u => {
          if (u.id === selectedUser.id) {
            if (activeModal === "points") return { ...u, points: data.user.points };
            if (activeModal === "role") return { ...u, role: data.user.role };
          }
          return u;
        }));
        
        closeModal();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการอัปเดต");
      }
    } catch (err) {
      console.error(err);
      toast.error("มีปัญหาการเชื่อมต่อข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1"></div>
        <button
          onClick={() => openModal(null, 'create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,217,126,0.2)] hover:shadow-[0_0_30px_rgba(16,217,126,0.4)] hover:-translate-y-0.5 transition-all"
        >
          <UserPlus size={18} />
          Create New User
        </button>
      </div>

      <div className="bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-white/5 rounded-[24px] shadow-xl">
        <div className="w-full bg-[#121620] rounded-[23px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121620] border-b border-white/5">
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest first:rounded-tl-[23px]">User</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Points</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tunnels</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right last:rounded-tr-[23px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#121620]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors duration-200 group last:[&>td:first-child]:rounded-bl-[23px] last:[&>td:last-child]:rounded-br-[23px]">
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-11 w-11 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-white shadow-lg outline outline-2 outline-gray-900 group-hover:outline-purple-500/30 transition-all">
                        {u.name?.[0] || u.username?.[0] || "?"}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-white mb-0.5">{u.username || u.name || "Unknown"}</div>
                        <div className="text-[12px] text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    {u.role === "ADMIN" ? (
                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500/10 to-orange-500/10 text-rose-400 border border-rose-500">
                         <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                         Administrator
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400">
                         <ShieldCheck className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                         Standard User
                       </span>
                    )}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <Diamond className="w-4 h-4 text-emerald-400 mr-2 opacity-70" />
                      <span className="text-sm font-extrabold text-white">{u.points.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800">
                      <span className="text-sm font-bold text-gray-300">{u._count?.apiKeys || 0}</span>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-[13px] font-medium text-gray-500">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </td>
                  <td className={`px-7 py-5 whitespace-nowrap text-right text-sm font-medium relative ${dropdownOpen === u.id ? 'z-50' : 'z-10'}`}>
                    <button 
                      onClick={() => setDropdownOpen(dropdownOpen === u.id ? null : u.id)}
                      className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800 focus:outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {dropdownOpen === u.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)}></div>
                        <div className="absolute right-9 top-14 mt-1 w-56 bg-[#161a22] border border-gray-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-slide-up py-2 text-left">
                          <button
                            onClick={() => openModal(u, 'points')}
                            className="w-full flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors font-medium"
                          >
                            <Diamond className="w-4 h-4 mr-3" /> Adjust Balance
                          </button>
                          <button
                            onClick={() => openModal(u, 'quota')}
                            className="w-full flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors font-medium border-t border-gray-800"
                          >
                            <ShieldCheck className="w-4 h-4 mr-3" /> Adjust Max Tunnels
                          </button>
                          <button
                            onClick={() => openModal(u, 'role')}
                            className="w-full flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors font-medium border-t border-gray-800"
                          >
                            <UserCog className="w-4 h-4 mr-3" /> Modify Privileges
                          </button>
                          <button
                            onClick={() => openModal(u, 'delete')}
                            className="w-full flex items-center px-5 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium border-t border-gray-800"
                          >
                            <Trash2 className="w-4 h-4 mr-3" /> Terminate Account
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center text-gray-500 rounded-b-[23px]">
                    <div className="flex flex-col items-center">
                      <UserCog size={48} className="text-gray-800 mb-4" />
                      <p className="text-lg font-medium">No users found.</p>
                      <p className="text-sm">They must register first.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Output */}
      {activeModal && activeModal !== "create" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-[#0d1017] border border-gray-800 rounded-[28px] w-full max-w-md animate-scale-up shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <div className="px-8 py-6 border-b border-gray-800 bg-gray-900/30">
               <h3 className="text-2xl font-extrabold text-white">
                 {activeModal === "points" && "Adjust Wallet Balance"}
                 {activeModal === "quota" && "Adjust Tunnel Quota"}
                 {activeModal === "role" && "System Privileges"}
                 {activeModal === "delete" && "Terminate Account"}
               </h3>
               {selectedUser && (
                 <p className="text-sm text-gray-400 mt-1">
                   Targeting user: <span className="text-emerald-400 font-bold">{selectedUser?.username || selectedUser?.email}</span>
                 </p>
               )}
            </div>

            <div className="p-8">
               {activeModal === "points" && (
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Amount to Add/Subtract</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">PTS</span>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="100, -50"
                      className="w-full bg-[#161a22] border border-gray-800 rounded-xl pl-16 pr-4 py-4 text-white text-xl font-black focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 px-1">
                    <p className="text-xs font-bold text-gray-500">Current Balance:</p>
                    <p className="text-sm font-black text-emerald-400">{selectedUser?.points.toLocaleString()} PTS</p>
                  </div>
                </div>
              )}

              {activeModal === "quota" && (
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Extra API Keys to Add/Subtract</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">QTY</span>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="1, -1"
                      className="w-full bg-[#161a22] border border-gray-800 rounded-xl pl-16 pr-4 py-4 text-white text-xl font-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-3 px-1">Increase or decrease the amount of extra tunnels this user can create beyond their base plan.</p>
                </div>
              )}

              {activeModal === "role" && (
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Select Access Level</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setInputValue("USER")}
                      className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                        inputValue === "USER" ? "bg-gray-800 border-gray-600 text-white shadow-lg" : "bg-[#161a22] border-transparent text-gray-500 hover:bg-gray-800/80"
                      }`}
                    >
                      <ShieldCheck size={28} className={inputValue === "USER" ? "text-gray-300" : "text-gray-600"} />
                      <span className="text-sm font-black tracking-wider">STANDARD</span>
                    </button>
                    <button
                      onClick={() => setInputValue("ADMIN")}
                      className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                        inputValue === "ADMIN" ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg" : "bg-[#161a22] border-transparent text-gray-500 hover:bg-gray-800/80"
                      }`}
                    >
                      <ShieldAlert size={28} className={inputValue === "ADMIN" ? "text-rose-500" : "text-gray-600"} />
                      <span className="text-sm font-black tracking-wider">ADMIN</span>
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "delete" && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Are you completely sure?</h4>
                  <p className="text-sm text-gray-400">
                    This action will permanently delete <strong>{selectedUser?.username || selectedUser?.email}</strong> and all of their associated API Keys and configurations. This CANNOT be undone.
                  </p>
                </div>
              )}
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
                disabled={isProcessing || (activeModal === 'create' ? (!formData.email || !formData.password) : ['points', 'role', 'quota'].includes(activeModal) ? !inputValue : false)}
                className={`flex-1 py-3.5 rounded-xl font-extrabold hover:brightness-110 shadow-lg transition-all disabled:opacity-50 ${
                  activeModal === 'delete' 
                    ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.2)]'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,217,126,0.2)]'
                }`}
              >
                {isProcessing ? "Processing..." : activeModal === 'delete' ? "Yes, Terminate Account" : "Confirm & Save"}
              </button>
            </div>
            
          </div>
        </div>,
        document.body
      )}

      {/* Advanced "Plan-style" Create Modal */}
      {activeModal === "create" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative w-full max-w-xl bg-[#111318] ring-1 ring-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0d0f14]">
              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  Add New User
                </h3>
                <p className="text-sm text-gray-400 mt-1">Manually register an account for the system.</p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: "#111318" }}>
              <div className="space-y-8">
                
                {/* 1. Basic Info */}
                <div>
                  <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-5 flex items-center">
                    <span className="w-6 h-[2px] bg-emerald-400 mr-3"></span> Identity
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                      <input 
                        type="text"
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        placeholder="MC_Player123" 
                        className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all shadow-inner" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address <span className="text-rose-500">*</span></label>
                      <input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="john@example.com" 
                        className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all shadow-inner" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Security & Access */}
                <div>
                  <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-5 flex items-center">
                    <span className="w-6 h-[2px] bg-emerald-400 mr-3"></span> Security & Access
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password <span className="text-rose-500">*</span></label>
                      <input 
                        type="password"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="Secret123" 
                        className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all shadow-inner" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Role</label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                          className="w-full flex items-center justify-between bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none hover:bg-[#1f232d] transition-all shadow-inner"
                        >
                          <span className="font-bold tracking-wide flex items-center gap-2">
                            {formData.role === "ADMIN" ? (
                              <><ShieldAlert size={16} className="text-rose-400" /> Administrator</>
                            ) : (
                              <><ShieldCheck size={16} className="text-gray-400" /> Standard User</>
                            )}
                          </span>
                          <ChevronDown size={16} className={`text-gray-500 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      
                      {roleDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)}></div>
                          <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#1a1d25] border border-white/10 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[999] animate-slide-up">
                            <button
                              type="button"
                              onClick={() => { setFormData({...formData, role: "USER"}); setRoleDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className={formData.role === "USER" ? "text-emerald-400" : "text-gray-500"} />
                                <span className={formData.role === "USER" ? "font-bold text-emerald-400 tracking-wide" : "font-medium tracking-wide"}>Standard User</span>
                              </div>
                              {formData.role === "USER" && <Check size={16} className="text-emerald-400" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFormData({...formData, role: "ADMIN"}); setRoleDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 border-t border-white/5 text-sm text-gray-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className={formData.role === "ADMIN" ? "text-rose-400" : "text-gray-500"} />
                                <span className={formData.role === "ADMIN" ? "font-bold text-rose-400 tracking-wide" : "font-medium tracking-wide"}>Administrator</span>
                              </div>
                              {formData.role === "ADMIN" && <Check size={16} className="text-rose-400" />}
                            </button>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-white/5 bg-[#0d0f14] flex justify-between items-center z-10 shrink-0">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-6 py-2.5 rounded-xl text-gray-400 font-bold hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isProcessing || !formData.email || !formData.password}
                className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-extrabold shadow-[0_0_20px_rgba(16,217,126,0.2)] transition-all disabled:opacity-50"
              >
                {isProcessing ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
