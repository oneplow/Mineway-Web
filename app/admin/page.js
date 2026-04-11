import { prisma } from "@/lib/auth";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { Users, KeyRound, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default async function AdminDashboard() {
  // Parallel fetch stats
  const [userCount, keyCount, totalPointsObj, keys] = await Promise.all([
    prisma.user.count(),
    prisma.apiKey.count(),
    prisma.user.aggregate({ _sum: { points: true } }),
    prisma.apiKey.findMany({ 
      where: { status: "active" },
      select: { name: true, rxBytes: true, txBytes: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 7
    })
  ]);

  const totalPoints = totalPointsObj._sum.points || 0;

  // Format data for Recharts (Using the last 7 active keys as network segments for demonstration)
  const chartData = keys.map((k) => ({
    name: k.name || "Unnamed",
    rx: Number(k.rxBytes), // BigInt to Number
    tx: Number(k.txBytes)
  })).reverse(); // Oldest to newest for area chart

  // Sum total bandwidth across all
  const sumRx = keys.reduce((acc, k) => acc + Number(k.rxBytes), 0) / 1024 / 1024 / 1024;
  const sumTx = keys.reduce((acc, k) => acc + Number(k.txBytes), 0) / 1024 / 1024 / 1024;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            System Overview
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Real-time metrics and global platform performance.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">All Systems Operational</span>
        </div>
      </div>

      {/* Stats container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Total Users Stat */}
        <div className="group bg-[#0a0c10]/90 backdrop-blur-xl border border-gray-800 rounded-[24px] p-7 shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-1">Registered Users</p>
              <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {userCount.toLocaleString()}
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-900 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-[11px] font-bold text-blue-400 tracking-wide">
            <span>Platform Members</span>
          </div>
        </div>

        {/* Active Tunnels Stat */}
        <div className="group bg-[#0a0c10]/90 backdrop-blur-xl border border-gray-800 rounded-[24px] p-7 shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-1">Active Tunnels</p>
              <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                {keyCount.toLocaleString()}
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-900 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform">
              <KeyRound className="h-6 w-6 text-amber-400 transform -rotate-45" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-[11px] font-bold text-amber-400 tracking-wide">
             <span>Live Connections</span>
          </div>
        </div>

        {/* Economy Stat */}
        <div className="group bg-[#0a0c10]/90 backdrop-blur-xl border border-gray-800 rounded-[24px] p-7 shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all"></div>
           <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-1">Points Economy</p>
              <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                {totalPoints.toLocaleString()} <span className="text-lg text-emerald-600/50">PTS</span>
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-900 flex items-center justify-center shadow-[0_0_20px_rgba(16,217,126,0.15)] group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-[11px] font-bold text-emerald-400 tracking-wide">
             <span>Circulating Supply</span>
          </div>
        </div>
      </div>

      {/* Network Traffic Visualizer */}
      <div className="bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-white/5 rounded-[24px] p-8 shadow-xl mt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5">
          <div>
            <h3 className="text-xl font-extrabold text-white">Network Matrix</h3>
            <p className="text-[13px] text-gray-400 mt-1 font-medium">Aggregated bandwidth consumption from active tunnels.</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0 bg-gray-900/50 p-2 rounded-2xl ring-1 ring-white/5">
            <div className="flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-xl">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg"><ArrowDownRight className="h-4 w-4 text-emerald-400" /></div>
              <div>
                 <div className="text-[10px] font-black text-gray-500 uppercase">Total Ingress</div>
                 <div className="text-sm font-bold text-emerald-400">{sumRx.toFixed(2)} GB</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-xl">
              <div className="p-1.5 bg-blue-500/20 rounded-lg"><ArrowUpRight className="h-4 w-4 text-blue-400" /></div>
              <div>
                 <div className="text-[10px] font-black text-gray-500 uppercase">Total Egress</div>
                 <div className="text-sm font-bold text-blue-400">{sumTx.toFixed(2)} GB</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#050505] rounded-[20px] p-4 ring-1 ring-white/5">
           <DashboardCharts data={chartData} />
        </div>
      </div>
    </div>
  );
}
