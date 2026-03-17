import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const VALID_STAGES = ["outreach", "responded", "interviewing", "offered", "hired", "rejected", "archived"];

const VALID_REJECTION_REASONS = [
  "position_filled", "qualifications_mismatch", "salary_mismatch",
  "candidate_unresponsive", "candidate_withdrew", "insufficient_experience",
  "location_mismatch", "other",
];

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await params;
  const { stage, notes, rejectionReason, rejectionNotes } = await request.json();

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  // Require rejection reason for rejected/archived stages
  if ((stage === "rejected" || stage === "archived") && rejectionReason) {
    if (!VALID_REJECTION_REASONS.includes(rejectionReason)) {
      return NextResponse.json({ error: "Invalid rejection reason" }, { status: 400 });
    }
  }

  if (stage === "rejected" && !rejectionReason) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const intro = await sql`
    SELECT * FROM introductions WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  if (!intro.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (stage === "rejected" || (stage === "archived" && rejectionReason)) {
    await sql`
      UPDATE introductions
      SET stage = ${stage},
          employer_notes = COALESCE(${notes || null}, employer_notes),
          rejection_reason = ${rejectionReason},
          rejection_notes = ${rejectionNotes || null}
      WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
    `;
  } else {
    await sql`
      UPDATE introductions
      SET stage = ${stage}, employer_notes = COALESCE(${notes || null}, employer_notes)
      WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
    `;
  }

  // Log activity
  const details = { from: intro[0].stage, to: stage };
  if (rejectionReason) details.rejectionReason = rejectionReason;

  await sql`
    INSERT INTO activity_log (employer_account_id, action, details, candidate_id, introduction_id, job_id)
    VALUES (${session.employerAccountId}, 'stage_changed',
      ${JSON.stringify(details)},
      ${intro[0].candidate_id}, ${id}, ${intro[0].job_id || null})
  `;

  return NextResponse.json({ success: true });
}
