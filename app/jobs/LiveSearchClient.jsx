"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp, MapPin, Building2, Calendar, X, Plus, HeartHandshake, CheckCircle, DollarSign, GraduationCap, Clock } from "lucide-react";
import gsap from "gsap";
import t from "@/lib/theme";

const LOCATION_KEY = { 0: "Undefined", 1: "West Bay", 2: "Seven Mile Beach", 3: "Camana Bay", 4: "George Town", 5: "South Sound", 6: "Red Bay / Prospect", 7: "Spotts / Newlands", 8: "Savannah / Lower Valley", 9: "Bodden Town", 10: "North Side", 11: "East End", 12: "Rum Point / Cayman Kai", 13: "Cayman Brac", 14: "Little Cayman" };
const WORK_TYPE = { 0: "Undefined", 1: "Full-time", 2: "Part-time", 3: "Shifts", 4: "Weekends", 5: "Temporary", 6: "Internships", 7: "Apprenticeships" };
const SORT_KEY = { 0: "Undefined", 1: "Newest", 2: "EndsSoon", 3: "SalaryHighLow", 4: "SalaryLowHigh" };

function titleCase(str) {
  if (!str) return str;
  if (str.replace(/[^A-Z]/g, "").length / str.replace(/\s/g, "").length > 0.6) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return str;
}

function fmtSalary(job) {
  const cur = job?.currency || "KYD";
  const fmt = (n) => typeof n === "number" ? new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n) : null;
  if (job?.salaryShort) return job.salaryShort;
  if (job?.minimumAmount && job?.maximumAmount) return `${fmt(job.minimumAmount)} - ${fmt(job.maximumAmount)}`;
  return "Salary not listed";
}

function fmtSalaryDisplay(job) {
  if (!job) return { main: "Salary not listed", suffix: "" };
  const min = job.minimumAmount;
  const max = job.maximumAmount;
  if (!min && !max && !job.salaryShort) return { main: "Salary not listed", suffix: "" };

  const prefix = (job.currency === "KYD" || !job.currency) ? "CI$" : job.currency + " ";

  const fmtNum = (n) => {
    if (n >= 1000) return Math.round(n / 1000) + "K";
    return String(Math.round(n));
  };

  // Extract period from salaryShort if available
  let suffix = "";
  const short = job.salaryShort || "";
  if (/per\s*hour/i.test(short)) suffix = "/hr";
  else if (/per\s*annum|annual/i.test(short)) suffix = "/yr";
  else if (/per\s*month/i.test(short)) suffix = "/mo";
  else if (min && min >= 100) suffix = "/yr"; // assume annual for large amounts

  if (min && max && min !== max) {
    return { main: `${prefix} ${fmtNum(min)} – ${fmtNum(max)}`, suffix };
  }
  if (max) return { main: `${prefix} ${fmtNum(max)}`, suffix };
  if (min) return { main: `${prefix} ${fmtNum(min)}`, suffix };
  // Fallback: clean up salaryShort
  const cleaned = short
    .replace(/KYD\$?/g, prefix)
    .replace(/Per\s*Annum/i, "")
    .replace(/Per\s*Hour/i, "")
    .replace(/\.0+\b/g, "")
    .trim();
  return { main: cleaned || "Salary not listed", suffix };
}

function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export default function LiveSearchClient({ jobs: allJobs, workTypes: wtObj = {}, eduTypes: etObj = {}, expTypes: exObj = {}, locTypes: ltObj = {}, ciscoSubMajors = {}, embedded = false, basePath }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const initialEmployer = searchParams.get("employer") || "";
  const initialCisco = searchParams.get("cisco") || "";
  const initialLoc = Number(searchParams.get("loc") || 0);
  const initialType = Number(searchParams.get("type") || 0);
  const initialSort = Number(searchParams.get("sort") || 1);

  const [q, setQ] = useState(initialQ);
  const [loc, setLoc] = useState(initialLoc);
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [employerFilter, setEmployerFilter] = useState(initialEmployer);
  const [showMyJobs, setShowMyJobs] = useState(false);
  const [occGroup, setOccGroup] = useState("");
  const pageSize = 12;

  // Session for Express Interest
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [interestSent, setInterestSent] = useState({}); // jobId -> true
  const [sendingInterest, setSendingInterest] = useState(null);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => { setSession(d.authenticated ? d : null); setSessionLoaded(true); }).catch(() => setSessionLoaded(true));
  }, []);

  const handleExpressInterest = async (jobId) => {
    setSendingInterest(jobId);
    try {
      const res = await fetch("/api/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok || res.status === 409) {
        setInterestSent(prev => ({ ...prev, [jobId]: true }));
      }
    } finally {
      setSendingInterest(null);
    }
  };

  // Sync filter state to URL
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (loc) params.set("loc", String(loc));
    if (type) params.set("type", String(type));
    if (sort !== 1) params.set("sort", String(sort));
    if (employerFilter) params.set("employer", employerFilter);
    if (initialCisco) params.set("cisco", initialCisco);
    const str = params.toString();
    if (!embedded) {
      router.replace(str ? `/jobs?${str}` : "/jobs", { scroll: false });
    }
  }, [q, loc, type, sort, employerFilter, initialCisco, router]);

  useEffect(() => {
    const timer = setTimeout(updateURL, 300);
    return () => clearTimeout(timer);
  }, [updateURL]);

  // Occupation group options (sub-major groups from CISCO codes)
  const occGroupOptions = useMemo(() => {
    const counts = {};
    for (const j of allJobs) {
      const code = j.sOccupation?.substring(0, 2);
      if (code) counts[code] = (counts[code] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([code, count]) => ({ code, label: ciscoSubMajors[code] || `Group ${code}`, count }))
      .sort((a, b) => b.count - a.count);
  }, [allJobs, ciscoSubMajors]);

  // Skills filter
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillCiscoCodes, setSkillCiscoCodes] = useState(new Set());
  const [skillTitleGroups, setSkillTitleGroups] = useState([]);

  // Search skills
  useEffect(() => {
    if (!skillQuery.trim()) { setSkillSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/skills/search?q=${encodeURIComponent(skillQuery)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        const existing = new Set(selectedSkills.map(s => s.id));
        setSkillSuggestions((d.skills || []).filter(s => !existing.has(s.id)).slice(0, 8));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [skillQuery]);

  // Fetch CISCO codes + title keywords when skills change
  useEffect(() => {
    if (selectedSkills.length === 0) { setSkillCiscoCodes(new Set()); setSkillTitleGroups([]); return; }
    const ids = selectedSkills.map(s => s.id).join(",");
    fetch(`/api/skills/cisco-codes?skillIds=${ids}`)
      .then(r => r.json())
      .then(d => {
        setSkillCiscoCodes(new Set(d.ciscoCodes || []));
        setSkillTitleGroups(d.titleGroups || []);
      })
      .catch(() => { setSkillCiscoCodes(new Set()); setSkillTitleGroups([]); });
  }, [selectedSkills]);

  const addSkill = (skill) => {
    setSelectedSkills([...selectedSkills, skill]);
    setSkillQuery("");
    setSkillSuggestions([]);
    setPage(1);
  };

  const removeSkill = (id) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== id));
    setPage(1);
  };

  const filtered = allJobs
    .filter((j) => (loc ? j.jobLocation === String(loc) : true))
    .filter((j) => (type ? j.workType === String(type) : true))
    .filter((j) => (q ? (j.jobTitle?.toLowerCase().includes(q.toLowerCase()) || j.employerName?.toLowerCase().includes(q.toLowerCase())) : true))
    .filter((j) => (employerFilter ? j.employerName?.toLowerCase().includes(employerFilter.toLowerCase()) : true))
    .filter((j) => (initialCisco ? j.sOccupation === initialCisco : true))
    .filter((j) => (occGroup ? j.sOccupation?.startsWith(occGroup) : true))
    .filter((j) => {
      if (skillCiscoCodes.size === 0 && skillTitleGroups.length === 0) return true;
      // Match by occupation code OR by title keywords (catches misclassified jobs)
      if (skillCiscoCodes.has(j.sOccupation)) return true;
      if (skillTitleGroups.length > 0) {
        const title = (j.jobTitle || "").toLowerCase();
        // A job matches if ALL words in any keyword group appear in the title
        return skillTitleGroups.some(group => group.every(word => title.includes(word)));
      }
      return false;
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 3) return (b.maximumAmount || 0) - (a.maximumAmount || 0);
    if (sort === 4) return (a.minimumAmount || 0) - (b.minimumAmount || 0);
    const aDate = a.approvalDate instanceof Date ? a.approvalDate : new Date(a.approvalDate || 0);
    const bDate = b.approvalDate instanceof Date ? b.approvalDate : new Date(b.approvalDate || 0);
    return bDate.getTime() - aDate.getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.offsetParent === null) return;
    const cards = containerRef.current.querySelectorAll(".job-card");
    if (!cards.length) return;
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" });
  }, [page, sort, q, loc, type]);

  const stats = {
    total: filtered.length,
    avgSalary: filtered.reduce((acc, j) => acc + (j.maximumAmount || j.minimumAmount || 0), 0) / Math.max(1, filtered.length),
    locations: new Set(filtered.map((j) => j.jobLocation)).size,
    industries: new Set(filtered.map((j) => j.sOccupation?.slice(0, 2)).filter(Boolean)).size,
  };

  const content = (
    <div className={embedded ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Live Job <span className="text-primary-500">Market Search</span>
          </h1>
          <p className="text-neutral-600 text-lg max-w-3xl">
            Browse {stats.total} active job postings across {stats.industries}+ industries in Cayman. Real-time data from WORC.
          </p>
          {(initialQ || initialEmployer || initialCisco) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {initialQ && <Badge className="bg-primary-50 text-primary-500 border-primary-200">Search: {initialQ}</Badge>}
              {initialCisco && <Badge className="bg-purple-50 text-purple-600 border-purple-200">CISCO: {initialCisco}</Badge>}
              {initialEmployer && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">Employer: {initialEmployer}</Badge>}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary-50 grid place-items-center"><TrendingUp className="w-5 h-5 text-primary-500" /></div><div><div className="text-xl sm:text-2xl md:text-3xl font-semibold">{stats.total}</div><div className="text-xs md:text-sm text-neutral-500">Active Jobs</div></div></div></CardContent></Card>
          <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center"><Building2 className="w-5 h-5 text-emerald-600" /></div><div><div className="text-xl sm:text-2xl md:text-3xl font-semibold">{stats.industries}+</div><div className="text-xs md:text-sm text-neutral-500">Industries</div></div></div></CardContent></Card>
          <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-50 grid place-items-center"><MapPin className="w-5 h-5 text-purple-600" /></div><div><div className="text-xl sm:text-2xl md:text-3xl font-semibold">{stats.locations}</div><div className="text-xs md:text-sm text-neutral-500">Locations</div></div></div></CardContent></Card>
          <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-orange-50 grid place-items-center"><Calendar className="w-5 h-5 text-orange-600" /></div><div><div className="text-xl md:text-2xl font-semibold truncate">CI$ {Math.round(stats.avgSalary / 1000)}k</div><div className="text-xs md:text-sm text-neutral-500">Avg Salary</div></div></div></CardContent></Card>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">Search & Filter</h3>
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by job title or employer..." className="pl-10 bg-neutral-50 border-neutral-200 h-12 text-base" />
              </div>
              {sessionLoaded && session?.employerCompanyName && (
                <Button
                  variant={showMyJobs ? "default" : "secondary"}
                  className={`gap-2 h-12 shrink-0 ${showMyJobs ? "bg-primary-50 text-primary-500 border border-primary-200" : ""}`}
                  onClick={() => {
                    const next = !showMyJobs;
                    setShowMyJobs(next);
                    setEmployerFilter(next ? session.employerCompanyName : "");
                    setPage(1);
                  }}
                >
                  <Building2 className="w-4 h-4" /> My Jobs
                </Button>
              )}
            </div>
            {showFilters && (
              <Card className="bg-neutral-50 border-neutral-200">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <select value={loc} onChange={(e) => { setLoc(Number(e.target.value)); setPage(1); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700">
                        {Object.entries(LOCATION_KEY).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Work Type</label>
                      <select value={type} onChange={(e) => { setType(Number(e.target.value)); setPage(1); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700">
                        {Object.entries(WORK_TYPE).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Employer</label>
                      <Input value={employerFilter} onChange={(e) => { setEmployerFilter(e.target.value); setShowMyJobs(false); setPage(1); }} placeholder="Filter by employer..." className="bg-neutral-50 border-neutral-200" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Occupation</label>
                      <select value={occGroup} onChange={(e) => { setOccGroup(e.target.value); setPage(1); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700">
                        <option value="">All Occupations</option>
                        {occGroupOptions.map(o => (<option key={o.code} value={o.code}>{o.label} ({o.count})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <select value={sort} onChange={(e) => setSort(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700">
                        {Object.entries(SORT_KEY).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="secondary" onClick={() => { setQ(""); setLoc(0); setType(0); setEmployerFilter(""); setOccGroup(""); setShowMyJobs(false); setSort(1); setSelectedSkills([]); setPage(1); }} className="gap-2 w-full">
                        <Filter className="w-4 h-4" /> Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Skills Filter */}
                  <div className="pt-3 border-t border-neutral-200">
                    <label className="text-sm font-medium mb-2 block">Skills</label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search skills (e.g. compliance, accounting)"
                        className="pl-10 bg-neutral-50 border-neutral-200"
                      />
                    </div>
                    {skillSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skillSuggestions.map(s => (
                          <button key={s.id} onClick={() => addSkill(s)}>
                            <Badge className="bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-purple-300 cursor-pointer">
                              <Plus className="w-3 h-3 mr-1" /> {s.name}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map(s => (
                          <Badge key={s.id} className="bg-purple-50 text-purple-600 border-purple-200 pr-1 flex items-center gap-1">
                            {s.name}
                            <button onClick={() => removeSkill(s.id)} className="ml-1 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 text-sm text-neutral-600">
          Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length} jobs
        </div>

        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {view.map((j, idx) => {
            const salary = fmtSalaryDisplay(j);
            return (
            <Card key={`${j.jobPostId || idx}`} className="job-card group bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-primary-200/10 hover:-translate-y-0.5 transition-all duration-200 h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="mb-2">
                  <span className="inline-block text-xs font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">{WORK_TYPE[j.workType] || wtObj[j.workType] || "Role"}</span>
                </div>
                <Link href={`/jobs/${j.jobPostIdString || j.jobPostId}`} className="font-medium leading-tight group-hover:text-primary-500 mb-1.5 line-clamp-2 min-h-[2.5rem] flex items-start transition">{j.jobTitle || "Untitled role"}</Link>
                <div className="text-sm text-neutral-500 mb-1.5 line-clamp-1">
                  <Link href={`/employer/${encodeURIComponent(j.employerName?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`} className="hover:text-primary-500 transition">{titleCase(j.employerName)}</Link>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{LOCATION_KEY[j.jobLocation] || ltObj[j.jobLocation] || "Cayman Islands"}{j.hoursPerWeek ? ` · ${j.hoursPerWeek} hrs/wk` : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-semibold text-neutral-800">{salary.main}</span>
                  {salary.suffix && <span className="text-xs text-neutral-500">{salary.suffix}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {etObj[j.educationLevel] && (
                    <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs px-2 py-0.5 gap-1">
                      <GraduationCap className="w-3 h-3" />{truncateText(etObj[j.educationLevel], 22)}
                    </Badge>
                  )}
                  {exObj[j.yearsOfExperience] && (
                    <Badge className="bg-primary-50 text-primary-500 border-primary-200 text-xs px-2 py-0.5 gap-1">
                      <Clock className="w-3 h-3" />{truncateText(exObj[j.yearsOfExperience], 22)}
                    </Badge>
                  )}
                </div>
                <div className="mt-auto space-y-2">
                  {(() => {
                    const jobId = j.jobPostIdString || j.jobPostId;
                    const isCandidate = session?.candidateId && !session?.employerAccountId;
                    const alreadySent = interestSent[jobId];
                    return (
                      <>
                        {sessionLoaded && (
                          <>
                            {isCandidate && !alreadySent && (
                              <button
                                onClick={(e) => { e.preventDefault(); handleExpressInterest(jobId); }}
                                disabled={sendingInterest === jobId}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-primary-50 text-primary-500 border border-primary-200 hover:bg-primary-100 w-full gap-2 h-10 px-4 py-2 transition disabled:opacity-50"
                              >
                                <HeartHandshake className="w-4 h-4" /> {sendingInterest === jobId ? "Sending..." : "Express Interest"}
                              </button>
                            )}
                            {isCandidate && alreadySent && (
                              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 w-full gap-2 h-10 px-4 py-2">
                                <CheckCircle className="w-4 h-4" /> Interest Expressed
                              </div>
                            )}
                            {!session && (
                              <Link href="/profile/setup" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-primary-50 text-primary-500 border border-primary-200 hover:bg-primary-100 w-full gap-2 h-10 px-4 py-2 transition">
                                <HeartHandshake className="w-4 h-4" /> Sign in to Express Interest
                              </Link>
                            )}
                          </>
                        )}
                        <Link href={`/jobs/${jobId}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 w-full gap-2 h-10 px-4 py-2 transition">
                          View Details
                        </Link>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-600">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>

        {sorted.length === 0 && (
          <Card className="bg-neutral-50 border-neutral-200 mt-8">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-neutral-500 mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => { setQ(""); setLoc(0); setType(0); setEmployerFilter(""); setOccGroup(""); setShowMyJobs(false); setSelectedSkills([]); setPage(1); }}>Clear Filters</Button>
            </CardContent>
          </Card>
        )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />
      {content}
    </div>
  );
}
