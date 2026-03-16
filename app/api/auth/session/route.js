import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  let unreadCount = 0;
  try {
    if (session.candidateId) {
      unreadCount = await getUnreadCount("candidate", session.candidateId);
    } else if (session.employerAccountId) {
      unreadCount = await getUnreadCount("employer_account", session.employerAccountId);
    }
  } catch {}

  return NextResponse.json({ authenticated: true, ...session, unreadCount });
}
