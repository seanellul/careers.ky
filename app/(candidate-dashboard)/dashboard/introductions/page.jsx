export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getIntroductionsForCandidate } from "@/lib/data";
import IntroductionsClient from "@/app/introductions/IntroductionsClient";

export const metadata = {
  title: "Introductions — Dashboard — careers.ky",
  description: "View and respond to employer introduction requests",
};

export default async function DashboardIntroductionsPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const introductions = await getIntroductionsForCandidate(session.candidateId);

  return <IntroductionsClient introductions={introductions} embedded />;
}
