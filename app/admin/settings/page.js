import { prisma } from "@/lib/auth";
import SettingClientPage from "@/components/admin/SettingClientPage";

export const metadata = {
  title: "Site Configuration | Admin",
};

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });

  return <SettingClientPage initialSettings={settings} />;
}
