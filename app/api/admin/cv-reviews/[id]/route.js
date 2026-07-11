import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import {
  isMissingTableError,
  resolveCvReview,
  notifyCandidateCvReviewCompleted,
} from "@/lib/cv-reviews";

// Complete or decline a pending CV review request.
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number.parseInt(id, 10);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body?.action;
  const feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
  if (!["complete", "decline"].includes(action)) {
    return NextResponse.json({ error: "action must be complete or decline" }, { status: 400 });
  }
  if (action === "complete" && !feedback) {
    return NextResponse.json({ error: "Feedback is required to complete a review" }, { status: 400 });
  }
  if (feedback.length > 10000) {
    return NextResponse.json({ error: "Feedback too long (max 10,000 characters)" }, { status: 400 });
  }

  try {
    const adminEmail = session.candidateEmail || session.employerEmail;
    const review = await resolveCvReview(reviewId, action, feedback || null, adminEmail);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found or already resolved" },
        { status: 404 }
      );
    }

    if (action === "complete") {
      // Best-effort delivery — the review stays completed even if this fails.
      try {
        await notifyCandidateCvReviewCompleted(review);
      } catch (notifyErr) {
        console.error("CV review candidate notification failed:", notifyErr);
      }
    }

    return NextResponse.json({ success: true, review: { id: review.id, status: review.status } });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: "CV reviews are not available yet" }, { status: 503 });
    }
    console.error("CV review resolve error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
