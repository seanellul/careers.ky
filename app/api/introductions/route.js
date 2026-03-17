import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createIntroduction, createNotification, respondToIntroduction, getIntroductionsForCandidate, getIntroductionsForEmployer, getIntroductionById } from "@/lib/data";

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sql = getDb();

    // Support bulk introductions
    const candidateIds = body.candidateIds || (body.candidateId ? [body.candidateId] : []);
    const message = body.message;

    if (candidateIds.length === 0) {
      return NextResponse.json({ error: "No candidates specified" }, { status: 400 });
    }

    const { jobId, matchScore, matchBreakdown } = body;

    const results = [];
    for (const candidateId of candidateIds) {
      const intro = await createIntroduction(
        session.employerAccountId, candidateId, message,
        jobId || null, matchScore != null ? matchScore : null, matchBreakdown || null
      );
      if (intro) {
        await createNotification(
          "candidate", candidateId,
          "New Introduction Request",
          `An employer wants to connect with you${message ? `: "${message}"` : "."}`,
          "/introductions"
        );

        // Log activity
        await sql`
          INSERT INTO activity_log (employer_account_id, action, details, candidate_id, introduction_id, job_id)
          VALUES (${session.employerAccountId}, 'intro_sent', ${JSON.stringify({ message: !!message })}, ${candidateId}, ${intro.id}, ${jobId || null})
        `;

        results.push(intro);
      }
    }

    return NextResponse.json({ success: true, introductions: results });
  } catch (error) {
    console.error("Introduction error:", error);
    return NextResponse.json({ error: "Failed to create introduction" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Candidate access required" }, { status: 401 });
  }

  try {
    const { introductionId, accept } = await request.json();
    await respondToIntroduction(introductionId, session.candidateId, accept);

    // Update pipeline stage automatically
    const sql = getDb();
    if (accept) {
      await sql`UPDATE introductions SET stage = 'responded' WHERE id = ${introductionId} AND stage = 'outreach'`;
    }

    // Notify the employer about the candidate's response
    try {
      const intro = await getIntroductionById(introductionId);
      if (intro) {
        const status = accept ? "accepted" : "declined";
        await createNotification(
          "employer_account", intro.employer_account_id,
          `Introduction ${status}`,
          `A candidate has ${status} your introduction request.`,
          "/employer/dashboard"
        );

        // Log activity
        await sql`
          INSERT INTO activity_log (employer_account_id, action, details, candidate_id, introduction_id)
          VALUES (${intro.employer_account_id}, ${accept ? 'intro_accepted' : 'intro_declined'}, '{}', ${session.candidateId}, ${introductionId})
        `;
      }
    } catch (notifyErr) {
      console.error("Employer notification error (non-fatal):", notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Introduction response error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();

  if (session?.employerAccountId) {
    try {
      const introductions = await getIntroductionsForEmployer(session.employerAccountId);
      return NextResponse.json({ introductions });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch introductions" }, { status: 500 });
    }
  }

  if (session?.candidateId) {
    try {
      const introductions = await getIntroductionsForCandidate(session.candidateId);
      return NextResponse.json({ introductions });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch introductions" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
