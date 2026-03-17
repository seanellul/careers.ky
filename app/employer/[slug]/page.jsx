export const dynamic = "force-dynamic";

import { getEmployerProfile, loadWorkTypes, loadEducationTypes, loadExperienceTypes, loadLocationTypes } from "@/lib/data";
import { resolvePerks, groupPerksByCategory } from "@/lib/perks";
import { notFound } from "next/navigation";
import EmployerProfileClient from "./EmployerProfileClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profile = await getEmployerProfile(slug);
  if (!profile) return { title: "Employer Not Found" };

  const { employer, stats } = profile;
  const descParts = [`${employer.name} has posted ${stats.totalPostings} jobs in the Cayman Islands.`];
  if (stats.activePostings > 0) descParts.push(`${stats.activePostings} currently active.`);
  if (employer.tagline) descParts.unshift(employer.tagline);

  const resolvedPerks = resolvePerks(employer.benefits);
  if (resolvedPerks.length > 0) {
    descParts.push(`Benefits: ${resolvedPerks.slice(0, 4).map((p) => p.label).join(", ")}.`);
  }

  return {
    title: `${employer.name} — Hiring in Cayman`,
    description: descParts.join(" "),
    openGraph: {
      title: `${employer.name} — Hiring in Cayman | careers.ky`,
      description: employer.tagline || `${stats.totalPostings} job postings, ${stats.activePostings} active. Average salary CI$ ${Math.round(stats.avgSalary).toLocaleString()}.`,
      ...(employer.cover_url && { images: [{ url: employer.cover_url }] }),
    },
  };
}

export default async function EmployerPage({ params }) {
  const { slug } = await params;
  const [profile, workTypes, eduTypes, expTypes, locTypes] = await Promise.all([
    getEmployerProfile(slug),
    loadWorkTypes(),
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

  if (!profile) notFound();

  const resolvedPerks = resolvePerks(profile.employer.benefits);
  const perkGroups = groupPerksByCategory(resolvedPerks);

  return (
    <EmployerProfileClient
      profile={profile}
      perks={perkGroups}
      workTypes={Object.fromEntries(workTypes)}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
