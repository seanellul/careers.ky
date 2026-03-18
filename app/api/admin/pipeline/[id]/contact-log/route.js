import { getDb } from "../../../../../../lib/db.js";

export async function POST(req, { params }) {
  const sql = getDb();

  try {
    const { id } = params;
    const body = await req.json();

    const { activity_type, notes, created_by } = body;

    // Validate activity type
    const validTypes = [
      "email_sent",
      "call_made",
      "response_received",
      "demo_scheduled",
      "meeting_completed",
      "trial_started",
      "payment_received",
      "note_added",
    ];

    if (!validTypes.includes(activity_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid activity_type. Must be one of: ${validTypes.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert contact log entry
    const result = await sql(
      `
      INSERT INTO contact_log (employer_id, activity_type, notes, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [id, activity_type, notes || null, created_by || "admin"]
    );

    // Update last_contacted timestamp
    await sql("UPDATE sales_pipeline SET last_contacted = NOW() WHERE id = $1", [
      id,
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: result[0],
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contact log error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
