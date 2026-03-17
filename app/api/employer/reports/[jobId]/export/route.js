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
    // Verify job belongs to this employer
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

    // Build CSV
    const headers = [
      "Candidate #", "Caymanian", "Education", "Experience", "Location",
      "Match Score", "Status", "Stage", "Date Contacted", "Date Responded",
    ];

    const rows = report.intros.map((intro, i) => [
      i + 1,
      intro.is_caymanian ? "Yes" : "No",
      intro.education_code || "",
      intro.experience_code || "",
      intro.location_code || "",
      intro.match_score != null ? Math.round(Number(intro.match_score)) : "",
      intro.status || "pending",
      intro.stage || "outreach",
      intro.created_at ? new Date(intro.created_at).toISOString().split("T")[0] : "",
      intro.responded_at ? new Date(intro.responded_at).toISOString().split("T")[0] : "",
    ]);

    const escapeCsv = (val) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="compliance-report-${jobId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
