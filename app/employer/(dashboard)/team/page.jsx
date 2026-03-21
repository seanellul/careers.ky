import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeamMembers, getTeamInvitations } from "@/lib/data";
import TeamClient from "./TeamClient";

export const metadata = { title: "Team — Employer Dashboard" };

export default async function TeamPage() {
  const session = await getSession();
  if (!session?.employerId) redirect("/employer/setup");

  const role = session.employerRole || "member";
  if (role !== "owner" && role !== "admin") {
    redirect("/employer/dashboard");
  }

  const [members, invitations] = await Promise.all([
    getTeamMembers(session.employerId),
    getTeamInvitations(session.employerId),
  ]);

  return (
    <TeamClient
      members={members}
      invitations={invitations}
      currentAccountId={session.employerAccountId}
      currentRole={role}
    />
  );
}
