import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id, 10);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { status } = await request.json().catch(() => ({}));
  const allowed = ["pending", "approved", "rejected"];
  if (!allowed.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE employer_waitlist SET status = ${status} WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
