import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  isMissingTableError,
  isDuplicateOpenRequestError,
  getLatestCvDocument,
  getCvReviewsForCandidate,
  getOpenCvReview,
  createCvReviewRequest,
  sendCvReviewRequestNotificationToTeam,
} from "@/lib/cv-reviews";

// Candidate-facing state for the Free CV Review card. Returns
// { enabled: false } when the cv_review_requests migration hasn't been
// applied yet so the UI hides the feature instead of breaking.
export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [cv, reviews] = await Promise.all([
      getLatestCvDocument(session.candidateId),
      getCvReviewsForCandidate(session.candidateId),
    ]);
    return NextResponse.json({ enabled: true, cv, reviews });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ enabled: false, cv: null, reviews: [] });
    }
    console.error("CV review state error:", error);
    return NextResponse.json({ error: "Failed to load CV review state" }, { status: 500 });
  }
}

export async function POST() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = rateLimit(`cv-review:${session.candidateId}`, 3, 60 * 60 * 1000);
  if (check.limited) {
    return NextResponse.json({ error: "Too many requests — try again later" }, { status: 429 });
  }

  try {
    const cv = await getLatestCvDocument(session.candidateId);
    if (!cv) {
      return NextResponse.json({ error: "Upload a CV first" }, { status: 400 });
    }

    const open = await getOpenCvReview(session.candidateId);
    if (open) {
      return NextResponse.json(
        { error: "You already have a review in progress" },
        { status: 409 }
      );
    }

    const request = await createCvReviewRequest(session.candidateId, cv.id);

    // Best-effort admin notification — never fail the request over email.
    try {
      await sendCvReviewRequestNotificationToTeam(
        { id: session.candidateId, name: session.candidateName, email: session.candidateEmail },
        cv,
        request.id
      );
    } catch (emailErr) {
      console.error("CV review admin notification failed:", emailErr);
    }

    return NextResponse.json({ success: true, request });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: "CV reviews are not available yet" }, { status: 503 });
    }
    if (isDuplicateOpenRequestError(error)) {
      return NextResponse.json(
        { error: "You already have a review in progress" },
        { status: 409 }
      );
    }
    console.error("CV review request error:", error);
    return NextResponse.json({ error: "Failed to request CV review" }, { status: 500 });
  }
}
