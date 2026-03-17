export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getEmployerPostings } from "@/lib/data";
import ReportsClient from "./ReportsClient";

export const metadata = {
  title: "Compliance Reports — careers.ky",
  description: "Track recruitment efforts per job posting for work permit compliance",
};

export default async function ReportsPage() {
  const session = await getSession();
  const sql = getDb();
  const employers = await sql`SELECT name FROM employers WHERE id = ${session.employerId}`;

  const postings = await getEmployerPostings(session.employerId);

  const introCounts = await sql`
    SELECT job_id,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'accepted' OR status = 'declined' OR responded_at IS NOT NULL) as responded,
           COUNT(*) FILTER (WHERE stage = 'hired') as hired
    FROM introductions
    WHERE employer_account_id = ${session.employerAccountId} AND job_id IS NOT NULL
    GROUP BY job_id
  `;

  const countMap = {};
  for (const row of introCounts) {
    countMap[row.job_id] = { total: Number(row.total), responded: Number(row.responded), hired: Number(row.hired) };
  }

  const postingsWithCounts = postings.map(p => ({
    ...p,
    introCount: countMap[p.cJobId]?.total || 0,
    respondedCount: countMap[p.cJobId]?.responded || 0,
    hiredCount: countMap[p.cJobId]?.hired || 0,
  }));

  return <ReportsClient postings={postingsWithCounts} employerName={employers[0]?.name} />;
}
