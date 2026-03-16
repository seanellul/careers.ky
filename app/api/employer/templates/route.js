import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const sql = getDb();
  const templates = await sql`
    SELECT * FROM intro_templates
    WHERE employer_account_id = ${session.employerAccountId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ templates });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { name, message } = await request.json();
  if (!name || !message) {
    return NextResponse.json({ error: "Name and message required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO intro_templates (employer_account_id, name, message)
    VALUES (${session.employerAccountId}, ${name}, ${message})
    RETURNING *
  `;
  return NextResponse.json({ template: rows[0] });
}

export async function PUT(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id, name, message } = await request.json();
  const sql = getDb();
  await sql`
    UPDATE intro_templates SET name = ${name}, message = ${message}
    WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { id } = await request.json();
  const sql = getDb();
  await sql`DELETE FROM intro_templates WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}`;
  return NextResponse.json({ success: true });
}
