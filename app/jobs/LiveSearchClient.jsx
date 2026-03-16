"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp, MapPin, Building2, Calendar, X, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { generateWORCSearchURL } from "@/lib/data";
import gsap from "gsap";

const LOCATION_KEY = { 0: "Undefined", 1: "West Bay", 2: "Seven Mile Beach", 3: "Camana Bay", 4: "George Town", 5: "South Sound", 6: "Red Bay / Prospect", 7: "Spotts / Newlands", 8: "Savannah / Lower Valley", 9: "Bodden Town", 10: "North Side", 11: "East End", 12: "Rum Point / Cayman Kai", 13: "Cayman Brac", 14: "Little Cayman" };
const WORK_TYPE = { 0: "Undefined", 1: "Full-time", 2: "Part-time", 3: "Shifts", 4: "Weekends", 5: "Temporary", 6: "Internships", 7: "Apprenticeships" };
const SORT_KEY = { 0: "Undefined", 1: "Newest", 2: "EndsSoon", 3: "SalaryHighLow", 4: "SalaryLowHigh" };

function fmtSalary(job) {
  const cur = job?.currency || "KYD";
  const fmt = (n) => typeof n === "number" ? new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n) : null;
  if (job?.salaryShort) return job.salaryShort;
  if (job?.minimumAmount && job?.maximumAmount) return `${fmt(job.minimumAmount)} - ${fmt(job.maximumAmount)}`;
  return "Salary not listed";
}

function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export default function LiveSearchClient({ jobs: allJobs }) {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialEmployer = searchParams.get("employer") || "";
  const initialCisco = searchParams.get("cisco") || "";

  const [q, setQ] = useState(initialQ);
  const [loc, setLoc] = useState(0);
  const [type, setType] = useState(0);
  const [sort, setSort] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [employerFilter, setEmployerFilter] = useState(initialEmployer);
  const pageSize = 12;

  // Skills filter
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillCiscoCodes, setSkillCiscoCodes] = useState(new Set());

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

  // Fetch CISCO codes when skills change
  useEffect(() => {
    if (selectedSkills.length === 0) { setSkillCiscoCodes(new Set()); return; }
    const ids = selectedSkills.map(s => s.id).join(",");
    fetch(`/api/skills/cisco-codes?skillIds=${ids}`)
      .then(r => r.json())
      .then(d => setSkillCiscoCodes(new Set(d.ciscoCodes || [])))
      .catch(() => setSkillCiscoCodes(new Set()));
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
    .filter((j) => (loc ? j.jobLocation === LOCATION_KEY[loc] : true))
    .filter((j) => (type ? j.workType === WORK_TYPE[type] : true))
    .filter((j) => (q ? (j.jobTitle?.toLowerCase().includes(q.toLowerCase()) || j.employerName?.toLowerCase().includes(q.toLowerCase())) : true))
    .filter((j) => (employerFilter ? j.employerName?.toLowerCase().includes(employerFilter.toLowerCase()) : true))
    .filter((j) => (initialCisco ? j.sOccupation === initialCisco : true))
    .filter((j) => (skillCiscoCodes.size > 0 ? skillCiscoCodes.has(j.sOccupation) : true));

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 3) return (b.maximumAmount || 0) - (a.maximumAmount || 0);
    if (sort === 4) return (a.minimumAmount || 0) - (b.minimumAmount || 0);
    const aDate = a.approvalDate instanceof Date ? a.approvalDate : new Date(a.approvalDate || 0);
    const bDate = b.approvalDate instanceof Date ? b.approvalDate : new Date(b.approvalDate || 0);
    return bDate.getTime() - aDate.getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const cards = document.querySelectorAll(".job-card");
    if (!cards.length) return;
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" });
  }, [page, sort, q, loc, type]);

  const stats = {
    total: filtered.length,
    avgSalary: filtered.reduce((acc, j) => acc + (j.maximumAmount || j.minimumAmount || 0), 0) / Math.max(1, filtered.length),
    locations: new Set(filtered.map((j) => j.jobLocation)).size,
    industries: new Set(filtered.map((j) => j.occupation)).size,
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Live Job <span className="text-cyan-300">Market Search</span>
          </h1>
          <p className="text-neutral-300 text-lg max-w-3xl">
            Browse {stats.total} active job postings across {stats.industries}+ industries in Cayman. Real-time data from WORC.
          </p>
          {(initialQ || initialEmployer || initialCisco) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {initialQ && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30">Search: {initialQ}</Badge>}
              {initialCisco && <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">CISCO: {initialCisco}</Badge>}
              {initialEmployer && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30">Employer: {initialEmployer}</Badge>}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-cyan-400/15 grid place-items-center"><TrendingUp className="w-5 h-5 text-cyan-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{stats.total}</div><div className="text-xs md:text-sm text-neutral-400">Active Jobs</div></div></div></CardContent></Card>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-400/15 grid place-items-center"><Building2 className="w-5 h-5 text-emerald-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{stats.industries}+</div><div className="text-xs md:text-sm text-neutral-400">Industries</div></div></div></CardContent></Card>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-400/15 grid place-items-center"><MapPin className="w-5 h-5 text-purple-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{stats.locations}</div><div className="text-xs md:text-sm text-neutral-400">Locations</div></div></div></CardContent></Card>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-orange-400/15 grid place-items-center"><Calendar className="w-5 h-5 text-orange-300" /></div><div><div className="text-xl md:text-2xl font-semibold truncate">CI$ {Math.round(stats.avgSalary / 1000)}k</div><div className="text-xs md:text-sm text-neutral-400">Avg Salary</div></div></div></CardContent></Card>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by job title or employer..." className="pl-10 bg-white/5 border-white/10 h-12 text-base" />
            </div>
            {showFilters && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <select value={loc} onChange={(e) => { setLoc(Number(e.target.value)); setPage(1); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        {Object.entries(LOCATION_KEY).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Work Type</label>
                      <select value={type} onChange={(e) => { setType(Number(e.target.value)); setPage(1); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        {Object.entries(WORK_TYPE).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Employer</label>
                      <Input value={employerFilter} onChange={(e) => { setEmployerFilter(e.target.value); setPage(1); }} placeholder="Filter by employer..." className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <select value={sort} onChange={(e) => setSort(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        {Object.entries(SORT_KEY).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="secondary" onClick={() => { setQ(""); setLoc(0); setType(0); setEmployerFilter(""); setSort(1); setSelectedSkills([]); setPage(1); }} className="gap-2 w-full">
                        <Filter className="w-4 h-4" /> Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Skills Filter */}
                  <div className="pt-3 border-t border-white/10">
                    <label className="text-sm font-medium mb-2 block">Skills</label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search skills (e.g. compliance, accounting)"
                        className="pl-10 bg-white/5 border-white/10"
                      />
                    </div>
                    {skillSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skillSuggestions.map(s => (
                          <button key={s.id} onClick={() => addSkill(s)}>
                            <Badge className="bg-white/5 border-white/10 text-neutral-300 hover:border-purple-300/40 cursor-pointer">
                              <Plus className="w-3 h-3 mr-1" /> {s.name}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map(s => (
                          <Badge key={s.id} className="bg-purple-500/20 text-purple-300 border-purple-300/30 pr-1 flex items-center gap-1">
                            {s.name}
                            <button onClick={() => removeSkill(s.id)} className="ml-1 hover:text-red-400">
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
        <div className="mb-6 text-sm text-neutral-300">
          Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length} jobs
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {view.map((j, idx) => (
            <Card key={`${j.jobPostId || idx}`} className="job-card group bg-white/5 border-white/10 hover:border-white/20 transition h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="text-xs uppercase tracking-wide text-emerald-300 mb-2">{j.workType || "Role"}</div>
                <div className="font-medium leading-tight group-hover:text-white mb-2 line-clamp-2 min-h-[2.5rem] flex items-start">{j.jobTitle || "Untitled role"}</div>
                <div className="text-sm text-neutral-400 mb-2 line-clamp-1">
                  <Link href={`/employer/${encodeURIComponent(j.employerName?.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`} className="hover:text-cyan-300 transition">{j.employerName}</Link>
                </div>
                <div className="text-xs text-neutral-400 mb-3">{j.jobLocation || "Location"} · {j.hoursPerWeek ? `${j.hoursPerWeek} hrs/wk` : ""}</div>
                <div className="text-sm text-neutral-200 mb-4 line-clamp-2">{fmtSalary(j)}</div>
                <div className="flex flex-wrap gap-1 mb-4">
                  <Badge className="bg-neutral-800 border-white/10 text-neutral-300 text-xs px-2 py-1">{truncateText(j.educationLevel, 18)}</Badge>
                  <Badge className="bg-neutral-800 border-white/10 text-neutral-300 text-xs px-2 py-1">{truncateText(j.yearsOfExperience, 18)}</Badge>
                </div>
                <div className="text-xs text-neutral-500 mb-3">WORC ID: {j.jobPostIdString || j.jobPostId}</div>
                <div className="mt-auto">
                  <a href={generateWORCSearchURL({ cTitle: j.jobTitle, Employer: j.employerName })} target="_blank" rel="noreferrer" className="apply-link inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/15 w-full gap-2 h-10 px-4 py-2">
                    Apply on WORC
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-300">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>

        {sorted.length === 0 && (
          <Card className="bg-white/5 border-white/10 mt-8">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-neutral-400 mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => { setQ(""); setLoc(0); setType(0); setSelectedSkills([]); setPage(1); }}>Clear Filters</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
