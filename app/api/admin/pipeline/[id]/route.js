import { getDb } from "../../../../../lib/db.js";

export async function GET(req, { params }) {
  const sql = getDb();

  try {
    const { id } = params;

    // Get employer record
    const employer = await sql("SELECT * FROM sales_pipeline WHERE id = $1", [
      id,
    ]);

    if (employer.length === 0) {
      return new Response(JSON.stringify({ error: "Employer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get last 10 contact log entries
    const contactLog = await sql(
      `
      SELECT * FROM contact_log 
      WHERE employer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `,
      [id]
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          employer: employer[0],
          contactLog: contactLog,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pipeline detail error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req, { params }) {
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

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }

    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramCount}`);
      values.push(contact_person);
      paramCount++;
    }

    if (contact_email !== undefined) {
      updates.push(`contact_email = $${paramCount}`);
      values.push(contact_email);
      paramCount++;
    }

    if (contact_phone !== undefined) {
      updates.push(`contact_phone = $${paramCount}`);
      values.push(contact_phone);
      paramCount++;
    }

    if (next_followup !== undefined) {
      updates.push(`next_followup = $${paramCount}`);
      values.push(next_followup);
      paramCount++;
    }

    if (response_received !== undefined) {
      updates.push(`response_received = $${paramCount}`);
      values.push(response_received);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at
      return new Response(
        JSON.stringify({ success: true, message: "No changes requested" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updateQuery = `
      UPDATE sales_pipeline 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await sql(updateQuery, values);

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Employer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the update activity if status changed
    if (status !== undefined) {
      await sql(
        `
        INSERT INTO contact_log (employer_id, activity_type, notes)
        VALUES ($1, $2, $3)
      `,
        [
          id,
          "note_added",
          `Status updated to: ${status}${notes ? ` (${notes})` : ""}`,
        ]
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pipeline update error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
