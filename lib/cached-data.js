import { unstable_cache } from "next/cache";
import {
  loadCISCO,
  loadAggregates,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
  loadLocationTypes,
  getActiveJobPostings,
  getEmployerList,
} from "./data";
import { getDb } from "./db";

// Cache strategy: WORC sync runs daily at 06:00 UTC and revalidates these tags
// on completion (see app/api/cron/sync-worc/route.js). The 24h TTL is the
// fallback if the cron is delayed or never runs.
//
// Tags:
//   - "jobs"     → invalidated when job_postings change
//   - "employers" → invalidated when employers table changes
//   - "taxonomy" → lookup tables / CISCO units (effectively static)

const DAY = 86400;
const WEEK = 7 * DAY;

export const getCachedCisco = unstable_cache(
  () => loadCISCO(),
  ["cisco-units"],
  { revalidate: WEEK, tags: ["taxonomy"] },
);

// Maps don't survive the data cache — store as entries, reconstruct at call site.
export const getCachedAggregates = unstable_cache(
  async () => {
    const map = await loadAggregates();
    return Array.from(map.entries());
  },
  ["aggregates"],
  { revalidate: DAY, tags: ["jobs"] },
);

export const getCachedActiveJobs = unstable_cache(
  () => getActiveJobPostings(),
  ["active-jobs"],
  { revalidate: DAY, tags: ["jobs"] },
);

export const getCachedEmployerList = unstable_cache(
  () => getEmployerList(),
  ["employer-list"],
  { revalidate: DAY, tags: ["employers", "jobs"] },
);

export const getCachedEmployerCount = unstable_cache(
  async () => {
    const sql = getDb();
    const rows = await sql`SELECT COUNT(*) as count FROM employers`;
    return Number(rows[0].count);
  },
  ["employer-count"],
  { revalidate: DAY, tags: ["employers"] },
);

const cachedLookupAsEntries = (loader, key) =>
  unstable_cache(
    async () => {
      const map = await loader();
      return Array.from(map.entries());
    },
    [key],
    { revalidate: WEEK, tags: ["taxonomy"] },
  );

export const getCachedWorkTypes = cachedLookupAsEntries(loadWorkTypes, "work-types");
export const getCachedEducationTypes = cachedLookupAsEntries(loadEducationTypes, "education-types");
export const getCachedExperienceTypes = cachedLookupAsEntries(loadExperienceTypes, "experience-types");
export const getCachedLocationTypes = cachedLookupAsEntries(loadLocationTypes, "location-types");
