import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/data";

export async function POST(request) {
  const session = await getSession();
  if (!session?.candidateId && !session?.employerAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipientType = session.candidateId ? "candidate" : "employer";
  const recipientId = session.candidateId || session.employerAccountId;

  try {
    const { id, all } = await request.json();

    if (all) {
      await markAllNotificationsRead(recipientType, recipientId);
    } else if (id) {
      await markNotificationRead(id, recipientType, recipientId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
