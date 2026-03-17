import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getIntroductionById, getIntroductionMessages, createIntroductionMessage, createNotification } from "@/lib/data";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session?.candidateId && !session?.employerAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const intro = await getIntroductionById(id);
  if (!intro) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify caller is either side of the intro
  if (intro.candidate_id !== session.candidateId && intro.employer_account_id !== session.employerAccountId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getIntroductionMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session?.candidateId && !session?.employerAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const intro = await getIntroductionById(id);
  if (!intro) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify caller is either side
  const isCandidate = intro.candidate_id === session.candidateId;
  const isEmployer = intro.employer_account_id === session.employerAccountId;
  if (!isCandidate && !isEmployer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (intro.status !== "accepted") {
    return NextResponse.json({ error: "Introduction must be accepted to send messages" }, { status: 400 });
  }

  try {
    const { body } = await request.json();
    if (!body || !body.trim() || body.length > 2000) {
      return NextResponse.json({ error: "Message must be 1-2000 characters" }, { status: 400 });
    }

    const senderType = isEmployer ? "employer" : "candidate";
    const senderId = isEmployer ? session.employerAccountId : session.candidateId;

    const message = await createIntroductionMessage(id, senderType, senderId, body.trim());
    if (!message) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Notify the other party
    if (isEmployer) {
      await createNotification("candidate", intro.candidate_id, "New Message", "An employer sent you a message.", "/introductions");
    } else {
      await createNotification("employer_account", intro.employer_account_id, "New Message", "A candidate sent you a message.", "/employer/dashboard");
    }

    // Log activity
    const sql = getDb();
    await sql`
      INSERT INTO activity_log (employer_account_id, action, details, candidate_id, introduction_id, job_id)
      VALUES (${intro.employer_account_id}, 'message_sent', ${JSON.stringify({ senderType })}, ${intro.candidate_id}, ${parseInt(id)}, ${intro.job_id || null})
    `;

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
