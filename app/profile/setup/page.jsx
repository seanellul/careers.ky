export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getCandidateById } from "@/lib/data";
import { redirect } from "next/navigation";
import ProfileSetupClient from "./ProfileSetupClient";

export const metadata = {
  title: "Set Up Your Profile — careers.ky",
  description: "Complete your talent profile on careers.ky",
};

export default async function ProfileSetupPage() {
  const session = await getSession();
  if (!session?.candidateId) {
    redirect(`/sign-in?type=candidate&next=${encodeURIComponent("/profile/setup")}`);
  }

  const candidate = await getCandidateById(session.candidateId);
  if (!candidate) redirect("/");

  return <ProfileSetupClient candidate={candidate} />;
}
