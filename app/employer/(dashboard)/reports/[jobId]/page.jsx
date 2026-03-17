export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getComplianceReportData } from "@/lib/data";
import { getDb } from "@/lib/db";
import ComplianceReportClient from "./ComplianceReportClient";

export const metadata = {
  title: "Compliance Report — careers.ky",
  description: "Detailed compliance report for a job posting",
};

export default async function ComplianceReportPage({ params }) {
  const session = await getSession();
  const { jobId } = await params;

  const sql = getDb();
  const employers = await sql`SELECT name FROM employers WHERE id = ${session.employerId}`;
  if (!employers.length) redirect("/employer/setup");

  // Verify ownership
  const jobs = await sql`
    SELECT job_id FROM job_postings
    WHERE job_id = ${jobId} AND LOWER(TRIM(employer)) = LOWER(${employers[0].name})
  `;
  if (!jobs.length) redirect("/employer/reports");

  const report = await getComplianceReportData(session.employerAccountId, jobId);
  if (!report) redirect("/employer/reports");

  return (
    <ComplianceReportClient
      report={report}
      employerName={employers[0].name}
      jobId={jobId}
    />
  );
}
