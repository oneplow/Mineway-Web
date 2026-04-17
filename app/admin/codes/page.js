import { redirect } from "next/navigation";
import CodesClientPage from "@/components/admin/CodesClientPage";
import { prisma, auth } from "@/lib/auth";

export const metadata = {
  title: "Admin - Redemption Codes",
};

export default async function AdminCodesPage() {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/overview");
  }

  return <CodesClientPage />;
}
