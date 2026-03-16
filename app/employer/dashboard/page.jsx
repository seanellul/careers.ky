export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployerDashboardStats, getIntroductionsForEmployer } from "@/lib/data";
import { getDb } from "@/lib/db";
import EmployerDashboardClient from "./EmployerDashboardClient";

export const metadata = {
  title: "Employer Dashboard — careers.ky",
  description: "Manage your employer account on careers.ky",
};

export default async function EmployerDashboardPage() {
  const session = await getSession();
  if (!session?.employerAccountId) redirect("/");
  if (!session.employerId) redirect("/employer/setup");

  const sql = getDb();

  // Get employer record
  const employers = await sql`SELECT * FROM employers WHERE id = ${session.employerId}`;
  const employer = employers[0];
  if (!employer) redirect("/employer/setup");

  const [stats, introductions, shortlists, savedSearches] = await Promise.all([
    getEmployerDashboardStats(session.employerAccountId),
    getIntroductionsForEmployer(session.employerAccountId),
    sql`
      SELECT s.*, (SELECT COUNT(*) FROM shortlist_candidates sc WHERE sc.shortlist_id = s.id) as candidate_count
      FROM shortlists s WHERE s.employer_account_id = ${session.employerAccountId} ORDER BY s.created_at DESC
    `,
    sql`SELECT * FROM saved_searches WHERE employer_account_id = ${session.employerAccountId} ORDER BY created_at DESC`,
  ]);

  return (
    <EmployerDashboardClient
      employer={employer}
      stats={stats}
      introductions={introductions}
      employerName={session.employerName}
      shortlists={shortlists}
      savedSearches={savedSearches}
    />
  );
}
