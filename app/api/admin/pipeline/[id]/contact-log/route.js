import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "../../../../../../lib/db.js";

export async function POST(req, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { id } = params;
    const body = await req.json();

    const { activity_type, notes } = body;

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
      return NextResponse.json(
        { error: `Invalid activity_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Derive created_by from session instead of trusting client
    const createdBy = session.candidateEmail || session.employerEmail || "admin";

    const result = await sql`
      INSERT INTO contact_log (employer_id, activity_type, notes, created_by)
      VALUES (${id}, ${activity_type}, ${notes || null}, ${createdBy})
      RETURNING *
    `;

    // Update last_contacted timestamp
    await sql`
      UPDATE sales_pipeline SET last_contacted = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Contact log error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
