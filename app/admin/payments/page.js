import { redirect } from "next/navigation";
import PaymentsClientPage from "@/components/admin/PaymentsClientPage";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Admin - Payment Review",
};

export default async function AdminPaymentsPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/overview");
  }

  return <PaymentsClientPage />;
}
