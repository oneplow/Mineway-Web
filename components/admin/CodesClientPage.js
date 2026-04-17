"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Key, Users, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PageLoader from "@/components/ui/PageLoader";

export default function CodesClientPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    points: "",
    maxUses: "1",
    expiresAt: ""
  });

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/codes");
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (e) {
      toast.error("Failed to fetch codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.points) return toast.error("Code and points are required");
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create code");
      toast.success("Code created successfully");
      setFormData({ code: "", points: "", maxUses: "1", expiresAt: "" });
      fetchCodes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this code?")) return;
    try {
      const res = await fetch(`/api/admin/codes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Code deleted");
      fetchCodes();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Key className="w-8 h-8 text-[#10d97e]" /> Redemption Codes
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-2">Generate codes that users can redeem for points.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0a0c10] rounded-2xl p-6 ring-1 ring-black/5 dark:ring-white/5 shadow-xl h-fit">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Create New Code</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Code (e.g. SUMMER26)</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="FREE500"
                className="w-full bg-gray-50 dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-[#10d97e] outline-none transition-all uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Reward Points</label>
              <input 
                type="number" 
                value={formData.points} 
                onChange={(e) => setFormData({...formData, points: e.target.value})}
                placeholder="500"
                min="1"
                className="w-full bg-gray-50 dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-[#10d97e] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Max Usages</label>
              <input 
                type="number" 
                value={formData.maxUses} 
                onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                min="1"
                className="w-full bg-gray-50 dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-[#10d97e] outline-none transition-all"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">Set to higher number for a community code.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expiry Date (Optional)</label>
              <input 
                type="datetime-local" 
                value={formData.expiresAt} 
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-[#10d97e] outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[#10d97e] text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all shadow-lg"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus size={18} /> Generate Code</>}
            </button>
          </form>
        </div>

        {/* Existing Codes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Manage Codes</h2>
          {codes.length === 0 ? (
            <div className="bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-12 text-center">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No redemption codes active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {codes.map(c => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isMaxedOut = c.currentUses >= c.maxUses;
                const status = isExpired ? "Expired" : isMaxedOut ? "Depleted" : "Active";
                const bg = status === "Active" ? "bg-white dark:bg-[#0a0c10] ring-[#10d97e]/20" : "bg-gray-50 dark:bg-[#121620] ring-red-500/10 opacity-70";
                
                return (
                  <div key={c.id} className={`${bg} rounded-2xl p-5 ring-1 shadow-sm transition-all relative overflow-hidden group`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-mono text-xl font-black tracking-wider text-gray-900 dark:text-white uppercase break-all">
                          {c.code}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${status === 'Active' ? 'bg-[#10d97e]/10 text-[#10d97e]' : 'bg-red-500/10 text-red-500'}`}>{status}</span>
                          <span className="text-xs font-bold text-amber-500">+{c.points} Pts</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-black p-2 rounded-full shadow-sm hover:shadow-md">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800/50 pt-3">
                        <span className="flex items-center gap-1.5"><Users size={14} /> Usages</span>
                        <span className="font-bold text-gray-900 dark:text-gray-300">
                          {c.currentUses} / {c.maxUses}
                        </span>
                      </div>
                      {c.expiresAt && (
                        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800/50 pt-2">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> Expires</span>
                          <span className="font-medium text-xs">{new Date(c.expiresAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {/* Background decor */}
                    <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      <Key size={120} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
