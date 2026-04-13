"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Clock } from "lucide-react";
import { format } from "date-fns";

export default function TunnelAnalyticsChart({ tunnelId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("24h"); // "24h" or "7d"

  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/keys/${tunnelId}/analytics?range=${range}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        
        // Transform BigInt strings to Number MBs
        const transformed = json.logs.map(log => ({
          time: new Date(log.time),
          rx: Number(log.rx) / 1024 / 1024,
          tx: Number(log.tx) / 1024 / 1024,
        }));
        
        if (mounted) setData(transformed);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => { mounted = false; };
  }, [tunnelId, range]);

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse text-sm font-medium">Loading analytics data...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-sm font-medium space-y-2 relative border border-white/5 bg-[#161a22] rounded-2xl overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <Activity size={24} className="text-gray-700 opacity-50" />
         <span className="relative z-10">ไม่พบการใช้งานในระบบ (รอเก็บข้อมูล 1 ชั่วโมง)</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0c10]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">{format(label, "dd MMM yyyy, HH:mm")}</p>
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-emerald-400">Download: <span className="font-mono">{payload[0].value.toFixed(2)} MB</span></p>
            <p className="text-[13px] font-bold text-cyan-400">Upload: <span className="font-mono">{payload[1].value.toFixed(2)} MB</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-bold text-gray-300 flex items-center gap-2"><Activity size={16} className="text-emerald-400"/> Network Usage</h4>
        <div className="bg-gray-900 border border-white/5 rounded-lg p-1 flex shadow-inner">
           <button onClick={() => setRange("24h")} className={`text-[11px] font-bold px-3 py-1 rounded-md transition-all ${range === "24h" ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>24 Hours</button>
           <button onClick={() => setRange("7d")} className={`text-[11px] font-bold px-3 py-1 rounded-md transition-all ${range === "7d" ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>7 Days</button>
        </div>
      </div>
      <div className="h-56 w-full p-4 bg-[#161a22] border border-white/5 rounded-2xl shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#12141a]/50 pointer-events-none"></div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" tickFormatter={(t) => format(t, range === "24h" ? "HH:mm" : "dd MMM")} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis tickFormatter={(v) => `${v.toFixed(0)}`} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="rx" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" activeDot={{ r: 4, fill: '#10b981', stroke: '#121620', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="tx" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" activeDot={{ r: 4, fill: '#06b6d4', stroke: '#121620', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
