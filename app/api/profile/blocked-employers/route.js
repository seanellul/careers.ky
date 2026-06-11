import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBlockedEmployers } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const blocked = await getBlockedEmployers(session.candidateId);
  return NextResponse.json({ blocked });
}
