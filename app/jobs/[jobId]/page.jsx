import {
  getJobPostingById,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
  loadLocationTypes,
  generateWORCSearchURL,
} from "@/lib/data";
import { notFound } from "next/navigation";
import JobPostingClient from "./JobPostingClient";

export async function generateMetadata({ params }) {
  const { jobId } = await params;
  const job = await getJobPostingById(jobId);
  if (!job) return { title: "Job Not Found" };

  const salary = job.salaryShort || (job.fMinSalary && job.fMaxSalary
    ? `${job.Currency || "KYD"} ${job.fMinSalary.toLocaleString()} - ${job.fMaxSalary.toLocaleString()}`
    : "");

  return {
    title: `${job.cTitle} at ${job.Employer || "Employer"} — careers.ky`,
    description: `${job.cTitle} job in Cayman Islands${job.Employer ? ` at ${job.Employer}` : ""}. ${salary}. Apply on WORC.`,
  };
}

export default async function JobPostingPage({ params }) {
  const { jobId } = await params;
  const [job, workTypes, eduTypes, expTypes, locTypes] = await Promise.all([
    getJobPostingById(jobId),
    loadWorkTypes(),
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

  if (!job) notFound();

  const worcUrl = generateWORCSearchURL({ cTitle: job.cTitle, Employer: job.Employer });

  return (
    <JobPostingClient
      job={job}
      worcUrl={worcUrl}
      workTypes={Object.fromEntries(workTypes)}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
