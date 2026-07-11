import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminEmployers, detachEmployerAccount } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAdminEmployers();
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, accountId } = await request.json();
  if (action !== "detach" || !Number(accountId)) {
    return NextResponse.json(
      { error: "action 'detach' and accountId required" },
      { status: 400 }
    );
  }

  const adminEmail = session.candidateEmail || session.employerEmail;
  const result = await detachEmployerAccount(Number(accountId), adminEmail);
  if (!result) {
    return NextResponse.json({ error: "Account not found or not attached" }, { status: 404 });
  }
  return NextResponse.json({ success: true, ...result });
}
