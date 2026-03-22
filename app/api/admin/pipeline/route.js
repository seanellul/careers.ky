import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "../../../../lib/db.js";

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
    const limit = Math.min(parseInt(searchParams.get("limit")) || 50, 500);
    const offset = parseInt(searchParams.get("offset")) || 0;
    const sortBy = searchParams.get("sort_by") || "score";
    const sortOrder = searchParams.get("sort_order") || "DESC";

    // Whitelist sort parameters
    const validSortFields = [
      "score",
      "priority_rank",
      "last_contacted",
      "next_followup",
      "created_at",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "score";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Use tagged template literals with conditional fragments
    const records = await sql`
      SELECT * FROM sales_pipeline
      WHERE score BETWEEN ${scoreMin} AND ${scoreMax}
      ${segment ? sql`AND segment = ${segment}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ${search ? sql`AND employer_name ILIKE ${"%" + search + "%"}` : sql``}
      ORDER BY ${sql(sortField)} ${order === "ASC" ? sql`ASC` : sql`DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM sales_pipeline
      WHERE score BETWEEN ${scoreMin} AND ${scoreMax}
      ${segment ? sql`AND segment = ${segment}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ${search ? sql`AND employer_name ILIKE ${"%" + search + "%"}` : sql``}
    `;
    const total = countResult[0].total;

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Pipeline list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
