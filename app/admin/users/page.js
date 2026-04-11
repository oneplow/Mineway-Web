import { prisma } from "@/lib/auth";
import UserClientTable from "@/components/admin/UserClientTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { apiKeys: true }
      }
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            User Management
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">View, manage, and control all registered accounts.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 px-4 py-2 rounded-xl">
          <span className="text-sm font-bold text-gray-300">{users.length}</span>
          <span className="text-sm text-gray-500">total users</span>
        </div>
      </div>

      <UserClientTable initialUsers={users} />
    </div>
  );
}

