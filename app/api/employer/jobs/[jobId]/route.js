import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { closeNativePosting } from "@/lib/native-jobs";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { jobId } = await params;
  const { action } = await request.json();
  if (action !== "close") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const result = await closeNativePosting(jobId, session.employerId);
  if (!result) {
    return NextResponse.json({ error: "Posting not found or not yours" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
