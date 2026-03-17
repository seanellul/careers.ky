import { NextResponse } from "next/server";
import { checkEmployerForJob } from "@/lib/data";

export async function GET(request, { params }) {
  const { jobId } = await params;

  try {
    const employer = await checkEmployerForJob(jobId);
    return NextResponse.json({ hasEmployerAccount: !!employer });
  } catch (error) {
    console.error("Employer status check error:", error);
    return NextResponse.json({ hasEmployerAccount: false });
  }
}
