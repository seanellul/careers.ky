export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getCandidateById, getCandidateInterests, getCandidateSkills, getNotifications, getUnreadCount, loadEducationTypes, loadExperienceTypes, loadLocationTypes } from "@/lib/data";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "My Profile — careers.ky",
  description: "Manage your talent profile on careers.ky",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const [candidate, interests, skills, notifications, unreadCount, eduTypes, expTypes, locTypes] = await Promise.all([
    getCandidateById(session.candidateId),
    getCandidateInterests(session.candidateId),
    getCandidateSkills(session.candidateId),
    getNotifications("candidate", session.candidateId, 10),
    getUnreadCount("candidate", session.candidateId),
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

  if (!candidate) redirect("/");

  return (
    <ProfileClient
      candidate={candidate}
      interests={interests}
      skills={skills}
      notifications={notifications}
      unreadCount={unreadCount}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
