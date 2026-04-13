import { prisma } from "@/lib/auth";
import { Globe } from "lucide-react";
import DomainClientTable from "@/components/admin/DomainClientTable";

export default async function AdminDomainsPage() {
  const domains = await prisma.domain.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { apiKeys: true } } },
  });

  const totalTunnels = domains.reduce((sum, d) => sum + d._count.apiKeys, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Domains Management
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">จัดการโดเมนทั้งหมดที่ใช้เชื่อมต่อ Tunnel Subdomain</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-900 px-4 py-2 rounded-xl">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">{domains.length} Domains</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 ring-1 ring-white/5 px-4 py-2 rounded-xl">
            <span className="text-sm font-bold text-gray-400">{totalTunnels} Tunnels</span>
          </div>
        </div>
      </div>

      {/* Client Table Component */}
      <DomainClientTable initialDomains={domains} />
    </div>
  );
}
