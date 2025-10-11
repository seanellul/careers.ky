import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Rocket, Menu, X, Filter, TrendingUp, MapPin, Building2, Calendar } from "lucide-react";
import { getActiveJobPostings, generateWORCSearchURL } from "@/lib/data";
import { useFadeInOnScroll, useHoverFloat } from "@/animations/gsapEffects";
import gsap from "gsap";

// ——— WORC mapping tables ———
const SORT_KEY = { 0: "Undefined", 1: "Newest", 2: "EndsSoon", 3: "SalaryHighLow", 4: "SalaryLowHigh" };
const LOCATION_KEY = { 0: "Undefined", 1: "West Bay", 2: "Seven Mile Beach", 3: "Camana Bay", 4: "George Town", 5: "South Sound", 6: "Red Bay / Prospect", 7: "Spotts / Newlands", 8: "Savannah / Lower Valley", 9: "Bodden Town", 10: "North Side", 11: "East End", 12: "Rum Point / Cayman Kai", 13: "Cayman Brac", 14: "Little Cayman" };
const WORK_TYPE = { 0: "Undefined", 1: "Full-time", 2: "Part-time", 3: "Shifts", 4: "Weekends", 5: "Temporary", 6: "Internships", 7: "Apprenticeships" };

// ——— Helper formatters ———
function fmtSalary(job) {
  const cur = job?.currency || "KYD";
  const fmt = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n)
      : null;
  if (job?.salaryShort) return job.salaryShort;
  if (job?.minimumAmount && job?.maximumAmount) return `${fmt(job.minimumAmount)} - ${fmt(job.maximumAmount)} ${job.displayFrequency === "perAnnum" ? "per annum" : ""}`;
  if (job?.kydPerAnnum) return `${fmt(job.kydPerAnnum)} per annum`;
  return "Salary not listed";
}

// Parse "DD/MM/YYYY" into a Date reliably
function parseDateDMY(s) {
  if (!s || typeof s !== "string") return new Date(0);
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date(s);
  const [_, d, mth, y] = m;
  return new Date(`${y}-${String(mth).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00Z`);
}

// Helper to truncate text for badges
function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ——— Load active jobs from local data ———
function loadActiveJobs() {
  try {
    const activeJobs = getActiveJobPostings();
    return activeJobs.map(job => ({
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
  } catch (err) {
    console.error("Error loading jobs:", err);
    return [];
  }
}

export default function LiveSearch({ onNavigate, searchParams = {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState(searchParams.searchQuery || "");
  const [loc, setLoc] = useState(0);
  const [type, setType] = useState(0);
  const [sort, setSort] = useState(1); // Newest
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [employerFilter, setEmployerFilter] = useState(searchParams.employer || "");
  const [showActiveOnly, setShowActiveOnly] = useState(searchParams.showActiveOnly || false);
  const pageSize = 12; // Increased for dedicated page

  const revealEls = useRef([]);
  revealEls.current = [];

  const addRevealEl = (el) => {
    if (el && !revealEls.current.includes(el)) revealEls.current.push(el);
  };

  useFadeInOnScroll(revealEls);
  useHoverFloat(".job-card");

  useEffect(() => {
    try {
      setLoading(true);
      const activeJobs = loadActiveJobs();
      setJobs(activeJobs);
      setError("");
    } catch (e) {
      console.error("Error loading jobs:", e);
      setError("Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Derived - filtered and sorted
  const filtered = jobs
    .filter((j) => (loc ? j.jobLocation === LOCATION_KEY[loc] : true))
    .filter((j) => (type ? j.workType === WORK_TYPE[type] : true))
    .filter((j) => (q ? (j.jobTitle?.toLowerCase().includes(q.toLowerCase()) || j.employerName?.toLowerCase().includes(q.toLowerCase())) : true))
    .filter((j) => (employerFilter ? j.employerName?.toLowerCase().includes(employerFilter.toLowerCase()) : true))
    .filter((j) => (showActiveOnly ? j.isActive : true))
    .filter((j) => (searchParams.ciscoCode ? j.sOccupation === searchParams.ciscoCode : true));

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 3) return (b.maximumAmount || 0) - (a.maximumAmount || 0);
    if (sort === 4) return (a.minimumAmount || 0) - (b.minimumAmount || 0);
    if (sort === 2) {
      const aTime = a.endDate instanceof Date ? a.endDate.getTime() : parseDateDMY(a.endDate).getTime();
      const bTime = b.endDate instanceof Date ? b.endDate.getTime() : parseDateDMY(b.endDate).getTime();
      return aTime - bTime;
    }
    const aDate = a.approvalDate instanceof Date ? a.approvalDate : (a.startDate instanceof Date ? a.startDate : parseDateDMY(a.approvalDate || a.startDate));
    const bDate = b.approvalDate instanceof Date ? b.approvalDate : (b.startDate instanceof Date ? b.startDate : parseDateDMY(b.approvalDate || b.startDate));
    return bDate.getTime() - aDate.getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (loading || error) return;
    const cards = document.querySelectorAll('.job-card');
    if (!cards.length) return;
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" });
  }, [loading, error, page, sort, q, loc, type]);

  // Calculate market stats based on filtered results
  const stats = {
    total: filtered.length,
    avgSalary: filtered.reduce((acc, j) => acc + (j.maximumAmount || j.minimumAmount || 0), 0) / Math.max(1, filtered.length),
    locations: new Set(filtered.map(j => j.jobLocation)).size,
    industries: new Set(filtered.map(j => j.occupation)).size,
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Dynamic background */}
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{
        backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)",
        backgroundPosition: "0% 50%"
      }} />

      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-cyan-400/20 grid place-items-center ring-1 ring-cyan-300/30">
              <Rocket className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="font-semibold tracking-tight">careers<span className="text-cyan-300">.ky</span></span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <button onClick={() => onNavigate?.('home')} className="hover:text-white transition">Home</button>
            <button onClick={() => onNavigate?.('career-tracks')} className="hover:text-white transition">Career Tracks</button>
            <span className="text-cyan-300 font-medium">Live Search</span>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-neutral-950/95 backdrop-blur">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate?.('home');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate?.('career-tracks');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Career Tracks
              </button>
              <div className="px-4 py-3 rounded-lg bg-cyan-300/10 border border-cyan-300/30 text-cyan-300 font-medium">
                Live Search
              </div>
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
                Live Job <span className="text-cyan-300">Market Search</span>
              </h1>
              <p className="text-neutral-300 text-lg max-w-3xl">
                Browse {stats.total} active job postings across {stats.industries}+ industries in Cayman. Real-time data from WORC.
              </p>
              {(searchParams.searchQuery || searchParams.employer || searchParams.showActiveOnly || searchParams.ciscoCode) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchParams.searchQuery && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30">
                      Search: {searchParams.searchQuery}
                    </Badge>
                  )}
                  {searchParams.ciscoCode && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">
                      CISCO Code: {searchParams.ciscoCode}
                    </Badge>
                  )}
                  {searchParams.employer && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30">
                      Employer: {searchParams.employer}
                    </Badge>
                  )}
                  {searchParams.showActiveOnly && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-300/30">
                      Active Jobs Only
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-400/15 grid place-items-center">
                    <TrendingUp className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-semibold">{stats.total}</div>
                    <div className="text-xs md:text-sm text-neutral-400">Active Jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-400/15 grid place-items-center">
                    <Building2 className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-semibold">{stats.industries}+</div>
                    <div className="text-xs md:text-sm text-neutral-400">Industries</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-400/15 grid place-items-center">
                    <MapPin className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-semibold">{stats.locations}</div>
                    <div className="text-xs md:text-sm text-neutral-400">Locations</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-400/15 grid place-items-center">
                    <Calendar className="w-5 h-5 text-orange-300" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-semibold">CI$ {Math.round(stats.avgSalary / 1000)}k</div>
                    <div className="text-xs md:text-sm text-neutral-400">Avg Salary</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search Controls */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">Search & Filter</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by job title or employer…"
                className="pl-10 bg-white/5 border-white/10 h-12 text-base"
              />
            </div>

            {showFilters && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <select
                        value={loc}
                        onChange={(e) => { setLoc(Number(e.target.value)); setPage(1); }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                      >
                        {Object.entries(LOCATION_KEY).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Work Type</label>
                      <select
                        value={type}
                        onChange={(e) => { setType(Number(e.target.value)); setPage(1); }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                      >
                        {Object.entries(WORK_TYPE).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Employer</label>
                      <Input
                        value={employerFilter}
                        onChange={(e) => { setEmployerFilter(e.target.value); setPage(1); }}
                        placeholder="Filter by employer..."
                        className="bg-white/5 border-white/10"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <select
                        value={showActiveOnly ? 1 : 0}
                        onChange={(e) => { setShowActiveOnly(Boolean(Number(e.target.value))); setPage(1); }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                      >
                        <option value={0}>All Jobs</option>
                        <option value={1}>Active Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <select
                        value={sort}
                        onChange={(e) => setSort(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                      >
                        {Object.entries(SORT_KEY).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQ("");
                        setLoc(0);
                        setType(0);
                        setEmployerFilter("");
                        setShowActiveOnly(false);
                        setSort(1);
                        setPage(1);
                      }}
                      className="gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-4 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 text-sm text-neutral-300">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length} jobs
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {view.map((j, idx) => (
                <Card key={`${j.jobPostId || idx}`} className="job-card group bg-white/5 border-white/10 hover:border-white/20 transition h-full">
                  <CardContent className="p-5 h-full flex flex-col">
                    <div className="text-xs uppercase tracking-wide text-emerald-300 mb-2">{j.workType || "Role"}</div>

                    <div className="font-medium leading-tight group-hover:text-white mb-2 line-clamp-2 min-h-[2.5rem] flex items-start">
                      {j.jobTitle || "Untitled role"}
                    </div>

                    <div className="text-sm text-neutral-400 mb-2 line-clamp-1">{j.employerName}</div>

                    <div className="text-xs text-neutral-400 mb-3">{j.jobLocation || "Location"} · {j.hoursPerWeek ? `${j.hoursPerWeek} hrs/wk` : ""}</div>

                    <div className="text-sm text-neutral-200 mb-4 line-clamp-2">{fmtSalary(j)}</div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      <Badge className="bg-neutral-800 border-white/10 text-neutral-300 text-xs px-2 py-1 whitespace-nowrap max-w-full truncate" title={j.educationLevel}>
                        {truncateText(j.educationLevel, 18)}
                      </Badge>
                      <Badge className="bg-neutral-800 border-white/10 text-neutral-300 text-xs px-2 py-1 whitespace-nowrap max-w-full truncate" title={j.yearsOfExperience}>
                        {truncateText(j.yearsOfExperience, 18)}
                      </Badge>
                    </div>

                    <div className="text-xs text-neutral-500 mb-3">WORC ID: {j.jobPostIdString || j.jobPostId}</div>

                    <div className="mt-auto">
                      <a 
                        href={generateWORCSearchURL({ cTitle: j.jobTitle, Employer: j.employerName })} 
                        target="_blank" 
                        rel="noreferrer" 
                        title={`Search for "${j.jobTitle}" at "${j.employerName}" on WORC`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/15 w-full gap-2 h-10 px-4 py-2"
                      >
                        Apply on WORC
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-neutral-300">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && sorted.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-neutral-400 mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => { setQ(""); setLoc(0); setType(0); setPage(1); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="pt-12 pb-16 border-t border-white/5 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-neutral-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-400/20 grid place-items-center ring-1 ring-cyan-300/30">
                <Rocket className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="font-medium text-neutral-200">careers.ky</div>
                <div className="text-xs">Live Job Market Data for Caymanians</div>
              </div>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-neutral-200">Privacy</a>
              <a href="#" className="hover:text-neutral-200">Terms</a>
              <a href="#" className="hover:text-neutral-200">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
