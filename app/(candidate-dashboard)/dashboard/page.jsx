export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getCandidateById,
  getCandidateInterests,
  getCandidateSkills,
  getIntroductionsForCandidate,
  getJobInterestsForCandidate,
  getMatchAlerts,
  getNotifications,
  getUnreadCount,
} from "@/lib/data";
import CandidateDashboardClient from "./CandidateDashboardClient";

export const metadata = {
  title: "Dashboard — careers.ky",
  description: "Your candidate dashboard on careers.ky",
};

export default async function CandidateDashboardPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const [candidate, interests, skills, introductions, jobInterests, alerts, notifications, unreadCount] =
    await Promise.all([
      getCandidateById(session.candidateId),
      getCandidateInterests(session.candidateId),
      getCandidateSkills(session.candidateId),
      getIntroductionsForCandidate(session.candidateId),
      getJobInterestsForCandidate(session.candidateId),
      getMatchAlerts(session.candidateId),
      getNotifications("candidate", session.candidateId, 5),
      getUnreadCount("candidate", session.candidateId),
    ]);

  if (!candidate) redirect("/");

  return (
    <CandidateDashboardClient
      candidate={candidate}
      interests={interests}
      skills={skills}
      introductions={introductions}
      jobInterests={jobInterests}
      alerts={alerts}
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
