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
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE score >= 70) as hot_leads,
        COUNT(*) FILTER (WHERE score BETWEEN 50 AND 69) as warm_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE status = 'demo_scheduled') as demo_scheduled,
        COUNT(*) FILTER (WHERE status = 'trial_active') as trial_active,
        COUNT(*) FILTER (WHERE status = 'paying') as paying,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'not_contacted') as not_contacted,
        COUNT(*) as total,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        COUNT(DISTINCT segment) as segment_count,
        COUNT(DISTINCT industry) as industry_count
      FROM sales_pipeline
    `;

    const stats = result[0];

    const segmentBreakdown = await sql`
      SELECT segment, COUNT(*) as count, AVG(score) as avg_score
      FROM sales_pipeline
      GROUP BY segment
      ORDER BY count DESC
    `;

    const statusBreakdown = await sql`
      SELECT status, COUNT(*) as count
      FROM sales_pipeline
      GROUP BY status
      ORDER BY count DESC
    `;

    const topLeads = await sql`
      SELECT id, employer_name, score, segment, status, last_contacted
      FROM sales_pipeline
      ORDER BY score DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      stats,
      breakdown: {
        bySegment: segmentBreakdown,
        byStatus: statusBreakdown,
      },
      topLeads,
    });
  } catch (error) {
    console.error("Pipeline stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
