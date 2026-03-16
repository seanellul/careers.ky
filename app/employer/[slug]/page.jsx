export const dynamic = "force-dynamic";

import { getEmployerProfile, loadWorkTypes, loadEducationTypes, loadExperienceTypes, loadLocationTypes } from "@/lib/data";
import { notFound } from "next/navigation";
import EmployerProfileClient from "./EmployerProfileClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profile = await getEmployerProfile(slug);
  if (!profile) return { title: "Employer Not Found" };

  const { employer, stats } = profile;
  return {
    title: `${employer.name} — Hiring in Cayman`,
    description: `${employer.name} has posted ${stats.totalPostings} jobs in the Cayman Islands. ${stats.activePostings} currently active. View salary ranges, top roles, and hiring trends.`,
    openGraph: {
      title: `${employer.name} — Hiring in Cayman | careers.ky`,
      description: `${stats.totalPostings} job postings, ${stats.activePostings} active. Average salary CI$ ${Math.round(stats.avgSalary).toLocaleString()}.`,
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

  return (
    <EmployerProfileClient
      profile={profile}
      workTypes={Object.fromEntries(workTypes)}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
