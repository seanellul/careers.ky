import { getAdminStats } from "@/lib/data";
import AdminOverviewClient from "./AdminOverviewClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getAdminStats();
  return <AdminOverviewClient stats={stats} />;
}
