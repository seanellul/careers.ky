import { getDb } from "../../../../lib/db.js";

// Simple auth check (can be enhanced with API keys later)
function checkAuth(req) {
  // For now, accept all requests if running locally or with auth header
  const authHeader = req.headers.get("authorization");
  // In production, verify API key or session
  return true; // TODO: implement proper auth
}

export async function GET(req) {
  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sql = getDb();

  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const scoreMin = parseInt(searchParams.get("score_min")) || 0;
    const scoreMax = parseInt(searchParams.get("score_max")) || 100;
    const segment = searchParams.get("segment");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit")) || 50, 500);
    const offset = parseInt(searchParams.get("offset")) || 0;
    const sortBy = searchParams.get("sort_by") || "score";
    const sortOrder = searchParams.get("sort_order") || "DESC";

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

    // Add sorting
    const validSortFields = [
      "score",
      "priority_rank",
      "last_contacted",
      "next_followup",
      "created_at",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "score";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortField} ${order}`;

    // Add pagination
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    // Execute query
    const records = await sql(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM sales_pipeline WHERE score BETWEEN $1 AND $2";
    const countParams = [scoreMin, scoreMax];
    let countParamCount = 2;

    if (segment) {
      countParamCount++;
      countQuery += ` AND segment = $${countParamCount}`;
      countParams.push(segment);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND employer_name ILIKE $${countParamCount}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await sql(countQuery, countParams);
    const total = countResult[0].total;

    return new Response(
      JSON.stringify({
        success: true,
        data: records,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pipeline list error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
