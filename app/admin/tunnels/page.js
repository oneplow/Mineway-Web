import { prisma } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Activity, ArrowUpRight, ArrowDownRight, KeyRound, Wifi, WifiOff } from "lucide-react";

export default async function AdminTunnelsPage() {
  const tunnels = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true, email: true }
      }
    }
  });

  const activeCount = tunnels.filter(t => t.status === "active").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Tunnels Control
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Monitor all active and inactive tunnels across the network.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-900 px-4 py-2 rounded-xl">
            <Wifi className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 ring-1 ring-white/5 px-4 py-2 rounded-xl">
            <span className="text-sm font-bold text-gray-400">{tunnels.length} Total</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
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
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gray-800 text-gray-500">
                          <WifiOff className="w-3 h-3" />
                          Inactive
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
                    <td className="px-7 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800 focus:outline-none">
                        <MoreVertical className="h-5 w-5" />
                      </button>
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
    </div>
  );
}
