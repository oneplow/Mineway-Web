import { auth, prisma } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Server } from "lucide-react";
import NodeClientTable from "@/components/admin/NodeClientTable";

export const metadata = {
  title: "Node Management · Admin",
};

export default async function AdminNodesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const nodesInfo = await prisma.node.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { domains: true } } },
  });

  const totalDomains = nodesInfo.reduce((sum, n) => sum + n._count.domains, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Physical Nodes
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Manage server instances and their secure authentication tokens</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
            <Server className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-400">{nodesInfo.length} Nodes</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 ring-1 ring-white/5 px-4 py-2 rounded-xl">
            <span className="text-sm font-bold text-gray-400">{totalDomains} Domains Linked</span>
          </div>
        </div>
      </div>

      <NodeClientTable initialNodes={nodesInfo} />
      
    </div>
  );
}
