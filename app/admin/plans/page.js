import { prisma } from "@/lib/auth";
import PlanClientTable from "@/components/admin/PlanClientTable";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { pricePoints: "asc" },
    include: {
      _count: {
        select: { users: true }
      }
    }
  });

  return <PlanClientTable initialPlans={plans} />;
}
