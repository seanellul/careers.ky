import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { matchCandidatesToJob } from "@/lib/scoring";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  try {
    const result = await matchCandidatesToJob(jobId);
    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Match-to-job error:", error);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
