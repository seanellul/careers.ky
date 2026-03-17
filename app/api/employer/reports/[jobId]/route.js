import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getComplianceReportData } from "@/lib/data";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    // Verify job belongs to this employer (name match)
    const sql = getDb();
    const employers = await sql`SELECT name FROM employers WHERE id = ${session.employerId}`;
    if (!employers.length) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    const jobs = await sql`
      SELECT job_id FROM job_postings
      WHERE job_id = ${jobId} AND LOWER(TRIM(employer)) = LOWER(${employers[0].name})
    `;
    if (!jobs.length) {
      return NextResponse.json({ error: "Job not found or not yours" }, { status: 404 });
    }

    const report = await getComplianceReportData(session.employerAccountId, jobId);
    if (!report) {
      return NextResponse.json({ error: "Report data not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
