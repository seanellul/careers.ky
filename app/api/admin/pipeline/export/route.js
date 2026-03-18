import { getDb } from "../../../../../lib/db.js";

export async function GET(req) {
  const sql = getDb();

  try {
    const { searchParams } = new URL(req.url);

    // Parse filters (same as list endpoint)
    const scoreMin = parseInt(searchParams.get("score_min")) || 0;
    const scoreMax = parseInt(searchParams.get("score_max")) || 100;
    const segment = searchParams.get("segment");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    let query = "SELECT * FROM sales_pipeline WHERE score BETWEEN $1 AND $2";
    const params = [scoreMin, scoreMax];
    let paramCount = 2;

    if (segment) {
      paramCount++;
      query += ` AND segment = $${paramCount}`;
      params.push(segment);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND employer_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    query += " ORDER BY score DESC";

    // Get records
    const records = await sql(query, params);

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
        // Escape quotes in values
        const strValue = String(value).replace(/"/g, '""');
        // Quote if contains comma, quote, or newline
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

    // Return as downloadable file
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
