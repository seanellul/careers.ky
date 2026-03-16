import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const sql = getDb();
  const alerts = await sql`
    SELECT * FROM match_alerts
    WHERE employer_account_id = ${session.employerAccountId} AND is_active = TRUE
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ alerts });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { filters, frequency = "daily" } = await request.json();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO match_alerts (employer_account_id, filters, frequency)
    VALUES (${session.employerAccountId}, ${JSON.stringify(filters || {})}, ${frequency})
    RETURNING *
  `;
  return NextResponse.json({ alert: rows[0] });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await request.json();
  const sql = getDb();
  await sql`DELETE FROM match_alerts WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}`;
  return NextResponse.json({ success: true });
}
