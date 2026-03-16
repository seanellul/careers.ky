const WORC_BASE_URL = "https://my.egov.ky/o/worc-job-post-search/";

// Parse DD/MM/YYYY dates from WORC API
function parseDateDMY(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date(s);
  const [_, d, mth, y] = m;
  return new Date(`${y}-${String(mth).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00Z`);
}

export async function fetchWORCJobs() {
  const token = process.env.WORC_P_AUTH;
  if (!token) throw new Error("WORC_P_AUTH environment variable is not set");

  const url = `${WORC_BASE_URL}?p_auth=${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`WORC API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = data?.data?.result || [];
  return results.map(mapWORCJob);
}

function mapWORCJob(item) {
  // WORC status codes: 4 = Active (open), others = closed/draft
  const statusMap = { 4: "Active" };
  const status = statusMap[item.status] || "Closed";

  return {
    job_id: item.jobPostIdString || String(item.jobPostId),
    title: item.jobTitle || "Untitled",
    status,
    created_date: parseDateDMY(item.approvalDate),
    start_date: parseDateDMY(item.startDate),
    end_date: parseDateDMY(item.endDate),
    work_type: String(item.workType ?? "0"),
    employer: item.employerName || null,
    education: String(item.educationLevel ?? "0"),
    experience: String(item.yearsOfExperience ?? "0"),
    location: String(item.jobLocation ?? "0"),
    occupation_code: String(item.occupation ?? "0"),
    occupation_name: item.occupationLabel || null,
    hours_per_week: item.hoursPerWeek || null,
    currency: item.currency || "KYD",
    salary_description: item.salaryShort || null,
    min_salary: item.minimumAmount > 0 ? item.minimumAmount : null,
    max_salary: item.maximumAmount > 0 ? item.maximumAmount : null,
    mean_salary:
      item.minimumAmount > 0 && item.maximumAmount > 0
        ? (item.minimumAmount + item.maximumAmount) / 2
        : null,
    industry: item.industry || null,
  };
}
