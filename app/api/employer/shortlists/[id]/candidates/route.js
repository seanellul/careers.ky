import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await params;
  const sql = getDb();

  // Verify ownership
  const shortlist = await sql`
    SELECT * FROM shortlists WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  if (!shortlist.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const candidates = await sql`
    SELECT sc.*, c.education_code, c.experience_code, c.location_code,
           c.availability, c.is_caymanian, c.bio
    FROM shortlist_candidates sc
    JOIN candidates c ON sc.candidate_id = c.id
    WHERE sc.shortlist_id = ${id}
    ORDER BY sc.added_at DESC
  `;

  // Enrich with interests and skills
  const enriched = [];
  for (const row of candidates) {
    const interests = await sql`
      SELECT ci.cisco_code, cu.title
      FROM candidate_interests ci
      LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
      WHERE ci.candidate_id = ${row.candidate_id}
    `;
    const skills = await sql`
      SELECT s.id, s.name, s.category
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ${row.candidate_id}
    `;
    enriched.push({ ...row, interests, skills });
  }

  return NextResponse.json({ shortlist: shortlist[0], candidates: enriched });
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await params;
  const { candidateId, notes } = await request.json();
  const sql = getDb();

  // Verify ownership
  const shortlist = await sql`
    SELECT id FROM shortlists WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  if (!shortlist.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await sql`
    INSERT INTO shortlist_candidates (shortlist_id, candidate_id, notes)
    VALUES (${id}, ${candidateId}, ${notes || null})
    ON CONFLICT (shortlist_id, candidate_id) DO NOTHING
    RETURNING *
  `;

  // Log activity
  await sql`
    INSERT INTO activity_log (employer_account_id, action, details, candidate_id)
    VALUES (${session.employerAccountId}, 'candidate_shortlisted', ${JSON.stringify({ shortlist_id: Number(id) })}, ${candidateId})
  `;

  return NextResponse.json({ success: true, entry: rows[0] || null });
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await params;
  const { candidateId } = await request.json();
  const sql = getDb();

  await sql`
    DELETE FROM shortlist_candidates
    WHERE shortlist_id = ${id} AND candidate_id = ${candidateId}
    AND shortlist_id IN (SELECT id FROM shortlists WHERE employer_account_id = ${session.employerAccountId})
  `;

  return NextResponse.json({ success: true });
}
