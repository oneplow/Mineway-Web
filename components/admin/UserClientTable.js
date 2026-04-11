"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, ShieldAlert, ShieldCheck, Diamond, UserCog } from "lucide-react";
import toast from "react-hot-toast";

export default function UserClientTable({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'points' or 'role'
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Close dropdown when interacting outside (simplified handling)
  // Usually done with a ref, but here we can just close on any overlay click.

  const openModal = (user, type) => {
    setSelectedUser(user);
    setActiveModal(type);
    setDropdownOpen(null);
    if (type === "points") setInputValue("100"); // default top-up amount
    if (type === "role") setInputValue(user.role === "ADMIN" ? "USER" : "ADMIN");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setInputValue("");
    setIsProcessing(false);
  };

  const handleUpdate = async () => {
    if (!selectedUser || !activeModal) return;
    setIsProcessing(true);

    try {
      const payload = { userId: selectedUser.id };
      if (activeModal === "points") {
        payload.action = "adjustPoints";
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
                  <td className="px-7 py-5 whitespace-nowrap text-right text-sm font-medium relative">
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
                            onClick={() => openModal(u, 'role')}
                            className="w-full flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors font-medium border-t border-gray-800"
                          >
                            <UserCog className="w-4 h-4 mr-3" /> Modify Privileges
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
      {activeModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-[#0d1017] border border-gray-800 rounded-[28px] w-full max-w-md animate-scale-up shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <div className="px-8 py-6 border-b border-gray-800 bg-gray-900/30">
               <h3 className="text-2xl font-extrabold text-white">
                 {activeModal === "points" ? "Adjust Wallet Balance" : "System Privileges"}
               </h3>
               <p className="text-sm text-gray-400 mt-1">
                 Targeting user: <span className="text-emerald-400 font-bold">{selectedUser?.username || selectedUser?.email}</span>
               </p>
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
                disabled={isProcessing || !inputValue}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold hover:brightness-110 shadow-[0_0_20px_rgba(16,217,126,0.2)] transition-all disabled:opacity-50"
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
