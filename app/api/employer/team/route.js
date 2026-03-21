import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTeamMembers, updateTeamMemberRole, removeTeamMember } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const members = await getTeamMembers(session.employerId);
  return NextResponse.json({ members });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const role = session.employerRole;
  if (role !== "owner") {
    return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });
  }

  const { memberId, role: newRole } = await request.json();
  if (!memberId || !["admin", "member"].includes(newRole)) {
    return NextResponse.json({ error: "memberId and valid role required" }, { status: 400 });
  }

  // Can't change own role
  if (memberId === session.employerAccountId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  await updateTeamMemberRole(memberId, session.employerId, newRole);
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const role = session.employerRole;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
  }

  const { memberId } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  // Can't remove yourself
  if (memberId === session.employerAccountId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Can't remove an owner
  const sql = getDb();
  const target = await sql`SELECT role FROM employer_accounts WHERE id = ${memberId} AND employer_id = ${session.employerId}`;
  if (!target.length) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target[0].role === "owner") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  }

  await removeTeamMember(memberId, session.employerId);
  return NextResponse.json({ success: true });
}
