import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "../../../../../lib/db.js";

export async function GET(req) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { searchParams } = new URL(req.url);

    const scoreMin = parseInt(searchParams.get("score_min")) || 0;
    const scoreMax = parseInt(searchParams.get("score_max")) || 100;
    const segment = searchParams.get("segment");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const records = await sql`
      SELECT * FROM sales_pipeline
      WHERE score BETWEEN ${scoreMin} AND ${scoreMax}
      ${segment ? sql`AND segment = ${segment}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ${search ? sql`AND employer_name ILIKE ${"%" + search + "%"}` : sql``}
      ORDER BY score DESC
    `;

    // Generate CSV
    const headers = [
      "id",
      "employer_name",
      "slug",
      "priority_rank",
      "score",
      "segment",
      "industry",
      "total_jobs",
      "active_jobs",
      "avg_salary",
      "recommended_tier",
      "suggested_hook",
      "status",
      "last_contacted",
      "next_followup",
      "contact_person",
      "contact_email",
      "contact_phone",
      "notes",
      "response_received",
    ];

    const csvRows = [headers.join(",")];

    for (const record of records) {
      const row = headers.map((header) => {
        const value = record[header];
        if (value === null || value === undefined) {
          return "";
        }
        const strValue = String(value).replace(/"/g, '""');
        if (
          strValue.includes(",") ||
          strValue.includes('"') ||
          strValue.includes("\n")
        ) {
          return `"${strValue}"`;
        }
        return strValue;
      });
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `pipeline-export-${timestamp}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Pipeline export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
