import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "../../../../../lib/db.js";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { id } = params;

    const employer = await sql`
      SELECT * FROM sales_pipeline WHERE id = ${id}
    `;

    if (employer.length === 0) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    const contactLog = await sql`
      SELECT * FROM contact_log
      WHERE employer_id = ${id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      data: {
        employer: employer[0],
        contactLog,
      },
    });
  } catch (error) {
    console.error("Pipeline detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const { id } = params;
    const body = await req.json();

    const {
      status,
      notes,
      contact_person,
      contact_email,
      contact_phone,
      next_followup,
      response_received,
    } = body;

    // Build dynamic update object — only include provided fields
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (contact_person !== undefined) updates.contact_person = contact_person;
    if (contact_email !== undefined) updates.contact_email = contact_email;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone;
    if (next_followup !== undefined) updates.next_followup = next_followup;
    if (response_received !== undefined) updates.response_received = response_received;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "No changes requested" });
    }

    updates.updated_at = sql`NOW()`;

    const result = await sql`
      UPDATE sales_pipeline
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    // Log the update activity if status changed
    if (status !== undefined) {
      await sql`
        INSERT INTO contact_log (employer_id, activity_type, notes)
        VALUES (${id}, ${"note_added"}, ${`Status updated to: ${status}${notes ? ` (${notes})` : ""}`})
      `;
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Pipeline update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
