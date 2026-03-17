import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getEmployerPostings } from "@/lib/data";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const postings = await getEmployerPostings(session.employerId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filtered = status === "active"
      ? postings.filter(p => p.isActive)
      : postings;

    return NextResponse.json({ postings: filtered });
  } catch (error) {
    console.error("Postings error:", error);
    return NextResponse.json({ error: "Failed to fetch postings" }, { status: 500 });
  }
}
