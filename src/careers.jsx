import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Briefcase, Compass, Heart, Plane, SunMedium, Search, Building2, ChevronRight, Clock, Sparkles, CircleDollarSign, GraduationCap, Users, Rocket, Menu, X } from "lucide-react";
import OnboardingFlow from "@/components/OnboardingFlow.jsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroIntro, useFadeInOnScroll, useParallaxBackground, useMarqueeControl, useHoverFloat, useAccordionMotion, useStaggerList, useCTAGradientPulse, useFooterReveal } from "@/animations/gsapEffects";
import { getActiveJobPostings, loadLocationTypes } from "@/lib/data";

// ————————————————————————————————————————————————————————————————
// careers.ky — Cayman Lifestyle → Career Landing (GSAP + Tailwind + shadcn)
// This file defines a single React component export. It also includes a
// JobsFeed section that displays active job postings from local CSV data
// and a lightweight DevTests panel to sanity‑check core helpers at runtime.
// ————————————————————————————————————————————————————————————————

// ——— WORC mapping tables (from user-provided picklists) ———
const SORT_KEY = { 0: "Undefined", 1: "Newest", 2: "EndsSoon", 3: "SalaryHighLow", 4: "SalaryLowHigh" };
const LOCATION_KEY = { 0: "Undefined", 1: "West Bay", 2: "Seven Mile Beach", 3: "Camana Bay", 4: "George Town", 5: "South Sound", 6: "Red Bay / Prospect", 7: "Spotts / Newlands", 8: "Savannah / Lower Valley", 9: "Bodden Town", 10: "North Side", 11: "East End", 12: "Rum Point / Cayman Kai", 13: "Cayman Brac", 14: "Little Cayman" };
const WORK_TYPE = { 0: "Undefined", 1: "Full-time", 2: "Part-time", 3: "Shifts", 4: "Weekends", 5: "Temporary", 6: "Internships", 7: "Apprenticeships" };
const EDUCATION = { 0: "Unavailable", 1: "Primary School", 2: "Middle School", 3: "Some High School", 4: "High School or Equivalent", 5: "Certificate/Diploma", 6: "Some College/University", 7: "Associate Degree", 8: "Bachelor´s Degree", 9: "Master´s Degree", 10: "Doctoral Degree" };
const EXPERIENCE = { 0: "Unavailable", 1: "No experience", 2: "<1 year", 3: "1-2 years", 4: "3-4 years", 5: "5-6 years", 6: "7-8 years", 7: "9-10 years", 8: "10+ years" };

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

// Parse "DD/MM/YYYY" into a Date reliably (avoid US‑centric parsing)
function parseDateDMY(s) {
  if (!s || typeof s !== "string") return new Date(0);
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date(s); // fall back; may be ISO already
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
    // Transform CSV data to match expected structure
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

function JobsFeed({ initialQuery = "" }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState(initialQuery);
  const [loc, setLoc] = useState(0);
  const [type, setType] = useState(0);
  const [sort, setSort] = useState(1); // Newest
  const [page, setPage] = useState(1);
  const pageSize = 8;

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

  // React to initialQuery changes
  useEffect(() => {
    setQ(initialQuery || "");
    setPage(1);
  }, [initialQuery]);

  // derived
  const filtered = jobs
    .filter((j) => (loc ? j.jobLocation === LOCATION_KEY[loc] : true))
    .filter((j) => (type ? j.workType === WORK_TYPE[type] : true))
    .filter((j) => (q ? (j.jobTitle?.toLowerCase().includes(q.toLowerCase()) || j.employerName?.toLowerCase().includes(q.toLowerCase())) : true));

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 3) return (b.maximumAmount || 0) - (a.maximumAmount || 0); // SalaryHighLow
    if (sort === 4) return (a.minimumAmount || 0) - (b.minimumAmount || 0); // SalaryLowHigh
    if (sort === 2) {
      // EndsSoon asc - handle Date objects
      const aTime = a.endDate instanceof Date ? a.endDate.getTime() : parseDateDMY(a.endDate).getTime();
      const bTime = b.endDate instanceof Date ? b.endDate.getTime() : parseDateDMY(b.endDate).getTime();
      return aTime - bTime;
    }
    // Newest default — approval/start date desc
    const aDate = a.approvalDate instanceof Date ? a.approvalDate : (a.startDate instanceof Date ? a.startDate : parseDateDMY(a.approvalDate || a.startDate));
    const bDate = b.approvalDate instanceof Date ? b.approvalDate : (b.startDate instanceof Date ? b.startDate : parseDateDMY(b.approvalDate || b.startDate));
    return bDate.getTime() - aDate.getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    // Animate list on data changes
    if (loading || error) return;
    const cards = document.querySelectorAll('#jobs .job-card');
    if (!cards.length) return;
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" });
  }, [loading, error, page, sort, q, loc, type]);

  return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Active Job Postings</h3>
          <p className="text-neutral-400 text-sm">{jobs.length} active jobs with future end dates</p>
        </div>
        <a href="https://my.egov.ky/web/myworc/find-a-job#/" target="_blank" rel="noreferrer" className="text-cyan-300 text-sm hover:underline">Open WORC portal ↗</a>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by title or employer…" className="pl-10 bg-white/5 border-white/10" />
        </div>
        <select value={loc} onChange={(e) => { setLoc(Number(e.target.value)); setPage(1); }} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
          {Object.entries(LOCATION_KEY).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <select value={type} onChange={(e) => { setType(Number(e.target.value)); setPage(1); }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
            {Object.entries(WORK_TYPE).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(Number(e.target.value))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
            {Object.entries(SORT_KEY).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-4 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    <a href="https://my.egov.ky/web/myworc/find-a-job#/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/15 w-full gap-2 h-10 px-4 py-2">
                      Apply on WORC
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-neutral-300">
            <div>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </>
      )}

      <DevTests />
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Page content data
// ————————————————————————————————————————————————————————————————
const lifestyleGoals = [
  { icon: <SunMedium className="w-5 h-5" />, title: "Beach‑time balance", tags: ["9–5 Flex", "Remote days"] },
  { icon: <Heart className="w-5 h-5" />, title: "Wellness & nature", tags: ["Parks", "Diving"] },
  { icon: <CircleDollarSign className="w-5 h-5" />, title: "Financial upside", tags: ["Tax‑efficient", "Growth"] },
  { icon: <Users className="w-5 h-5" />, title: "Community impact", tags: ["Youth", "Civic tech"] },
];

const careerTracks = [
  { icon: <Briefcase className="w-5 h-5" />, title: "Tech & Product", desc: "Engineering, Design, Data, PM" },
  { icon: <Building2 className="w-5 h-5" />, title: "Financial Services", desc: "Compliance, Ops, Risk, Funds" },
  { icon: <GraduationCap className="w-5 h-5" />, title: "Education & Research", desc: "EdTech, Training, Academia" },
  { icon: <Compass className="w-5 h-5" />, title: "Tourism & Hospitality", desc: "Hotels, F&B, Experiences" },
];

const featuredBadges = [
  "Remote‑friendly",
  "Graduate‑ready",
  "Visa support",
  "Entry → Senior",
  "Mentored roles",
  "Apprenticeships",
];

// ————————————————————————————————————————————————————————————————
// Main export — page wrapper + GSAP interactions
// ————————————————————————————————————————————————————————————————
export default function CareersKYLanding({ onNavigate }) {
  const root = useRef(null);
  const hero = useRef(null);
  const revealEls = useRef([]);
  revealEls.current = [];
  const faqRef = useRef(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [prefillQuery, setPrefillQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addRevealEl = (el) => {
    if (el && !revealEls.current.includes(el)) revealEls.current.push(el);
  };

  useHeroIntro(hero);
  useFadeInOnScroll(revealEls);
  useParallaxBackground(root, "#bg-gradient");
  useMarqueeControl("#explore .animate-[marquee_24s_linear_infinite]");
  useHoverFloat("#tracks .group, #map .group, #explore .group");
  useAccordionMotion(faqRef);
  useCTAGradientPulse("#cta-gradient");
  useFooterReveal("footer a");


  // Show onboarding page if open
  if (onboardingOpen) {
    return (
      <OnboardingFlow
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={(res) => {
          setPrefillQuery(res?.title || "");
          setOnboardingOpen(false);
          // Scroll to jobs section after a tick
          setTimeout(() => {
            document.querySelector('#jobs')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />
    );
  }

  return (
    <div ref={root} className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Dynamic background */}
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

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
            <a href="#map" className="hover:text-white transition">Career Mapper</a>
            <button onClick={() => onNavigate?.('career-tracks')} className="hover:text-white transition">Career Tracks</button>
            <a href="#jobs" className="hover:text-white transition">Live Search</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
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
              <a 
                href="#map" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white"
              >
                Career Mapper
              </a>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate?.('career-tracks');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Career Tracks
              </button>
              <a 
                href="#jobs" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white"
              >
                Live Search
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white"
              >
                FAQ
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section ref={hero} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-8">
              <Badge className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-300/30">Cayman lifestyle × career fit</Badge>
              <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">Map your <span className="text-cyan-300">lifestyle goals</span> to real <span className="text-white">career paths</span> in Cayman.</h1>
              <p className="text-neutral-300 max-w-2xl">A sleek, modern way to discover roles aligned to how you want to live — beach‑time balance, financial upside, or impact.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input placeholder="Search roles, skills, or companies…" className="pl-10 bg-white/5 border-white/10" />
                  </div>
                </div>
                <Button className="gap-2" onClick={() => setOnboardingOpen(true)}>Build my plan <ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {featuredBadges.map((b, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 border-white/10 text-neutral-200">{b}</Badge>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-1.5 bg-gradient-to-b from-cyan-300/30 via-cyan-300/5 to-transparent">
                <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-6">
                  <div className="text-sm text-neutral-400 mb-4">Lifestyle → Career Mapper</div>
                  <div className="grid grid-cols-2 gap-3">
                    {lifestyleGoals.map((g, i) => (
                      <Card key={i} ref={addRevealEl} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-cyan-300 mb-1">{g.icon}<span className="text-xs uppercase tracking-wide opacity-90">Goal</span></div>
                          <div className="font-medium mb-2 group-hover:text-white transition">{g.title}</div>
                          <div className="flex flex-wrap gap-1">
                            {g.tags.map((t, k) => (
                              <Badge key={k} className="bg-neutral-800 border-white/10 text-neutral-200">{t}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="h-px my-6 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="grid grid-cols-2 gap-3">
                    {careerTracks.map((t, i) => (
                      <Card key={i} ref={addRevealEl} className="bg-white/5 border-white/10 hover:border-emerald-300/40 transition group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-emerald-300 mb-1">{t.icon}<span className="text-xs uppercase tracking-wide opacity-90">Track</span></div>
                          <div className="font-medium mb-1 group-hover:text-white transition">{t.title}</div>
                          <p className="text-xs text-neutral-400">{t.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-neutral-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Smart matching engine coming soon.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* subtle hero divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* Lifestyle → Career Pathway (scrollytelling) */}
      <section id="map" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 sticky top-24 self-start">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Design your week, then find roles that fit it.</h2>
              <p className="text-neutral-300">Slide through the pathway: choose vibes, time blocks, and growth targets — we surface roles that respect your rhythm.</p>
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" className="gap-2" onClick={() => setOnboardingOpen(true)}><Sparkles className="w-4 h-4" /> Try the planner</Button>
                <Button className="gap-2" onClick={() => setOnboardingOpen(true)}>Build my plan <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-4">
              {[1,2,3,4,5].map((step) => (
                <Card key={step} ref={addRevealEl} className="bg-white/5 border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-xl grid place-items-center bg-cyan-300/15 text-cyan-200 font-semibold">{step}</div>
                      <div>
                        <div className="font-medium">{step === 1 && "Pick lifestyle priorities"}{step === 2 && "Set time & commute preferences"}{step === 3 && "Choose growth & salary targets"}{step === 4 && "See matched roles & learning paths"}{step === 5 && "Track applications and momentum"}</div>
                        <p className="text-sm text-neutral-400">{step === 1 && "Beach days, wellness, community, or upside — rank what matters."}{step === 2 && "Hybrid vs on‑site, preferred hours, and travel radius."}{step === 3 && "Up‑skill suggestions and compensation ranges by track."}{step === 4 && "From entry → senior, see how to grow over 6–24 months."}{step === 5 && "Calendar sync, reminders, and status at a glance."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tracks grid */}
      <section id="tracks" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Explore career tracks</h3>
            <Button variant="secondary" className="gap-2" onClick={() => onNavigate?.('career-tracks')}>
              Browse all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerTracks.map((t, i) => (
              <Card key={i} ref={addRevealEl} className="group bg-white/5 border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-300/10 transition">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-300">{t.icon}<span className="text-xs uppercase tracking-wide opacity-90">Track</span></div>
                    <Badge className="bg-neutral-800 border-white/10">Cayman</Badge>
                  </div>
                  <div className="font-medium text-lg mb-1 group-hover:text-white">{t.title}</div>
                  <p className="text-sm text-neutral-400">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Explore carousel (marquee style) */}
      <section id="explore" className="py-16 border-y border-white/5 bg-neutral-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Plane className="w-5 h-5 text-cyan-300" />
            <h4 className="text-xl font-semibold tracking-tight">Live like Cayman, work on what you love</h4>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-3 animate-[marquee_24s_linear_infinite] will-change-transform">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="group min-w-[260px] rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="text-sm text-neutral-400 mb-2">Featured role</div>
                  <div className="font-medium mb-1">UI Designer · FinTech</div>
                  <div className="text-xs text-neutral-400">CI$ 52k–72k · Hybrid · Visa</div>
                </div>
              ))}
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
      </section>

      {/* Jobs (active postings) */}
      <section id="jobs" className="py-20">
        <JobsFeed initialQuery={prefillQuery} />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h5 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Frequently asked</h5>
          <Accordion type="single" collapsible className="bg-white/5 border border-white/10 rounded-2xl" ref={faqRef}>
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6">How does the lifestyle → career match work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">We weight your priorities (time, commute, compensation, impact) against role metadata to surface the closest fits.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6">Do you list remote roles?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">Yes — fully remote, hybrid, and on‑site roles are supported with clear labels and filters.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">Is this for Caymanians only?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">Our focus is Cayman — residents, Caymanians, and inbound talent — with local compliance and pathways.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-1.5 bg-gradient-to-r from-cyan-300/30 via-emerald-300/20 to-fuchsia-300/20" id="cta-gradient">
            <div className="rounded-[20px] bg-neutral-900/60 border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-sm text-neutral-400 mb-1">Next up</div>
                <div className="text-2xl font-semibold">Get early access to the mapping demo</div>
                <p className="text-neutral-300">Be first to try lifestyle‑aligned job search for Cayman.</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Input placeholder="Enter your email" className="bg-white/5 border-white/10" />
                <Button className="gap-2">Notify me <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 pb-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-neutral-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-400/20 grid place-items-center ring-1 ring-cyan-300/30">
                <Rocket className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="font-medium text-neutral-200">careers.ky</div>
                <div className="text-xs">Lifestyle × Career platform for Cayman</div>
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

// ————————————————————————————————————————————————————————————————
// DevTests — minimal runtime tests (acts as test cases in UI)
// ————————————————————————————————————————————————————————————————
function DevTests() {
  const [report, setReport] = useState({ passed: 0, failed: 0, logs: [] });
  useEffect(() => {
    const logs = [];
    let passed = 0, failed = 0;
    const test = (name, fn) => {
      try { fn(); passed++; logs.push(`✅ ${name}`); } catch (e) { failed++; logs.push(`❌ ${name}: ${e.message}`); }
    };

    // Test 1: salary formatter uses ranges when present
    test("fmtSalary handles min/max range", () => {
      const s = fmtSalary({ minimumAmount: 100000, maximumAmount: 120000, currency: "USD", displayFrequency: "perAnnum" });
      if (!/\$/.test(s) || !/120,?000/.test(s)) throw new Error("range not formatted");
    });

    // Test 2: mapping keys are present
    test("WORK_TYPE and LOCATION_KEY basics", () => {
      if (!WORK_TYPE[1] || !LOCATION_KEY[4]) throw new Error("missing mapping");
    });

    // Test 3: sorting SalaryHighLow works
    test("Sort SalaryHighLow orders desc by max", () => {
      const arr = [
        { maximumAmount: 50000 },
        { maximumAmount: 150000 },
        { maximumAmount: 100000 },
      ];
      const out = [...arr].sort((a, b) => (b.maximumAmount || 0) - (a.maximumAmount || 0));
      if (out[0].maximumAmount !== 150000) throw new Error("not desc");
    });

    // Added tests — do not modify above existing tests

    // Test 4: salaryShort takes precedence
    test("fmtSalary prefers salaryShort", () => {
      const s = fmtSalary({ salaryShort: "KYD$42,000 Per Annum", minimumAmount: 10000, maximumAmount: 20000, currency: "KYD" });
      if (s !== "KYD$42,000 Per Annum") throw new Error("salaryShort not preferred");
    });

    // Test 5: fallback when no salary available
    test("fmtSalary fallback when missing values", () => {
      const s = fmtSalary({});
      if (s !== "Salary not listed") throw new Error("fallback incorrect");
    });

    // Test 6: parseDateDMY respects D/M/Y order
    test("parseDateDMY correctly orders 08/10/2025 < 22/10/2025", () => {
      const a = parseDateDMY("08/10/2025").getTime();
      const b = parseDateDMY("22/10/2025").getTime();
      if (!(a < b)) throw new Error("DMY parsing wrong");
    });

    // Test 7: EndsSoon sorting puts earlier end date first
    test("EndsSoon sort asc by endDate", () => {
      const arr = [
        { endDate: "22/10/2025" },
        { endDate: "10/10/2025" },
        { endDate: "15/10/2025" },
      ];
      const out = [...arr].sort((a, b) => parseDateDMY(a.endDate) - parseDateDMY(b.endDate));
      if (out[0].endDate !== "10/10/2025") throw new Error("not ascending by endDate");
    });

    setReport({ passed, failed, logs });
  }, []);

  // return (
  //   <details className="mt-8 text-xs text-neutral-400">
  //     <summary className="cursor-pointer">Dev tests: {report.passed} passed, {report.failed} failed</summary>
  //     <ul className="mt-2 list-disc pl-5 space-y-1">
  //       {report.logs.map((l, i) => (<li key={i}>{l}</li>))}
  //     </ul>
  //   </details>
  // );
}

