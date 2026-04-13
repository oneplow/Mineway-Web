"use client";

import React, { useEffect, useState } from "react";
import { Users, UserPlus, Trash2, Shield, User } from "lucide-react";
import toast from "react-hot-toast";

export default function TunnelTeamManager({ tunnelId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteInput, setInviteInput] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  async function fetchCollaborators() {
    try {
      const res = await fetch(`/api/keys/${tunnelId}/collaborators`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollaborators();
  }, [tunnelId]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    setIsInviting(true);
    try {
      const res = await fetch(`/api/keys/${tunnelId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inviteInput.trim(), role: "viewer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");
      
      toast.success("เพิ่มผู้ดูแลร่วมสำเร็จ");
      setInviteInput("");
      fetchCollaborators();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(collaboratorId) {
    if (!confirm("ลบผู้ดูแลคนนี้ออกจาก Tunnel หรือไม่?")) return;
    try {
      const res = await fetch(`/api/keys/${tunnelId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      
      toast.success("ลบออกจากทีมสำเร็จ");
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading team...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121620] border border-white/5 rounded-2xl p-5 shadow-inner">
        <h4 className="text-[13px] font-bold text-gray-300 flex items-center gap-2 mb-4"><UserPlus size={16} className="text-cyan-400"/> เชิญผู้ดูแลร่วม</h4>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input 
            type="text" 
            placeholder="กรอกอีเมล หรือ Username" 
            value={inviteInput}
            onChange={e => setInviteInput(e.target.value)}
            className="flex-1 bg-[#1a1f2b] border border-gray-800 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
          />
          <button 
            type="submit" 
            disabled={isInviting || !inviteInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[13px] font-bold rounded-xl transition-all hover:brightness-110 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isInviting ? "Inviting..." : "เพิ่มเลย"}
          </button>
        </form>
        <p className="text-[11px] text-gray-500 mt-3 font-medium">ผู้ดูแลร่วมจะสามารถดูสถานะและรีเซ็ตกุญแจได้ แต่ไม่สามารถลบ Tunnel ทิ้งได้</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-[13px] font-bold text-gray-300 flex items-center gap-2 px-1"><Users size={16} className="text-indigo-400"/> สมาชิกในทีม ({collaborators.length})</h4>
        
        {collaborators.length === 0 ? (
          <div className="p-8 text-center bg-[#121620] border border-white/5 rounded-2xl border-dashed">
            <User size={32} className="mx-auto text-gray-700 mb-3 opacity-50" />
            <p className="text-[13px] font-bold text-gray-400">ยังไม่มีใครในทีมเลย</p>
            <p className="text-[11px] text-gray-600 mt-1">ชวนเพื่อนมาช่วยดูแลเซิร์ฟเวอร์โดยกรอกชื่อด้านบน</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-[#121620] border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  {c.user.image ? (
                    <img src={c.user.image} alt="" className="w-10 h-10 rounded-full bg-gray-800" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <User size={18} className="text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <h5 className="text-[13px] font-bold text-white leading-tight">{c.user.username || "Unknown"}</h5>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{c.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    <Shield size={12} /> {c.role}
                  </span>
                  <button 
                    onClick={() => handleRemove(c.id)}
                    className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="ลบออกจากทีม"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
