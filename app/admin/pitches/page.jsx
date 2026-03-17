import { getAdminPitchList } from "@/lib/data";
import AdminPitchesClient from "./AdminPitchesClient";

export const dynamic = "force-dynamic";

export default async function AdminPitchesPage() {
  const { employers, total } = await getAdminPitchList();
  return <AdminPitchesClient initialEmployers={employers} initialTotal={total} />;
}
