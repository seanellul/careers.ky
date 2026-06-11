import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createNotification } from "@/lib/data";

const VALID_STAGES = [
  "outreach",
  "responded",
  "shortlisted",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "archived",
];

// Candidate-facing copy per stage change (MVP #11: notify at each stage).
// Archived is an employer-side housekeeping state — no notification.
const STAGE_NOTIFICATIONS = {
  shortlisted: {
    title: "You've been shortlisted",
    body: (employer) => `${employer} has shortlisted you for the next step.`,
  },
  interviewing: {
    title: "Interview stage",
    body: (employer) => `${employer} has moved your introduction to the interview stage.`,
  },
  offered: {
    title: "You have an offer",
    body: (employer) =>
      `${employer} has extended an offer. Review your package carefully — our salary negotiation guide can help.`,
  },
  hired: {
    title: "Congratulations on the new role!",
    body: (employer) => `${employer} has marked you as hired. We wish you every success.`,
  },
  rejected: {
    title: "An introduction has closed",
    body: (employer) =>
      `${employer} has decided not to move forward this time. Your profile stays visible to other employers.`,
  },
};

const VALID_REJECTION_REASONS = [
  "position_filled",
  "qualifications_mismatch",
  "salary_mismatch",
  "candidate_unresponsive",
  "candidate_withdrew",
  "insufficient_experience",
  "location_mismatch",
  "other",
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

  // Notify the candidate (in-app always; email when configured)
  const notification = stage !== intro[0].stage ? STAGE_NOTIFICATIONS[stage] : null;
  if (notification) {
    try {
      const employerRows = await sql`
        SELECT COALESCE(e.name, ea.name, 'An employer') as employer_name, c.email as candidate_email
        FROM introductions i
        JOIN employer_accounts ea ON i.employer_account_id = ea.id
        LEFT JOIN employers e ON ea.employer_id = e.id
        JOIN candidates c ON i.candidate_id = c.id
        WHERE i.id = ${id}
      `;
      const employerName = employerRows[0]?.employer_name || "An employer";
      const body = notification.body(employerName);

      await createNotification(
        "candidate",
        intro[0].candidate_id,
        notification.title,
        body,
        "/dashboard/introductions"
      );

      if (process.env.RESEND_API_KEY && employerRows[0]?.candidate_email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
          to: employerRows[0].candidate_email,
          subject: `${notification.title} — careers.ky`,
          html: `<p>${body}</p><p><a href="${baseUrl}/dashboard/introductions">View your introductions</a></p>`,
        });
      }
    } catch (notifyErr) {
      console.error("Stage notification error (non-fatal):", notifyErr.message);
    }
  }

  return NextResponse.json({ success: true });
}
