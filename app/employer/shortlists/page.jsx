export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import ShortlistsClient from "./ShortlistsClient";

export const metadata = {
  title: "Shortlists — careers.ky",
  description: "Manage your candidate shortlists",
};

export default async function ShortlistsPage() {
  const session = await getSession();
  if (!session?.employerAccountId) redirect("/");
  if (!session.employerId) redirect("/employer/setup");

  const sql = getDb();
  const shortlists = await sql`
    SELECT s.*, (SELECT COUNT(*) FROM shortlist_candidates sc WHERE sc.shortlist_id = s.id) as candidate_count
    FROM shortlists s WHERE s.employer_account_id = ${session.employerAccountId} ORDER BY s.created_at DESC
  `;

  return <ShortlistsClient shortlists={shortlists} />;
}
