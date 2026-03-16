import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const sql = getDb();
  const searches = await sql`
    SELECT * FROM saved_searches
    WHERE employer_account_id = ${session.employerAccountId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ searches });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { name, filters } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const sql = getDb();
  const rows = await sql`
    INSERT INTO saved_searches (employer_account_id, name, filters)
    VALUES (${session.employerAccountId}, ${name}, ${JSON.stringify(filters || {})})
    RETURNING *
  `;
  return NextResponse.json({ search: rows[0] });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await request.json();
  const sql = getDb();
  await sql`DELETE FROM saved_searches WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}`;
  return NextResponse.json({ success: true });
}
