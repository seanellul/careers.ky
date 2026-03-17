import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const VALID_STAGES = ["outreach", "responded", "interviewing", "offered", "hired", "archived"];

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await params;
  const { stage, notes } = await request.json();

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const intro = await sql`
    SELECT * FROM introductions WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  if (!intro.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await sql`
    UPDATE introductions
    SET stage = ${stage}, employer_notes = COALESCE(${notes || null}, employer_notes)
    WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;

  // Log activity
  await sql`
    INSERT INTO activity_log (employer_account_id, action, details, candidate_id, introduction_id, job_id)
    VALUES (${session.employerAccountId}, 'stage_changed',
      ${JSON.stringify({ from: intro[0].stage, to: stage })},
      ${intro[0].candidate_id}, ${id}, ${intro[0].job_id || null})
  `;

  return NextResponse.json({ success: true });
}
