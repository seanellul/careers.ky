import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminWaitlistClient from "./AdminWaitlistClient";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const session = await getSession();
  if (!isAdmin(session)) redirect("/sign-in");

  const sql = getDb();
  const entries = await sql`
    SELECT id, name, email, company, size, hiring_for, source, status, joined_at, notified_at
    FROM employer_waitlist
    ORDER BY joined_at DESC
  `;

  return <AdminWaitlistClient entries={entries} />;
}
