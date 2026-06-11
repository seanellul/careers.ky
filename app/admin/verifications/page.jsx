import { getVerificationRequests } from "@/lib/data";
import { getPendingCandidateDocuments } from "@/lib/documents";
import AdminVerificationsClient from "./AdminVerificationsClient";

export const metadata = { title: "Verification Queue — Admin" };

// Session-gated admin data — never execute the DB fetch at build time
export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const [requests, candidateDocuments] = await Promise.all([
    getVerificationRequests(),
    getPendingCandidateDocuments(),
  ]);
  return (
    <AdminVerificationsClient
      initialRequests={requests}
      initialCandidateDocuments={candidateDocuments}
    />
  );
}
