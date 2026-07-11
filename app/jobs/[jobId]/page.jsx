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

  const title = (job.cTitle || "").trim();
  return {
    // Absolute: the root layout template would otherwise append "| careers.ky".
    title: {
      absolute: job.Employer
        ? `${title} — ${job.Employer} — careers.ky`
        : `${title} — careers.ky`,
    },
    description: `${title} job in Cayman Islands${job.Employer ? ` at ${job.Employer}` : ""}. ${salary}. Apply on WORC.`,
  };
}

// schema.org employmentType values, keyed by WORC work_type description.
const EMPLOYMENT_TYPE_MAP = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  temporary: "TEMPORARY",
  internships: "INTERN",
};

function toPlainText(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(text, max = 1500) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

// Google Jobs JobPosting structured data. Only properties backed by real
// posting data are included — nothing is fabricated.
function buildJobPostingJsonLd(job, workTypeLabel) {
  const title = (job.cTitle || "").trim();
  if (!title) return null;

  const description =
    toPlainText(job.jobDescription) ||
    `${title}${job.Employer ? ` at ${job.Employer}` : ""} in the Cayman Islands.`;

  const address = { "@type": "PostalAddress", addressCountry: "KY" };
  if (job.district) address.addressLocality = job.district;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description: truncateAtWord(description),
    jobLocation: { "@type": "Place", address },
  };

  if (job.createdDate) {
    jsonLd.datePosted = new Date(job.createdDate).toISOString().slice(0, 10);
  }
  if (job.endDate) {
    jsonLd.validThrough = new Date(job.endDate).toISOString();
  }

  const employmentType =
    workTypeLabel && EMPLOYMENT_TYPE_MAP[workTypeLabel.toLowerCase()];
  if (employmentType) jsonLd.employmentType = employmentType;

  if (job.Employer) {
    jsonLd.hiringOrganization = { "@type": "Organization", name: job.Employer };
  }

  // fMinSalary/fMaxSalary are normalized to per-annum figures at import time.
  if (job.fMinSalary && job.fMaxSalary) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.Currency || "KYD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.fMinSalary,
        maxValue: job.fMaxSalary,
        unitText: "YEAR",
      },
    };
  }

  return jsonLd;
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

  // Built only after the early-access check above, so JSON-LD never leaks a
  // posting the viewer isn't allowed to see.
  const workTypeMap = Object.fromEntries(workTypes);
  const jsonLd = buildJobPostingJsonLd(job, workTypeMap[job.sWork]);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobPostingClient
        job={job}
        worcUrl={worcUrl}
        workTypes={workTypeMap}
        eduTypes={Object.fromEntries(eduTypes)}
        expTypes={Object.fromEntries(expTypes)}
        locTypes={Object.fromEntries(locTypes)}
      />
    </>
  );
}
