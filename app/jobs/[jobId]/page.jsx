import { getJobPostingById, generateWORCSearchURL, getCandidateById } from "@/lib/data";
import {
  getCachedWorkTypes,
  getCachedEducationTypes,
  getCachedExperienceTypes,
  getCachedLocationTypes,
} from "@/lib/cached-data";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import JobPostingClient from "./JobPostingClient";

// Caymanian 24h early access: a native posting before its public_at is
// visible only to Caymanian candidates and the employer that posted it.
async function canViewEarlyAccess(job) {
  if (job.source !== "native" || !job.publicAt || new Date(job.publicAt) <= new Date()) {
    return true;
  }
  const session = await getSession();
  if (!session) return false;
  if (session.employerAccountId && session.employerAccountId === job.postedByAccountId) {
    return true;
  }
  if (session.candidateId) {
    const candidate = await getCandidateById(session.candidateId);
    return candidate?.status === "caymanian";
  }
  return false;
}

export async function generateMetadata({ params }) {
  const { jobId } = await params;
  const job = await getJobPostingById(jobId);
  if (!job) return { title: "Job Not Found" };

  const salary =
    job.salaryShort ||
    (job.fMinSalary && job.fMaxSalary
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
    getCachedWorkTypes(),
    getCachedEducationTypes(),
    getCachedExperienceTypes(),
    getCachedLocationTypes(),
  ]);

  if (!job) notFound();
  if (!(await canViewEarlyAccess(job))) notFound();

  const worcUrl =
    job.source === "native"
      ? null
      : generateWORCSearchURL({ cTitle: job.cTitle, Employer: job.Employer });

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
