import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createIntroduction, createNotification, respondToIntroduction, getIntroductionsForCandidate, getIntroductionsForEmployer } from "@/lib/data";

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const { candidateId, message } = await request.json();
    const intro = await createIntroduction(session.employerAccountId, candidateId, message);

    if (intro) {
      await createNotification(
        "candidate", candidateId,
        "New Introduction Request",
        `An employer wants to connect with you${message ? `: "${message}"` : "."}`,
        "/profile"
      );
    }

    return NextResponse.json({ success: true, introduction: intro });
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Introduction response error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();

  // Employer: get sent introductions
  if (session?.employerAccountId) {
    try {
      const introductions = await getIntroductionsForEmployer(session.employerAccountId);
      return NextResponse.json({ introductions });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch introductions" }, { status: 500 });
    }
  }

  // Candidate: get received introductions
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
