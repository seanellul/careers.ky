import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminOutreachList, upsertOutreach } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employers = await getAdminOutreachList();
  return NextResponse.json({ employers });
}

export async function PUT(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, status, notes } = await request.json();
  if (!slug || !status) {
    return NextResponse.json({ error: "slug and status required" }, { status: 400 });
  }

  const result = await upsertOutreach(slug, status, notes);
  return NextResponse.json(result);
}
