import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getVerificationRequests, approveVerification, rejectVerification } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getVerificationRequests();
  return NextResponse.json({ requests });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action, domain, notes } = await request.json();
  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "requestId and action (approve/reject) required" }, { status: 400 });
  }

  const adminEmail = session.candidateEmail || session.employerEmail;

  if (action === "approve") {
    const result = await approveVerification(requestId, adminEmail, domain || null);
    if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } else {
    const result = await rejectVerification(requestId, adminEmail, notes || null);
    if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  }
}
