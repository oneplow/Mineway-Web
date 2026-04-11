import { prisma } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Activity, ArrowUpRight, ArrowDownRight, KeyRound, Wifi, WifiOff } from "lucide-react";
import TunnelClientTable from "@/components/admin/TunnelClientTable";

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

      {/* Client Table Component */}
      <TunnelClientTable initialTunnels={tunnels} />
    </div>
  );
}
