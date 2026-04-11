"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit, Trash2, CheckCircle2, X, Package, Zap, Users, KeyRound, Server } from "lucide-react";
import toast from "react-hot-toast";

export default function PlanClientTable({ initialPlans }) {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const defaultFormData = {
    id: null,
    name: "",
    displayName: "",
    pricePoints: 0,
    bandwidthGB: 0,
    maxPlayers: 0,
    maxKeys: 1,
    maxNodes: 1,
    features: "Premium Support, DDOS Protection, Low Latency",
    isPopular: false,
    isActive: true
  };
  
  const [formData, setFormData] = useState(defaultFormData);

  const openAddModal = () => {
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setFormData({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      pricePoints: p.pricePoints,
      bandwidthGB: p.bandwidthGB,
      maxPlayers: p.maxPlayers,
      maxKeys: p.maxKeys,
      maxNodes: p.maxNodes,
      features: Array.isArray(p.features) ? p.features.join(", ") : "",
      isPopular: p.isPopular,
      isActive: p.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ลบแพ็กเกจนี้? การลบจะทำได้ก็ต่อเมื่อไม่มีใครใช้แพ็กเกจนี้อยู่")) return;
    
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("ลบแพ็กเกจแล้ว");
        setPlans(plans.filter(p => p.id !== id));
      } else {
        toast.error(data.error || "ทำรายการไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("มีปัญหาเครือข่าย");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const payload = {
        ...formData,
        features: formData.features.split(",").map(f => f.trim()).filter(f => f)
      };

      const method = formData.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(formData.id ? "อัปเดตระบบเรียบร้อย" : "สร้างแพ็กเกจหรูหราสำเร็จ!");
        setIsModalOpen(false);
        if (formData.id) {
          setPlans(plans.map(p => p.id === data.plan.id ? data.plan : p));
        } else {
          setPlans([data.plan, ...plans]);
        }
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("มีปัญหาเครือข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Subscription Plans
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Manage pricing, limits, and premium features dynamically.</p>
        </div>
        <button
          onClick={openAddModal}
          className="group relative flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,217,126,0.3)] hover:shadow-[0_0_30px_rgba(16,217,126,0.5)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <Plus size={18} className="mr-2 relative z-10" />
          <span className="relative z-10">สร้าง Plan ใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {plans.map((p) => (
          <div 
            key={p.id} 
            className={`group relative p-[1px] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(16,217,126,0.2)] ${
              p.isPopular ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600' : 'bg-gray-800'
            } ${!p.isActive && 'opacity-60 hover:opacity-100 grayscale-[0.5]'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 z-0"></div>
            
            <div className={`relative h-full z-10 flex flex-col p-7 rounded-[23px] ${p.isPopular ? 'bg-[#0f141e]/95 backdrop-blur-xl' : 'bg-[#121620]'}`}>
              {p.isPopular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 flex">
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-gray-950 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className={`w-5 h-5 ${p.isPopular ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <h3 className="text-xl font-bold text-white">{p.displayName}</h3>
                  </div>
                  <code className="text-[11px] text-gray-500 bg-gray-900/50 px-2 py-0.5 rounded-md border border-gray-800">{p.name}</code>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(p)} className="p-2 backdrop-blur-md bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-400 rounded-xl transition-all">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 backdrop-blur-md bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-1.5">
                  <span className={`text-4xl font-extrabold ${p.isPopular ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300' : 'text-white'}`}>
                    {p.pricePoints}
                  </span>
                  <span className="text-sm font-medium text-gray-500 mb-1">Pts / mo</span>
                </div>
              </div>

              <div className="space-y-4 flex-1 mb-8">
                <div className="flex items-center text-[13px] text-gray-300 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800">
                  <Zap size={16} className="text-emerald-400 mr-3 shrink-0" /> <span className="font-bold text-white mr-1">{p.bandwidthGB} GB</span> Premium Bandwidth
                </div>
                <div className="flex items-center text-[13px] text-gray-300 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800">
                  <Users size={16} className="text-emerald-400 mr-3 shrink-0" /> <span className="font-bold text-white mr-1">{p.maxPlayers === 0 ? "Unlimited" : p.maxPlayers}</span> Max Players
                </div>
                <div className="flex items-center text-[13px] text-gray-300 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800">
                  <KeyRound size={16} className="text-emerald-400 mr-3 shrink-0" /> <span className="font-bold text-white mr-1">{p.maxKeys}</span> Dedicated Ports
                </div>
                <div className="flex items-center text-[13px] text-gray-300 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800">
                  <Server size={16} className="text-emerald-400 mr-3 shrink-0" /> <span className="font-bold text-white mr-1">{p.maxNodes}</span> Global Nodes
                </div>
              </div>

              <div className="pt-5 border-t border-gray-800/50 flex items-center justify-between mt-auto">
                <div>
                  {p.isActive ? (
                    <span className="flex items-center font-bold text-[11px] uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
                      ACTIVE
                    </span>
                  ) : (
                    <span className="flex items-center font-bold text-[11px] uppercase tracking-wider text-gray-500 bg-gray-800 px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></div>
                      HIDDEN
                    </span>
                  )}
                </div>
                <div className="text-[12px] font-bold text-gray-500">{p._count?.users || 0} Subscribed</div>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
            <Package size={48} className="text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Plans Created Yet</h3>
            <p className="text-gray-600 text-sm">Create your first subscription package to get started.</p>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-xl bg-[#111318] ring-1 ring-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0d0f14]">
              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  {formData.id ? "Edit Configuration" : "New Subscription Plan"}
                </h3>
                <p className="text-sm text-gray-400 mt-1">Design the perfect package for your users.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: "#111318" }}>
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Basic Info */}
                <div>
                  <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-5 flex items-center">
                    <span className="w-6 h-[2px] bg-emerald-400 mr-3"></span> Basic Identity
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                      <input required value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="e.g. Starter Plan" className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System ID</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="e.g. starter_plan" className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-gray-300 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly Cost (Points)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">PTS</span>
                        <input required type="number" min="0" value={formData.pricePoints} onChange={e => setFormData({...formData, pricePoints: e.target.value})} className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl pl-14 pr-4 py-2.5 text-white text-lg font-bold placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Resources */}
                <div>
                  <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-5 flex items-center">
                    <span className="w-6 h-[2px] bg-emerald-400 mr-3"></span> Resource Limits
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bandwidth Limit</label>
                      <div className="relative">
                        <input required type="number" min="1" value={formData.bandwidthGB} onChange={e => setFormData({...formData, bandwidthGB: e.target.value})} className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">GB</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Player Slots</label>
                       <div className="relative">
                        <input required type="number" min="0" value={formData.maxPlayers} onChange={e => setFormData({...formData, maxPlayers: e.target.value})} className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">Users</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dedicated Ports</label>
                      <input required type="number" min="1" value={formData.maxKeys} onChange={e => setFormData({...formData, maxKeys: e.target.value})} className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Nodes</label>
                      <input required type="number" min="1" value={formData.maxNodes} onChange={e => setFormData({...formData, maxNodes: e.target.value})} className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all" />
                    </div>
                  </div>
                </div>

                {/* 3. Extras */}
                <div>
                  <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-5 flex items-center">
                    <span className="w-6 h-[2px] bg-emerald-400 mr-3"></span> Extra Perks
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Feature Highlights (Comma separated)</label>
                    <textarea rows="2" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="DDoS Protection, Custom Domain, 24/7 Support" className="w-full bg-[#1a1d25] ring-1 ring-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-emerald-500/50 transition-all resize-none" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#1a1d25] ring-1 ring-white/5 rounded-2xl">
                  
                  {/* ACTIVE TOGGLE */}
                  <div 
                    className="flex-1 flex items-center justify-between cursor-pointer group"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  >
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Active Plan</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Allow users to purchase</div>
                    </div>
                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <div className="w-px bg-gray-700 hidden sm:block"></div>

                  {/* POPULAR TOGGLE */}
                  <div 
                    className="flex-1 flex items-center justify-between cursor-pointer group"
                    onClick={() => setFormData({...formData, isPopular: !formData.isPopular})}
                  >
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Popular Badge</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Highlight on pricing page</div>
                    </div>
                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.isPopular ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${formData.isPopular ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-[#0d0f14] flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                disabled={isProcessing} 
                className="px-5 py-2.5 rounded-xl ring-1 ring-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                form="plan-form"
                type="submit" 
                disabled={isProcessing} 
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold hover:brightness-110 shadow-lg transition-all disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Save Configuration"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

