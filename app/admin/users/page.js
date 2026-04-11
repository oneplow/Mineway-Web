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
          <h2 className="text-3xl font-black text-white tracking-tight">User Management</h2>
          <p className="text-[13px] font-medium text-gray-400 mt-1">View, manage, and control all registered accounts.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/50 ring-1 ring-white/5 px-4 py-2 rounded-xl">
          <span className="text-sm font-bold text-gray-400">{users.length} Total Users</span>
        </div>
      </div>

      <UserClientTable initialUsers={users} />
    </div>
  );
}

