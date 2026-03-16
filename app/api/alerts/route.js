import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatchAlerts, createMatchAlert, deleteMatchAlert } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await getMatchAlerts(session.candidateId);
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filters, frequency } = await request.json();
    const alert = await createMatchAlert(session.candidateId, filters, frequency);
    return NextResponse.json({ success: true, alert });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    await deleteMatchAlert(id, session.candidateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
