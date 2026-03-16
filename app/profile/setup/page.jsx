export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getCandidateById, loadEducationTypes, loadExperienceTypes, loadLocationTypes } from "@/lib/data";
import { redirect } from "next/navigation";
import ProfileSetupClient from "./ProfileSetupClient";

export const metadata = {
  title: "Set Up Your Profile — careers.ky",
  description: "Complete your talent profile on careers.ky",
};

export default async function ProfileSetupPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const [candidate, eduTypes, expTypes, locTypes] = await Promise.all([
    getCandidateById(session.candidateId),
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

  if (!candidate) redirect("/");

  return (
    <ProfileSetupClient
      candidate={candidate}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
