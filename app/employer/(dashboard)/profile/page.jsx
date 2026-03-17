export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import ProfileEditClient from "./ProfileEditClient";

export const metadata = {
  title: "Edit Profile — careers.ky",
  description: "Edit your employer profile on careers.ky",
};

export default async function ProfileEditPage() {
  const session = await getSession();
  if (!session?.employerId) redirect("/employer/setup");

  const sql = getDb();
  const employers = await sql`SELECT * FROM employers WHERE id = ${session.employerId}`;
  const employer = employers[0];
  if (!employer) redirect("/employer/setup");

  return <ProfileEditClient employer={employer} />;
}
