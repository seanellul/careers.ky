import { getAdminOutreachList } from "@/lib/data";
import AdminOutreachClient from "./AdminOutreachClient";

export const dynamic = "force-dynamic";

export default async function AdminOutreachPage() {
  const employers = await getAdminOutreachList();
  return <AdminOutreachClient initialEmployers={employers} />;
}
