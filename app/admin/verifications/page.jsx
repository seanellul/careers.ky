import { getVerificationRequests } from "@/lib/data";
import AdminVerificationsClient from "./AdminVerificationsClient";

export const metadata = { title: "Verification Queue — Admin" };

export default async function AdminVerificationsPage() {
  const requests = await getVerificationRequests();
  return <AdminVerificationsClient initialRequests={requests} />;
}
