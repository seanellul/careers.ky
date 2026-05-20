import { buildCiscoTree } from "@/lib/data";
import {
  getCachedCisco,
  getCachedAggregates,
  getCachedActiveJobs,
  getCachedEmployerCount,
} from "@/lib/cached-data";
import HomeClient from "./HomeClient";

export default async function HomePage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const openPlanner =
    searchParams?.planner === "1" ||
    searchParams?.onboarding === "1" ||
    searchParams?.planner === "true";

  const [ciscoRows, aggregatesEntries, activePostings, employerCount] = await Promise.all([
    getCachedCisco(),
    getCachedAggregates(),
    getCachedActiveJobs(),
    getCachedEmployerCount().catch(() => 0),
  ]);
  const aggregates = new Map(aggregatesEntries);

  const tree = buildCiscoTree(ciscoRows);

  // Pre-compute career tracks data for the grid
  const majors = tree.children || [];
  const careerTracks = majors.slice(0, 8).map((major) => {
    let totalJobs = 0;
    let avgSalary = 0;
    let salaryCount = 0;

    const countJobs = (node) => {
      if (node.children) {
        node.children.forEach((child) => {
          if (child.id && child.id.length === 4) {
            const stats = aggregates.get(child.id);
            if (stats) {
              totalJobs += stats.count || 0;
              if (stats.mean) {
                avgSalary += stats.mean * stats.count;
                salaryCount += stats.count;
              }
            }
          } else {
            countJobs(child);
          }
        });
      }
    };
    countJobs(major);
    const finalAvgSalary =
      salaryCount > 0 ? Math.round(avgSalary / salaryCount) : 0;

    return {
      id: major.id,
      title: major.title,
      jobCount: totalJobs,
      avgSalary: finalAvgSalary,
      subcategories: major.children?.length || 0,
    };
  });

  // Transform active postings for the marquee
  const jobs = activePostings.slice(0, 200).map((job) => ({
    jobPostId: job.cJobId,
    jobPostIdString: job.cJobId,
    jobTitle: job.cTitle || "Untitled Role",
    employerName: job.Employer || "Employer not listed",
    workType: job.sWork || "Undefined",
    minimumAmount: job.fMinSalary || 0,
    maximumAmount: job.fMaxSalary || 0,
    salaryShort: job["Salary Description"] || null,
    currency: job.Currency || "KYD",
    occupation: job.Occupation || "",
  }));

  return (
    <HomeClient
      careerTracks={careerTracks}
      jobs={jobs}
      jobCount={activePostings.length}
      industryCount={majors.reduce((n, m) => n + (m.children?.length || 0), 0)}
      employerCount={employerCount}
      initialOpenPlanner={openPlanner}
    />
  );
}
