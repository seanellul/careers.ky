import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { captureServer, employerDistinctId } from "@/lib/analytics-server";
import {
  validateNativePosting,
  createNativeJobPosting,
  notifyEarlyAccessCandidates,
  getEmployerNativePostings,
} from "@/lib/native-jobs";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }
  const postings = await getEmployerNativePostings(session.employerId);
  return NextResponse.json({ postings });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const check = rateLimit(`post-job:${session.employerAccountId}`, 10, 60 * 60 * 1000);
  if (check.limited) {
    return NextResponse.json({ error: "Too many postings — try again later" }, { status: 429 });
  }

  try {
    const body = await request.json();

    // MVP #15/#16: postings cannot go live with missing fields
    const validated = validateNativePosting(body);
    if (validated.errors.length > 0) {
      return NextResponse.json({ error: validated.errors.join(". ") }, { status: 400 });
    }

    const result = await createNativeJobPosting(session, body, validated);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Caymanian 24h early access — fire notifications now
    let earlyAccessNotified = 0;
    try {
      const employerName = session.employerCompanyName || session.employerName || "An employer";
      earlyAccessNotified = await notifyEarlyAccessCandidates(
        result.posting.job_id,
        result.posting.title,
        employerName,
        body.ciscoCode || null
      );
    } catch (err) {
      console.error("Early access notify error (non-fatal):", err.message);
    }

    captureServer(employerDistinctId(session.employerAccountId), "native_job_posted", {
      district: body.district,
      seniority: body.seniority,
      has_cisco: !!body.ciscoCode,
      early_access_notified: earlyAccessNotified,
    });

    return NextResponse.json({ success: true, posting: result.posting, earlyAccessNotified });
  } catch (error) {
    console.error("Native posting error:", error);
    return NextResponse.json({ error: "Failed to create posting" }, { status: 500 });
  }
}
