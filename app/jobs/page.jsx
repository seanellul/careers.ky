import { Suspense } from "react";
import { getActiveJobPostings } from "@/lib/data";
import LiveSearchClient from "./LiveSearchClient";

export const metadata = {
  title: "Live Job Search — Browse Active Cayman Postings",
  description:
    "Browse and filter active job postings in the Cayman Islands. Real-time data from WORC with salary, location, and industry filters.",
};

export default async function JobsPage() {
  const postings = await getActiveJobPostings();

  const jobs = postings.map((job) => ({
    educationLevel: job.sEducation || "Unavailable",
    employerName: job.Employer || "Employer not listed",
    hoursPerWeek: parseFloat(job["Hours Per Week"]) || 40,
    minimumAmount: job.fMinSalary || 0,
    maximumAmount: job.fMaxSalary || 0,
    jobLocation: job.sLocation || "Undefined",
    jobPostId: job.cJobId,
    jobPostIdString: job.cJobId,
    yearsOfExperience: job.sExperience || "Unavailable",
    workType: job.sWork || "Undefined",
    jobTitle: job.cTitle || "Untitled Role",
    currency: job.Currency || "KYD",
    salaryShort: job["Salary Description"] || null,
    startDate: job.startDate,
    endDate: job.endDate,
    approvalDate: job.createdDate,
    occupation: job.Occupation || "",
    sOccupation: job.sOccupation || "",
  }));

  return (
    <Suspense fallback={null}>
      <LiveSearchClient jobs={jobs} />
    </Suspense>
  );
}
