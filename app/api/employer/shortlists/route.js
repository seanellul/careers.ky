import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const sql = getDb();
  const shortlists = await sql`
    SELECT s.*,
      (SELECT COUNT(*) FROM shortlist_candidates sc WHERE sc.shortlist_id = s.id) as candidate_count
    FROM shortlists s
    WHERE s.employer_account_id = ${session.employerAccountId}
    ORDER BY s.created_at DESC
  `;
  return NextResponse.json({ shortlists });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { name, jobId } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const sql = getDb();
  const rows = await sql`
    INSERT INTO shortlists (employer_account_id, name, job_id)
    VALUES (${session.employerAccountId}, ${name}, ${jobId || null})
    RETURNING *
  `;
  return NextResponse.json({ shortlist: rows[0] });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await request.json();
  const sql = getDb();
  await sql`DELETE FROM shortlists WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}`;
  return NextResponse.json({ success: true });
}
