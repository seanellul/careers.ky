import { getAdminInterests } from "@/lib/data";
import AdminInterestsClient from "./AdminInterestsClient";

export const dynamic = "force-dynamic";

export default async function AdminInterestsPage() {
  const interests = await getAdminInterests();
  return <AdminInterestsClient interests={interests} />;
}
