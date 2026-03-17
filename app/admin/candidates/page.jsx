import { getAdminCandidates } from "@/lib/data";
import AdminCandidatesClient from "./AdminCandidatesClient";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  const { candidates, stats } = await getAdminCandidates();
  return <AdminCandidatesClient candidates={candidates} stats={stats} />;
}
