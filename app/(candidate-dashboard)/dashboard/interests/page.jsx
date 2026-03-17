export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJobInterestsForCandidate } from "@/lib/data";
import JobInterestsClient from "./JobInterestsClient";

export const metadata = {
  title: "Job Interests — Dashboard — careers.ky",
  description: "Jobs you have expressed interest in",
};

export default async function DashboardInterestsPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const jobInterests = await getJobInterestsForCandidate(session.candidateId);

  return <JobInterestsClient jobInterests={jobInterests} />;
}
