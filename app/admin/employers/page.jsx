import { getAdminEmployers } from "@/lib/data";
import AdminEmployersClient from "./AdminEmployersClient";

export const dynamic = "force-dynamic";

export default async function AdminEmployersPage() {
  const { employers, stats } = await getAdminEmployers();
  return <AdminEmployersClient employers={employers} stats={stats} />;
}
