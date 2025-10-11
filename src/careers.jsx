import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { getActiveJobPostings, loadLocationTypes, buildCiscoTree, loadAggregates } from "@/lib/data";

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


// ————————————————————————————————————————————————————————————————
// Page content data
// ————————————————————————————————————————————————————————————————
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
  const [jobs, setJobs] = useState([]);

  const addRevealEl = (el) => {
    if (el && !revealEls.current.includes(el)) revealEls.current.push(el);
  };

  // Load career data
  const careerTree = useMemo(() => {
    try {
      return buildCiscoTree();
    } catch (error) {
      console.error('Error building career tree:', error);
      return { id: "root", title: "Occupations", children: [] };
    }
  }, []);

  const aggregates = useMemo(() => loadAggregates(), []);

  // Get major categories with stats
  const careerTracks = useMemo(() => {
    const majors = careerTree.children || [];
    return majors.slice(0, 8).map((major) => {
      // Calculate total jobs in this major category
      let totalJobs = 0;
      let avgSalary = 0;
      let salaryCount = 0;

      const countJobs = (node) => {
        if (node.children) {
          node.children.forEach(child => {
            if (child.id && child.id.length === 4) {
              // This is a CISCO unit
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
      const finalAvgSalary = salaryCount > 0 ? Math.round(avgSalary / salaryCount) : 0;

      return {
        id: major.id,
        title: major.title,
        description: major.description || `${major.children?.length || 0} subcategories`,
        jobCount: totalJobs,
        avgSalary: finalAvgSalary,
        subcategories: major.children?.length || 0
      };
    });
  }, [careerTree, aggregates]);

  // Load jobs for stats display
  useEffect(() => {
    try {
      const activeJobs = loadActiveJobs();
      setJobs(activeJobs);
    } catch (e) {
      console.error("Error loading jobs:", e);
    }
  }, []);

  useHeroIntro(hero);
  useFadeInOnScroll(revealEls);
  useParallaxBackground(root, "#bg-gradient");
  useMarqueeControl("#tracks .animate-[marquee_24s_linear_infinite]");
  useHoverFloat("#tracks .group, #map .group, #jobs .group");
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
            <div className="h-8 w-8">
              <img 
                src="/src/images/logo-careers.png" 
                alt="careers.ky logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold tracking-tight">careers<span className="text-cyan-300">.ky</span></span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <a href="#map" className="hover:text-white transition">Career Mapper</a>
            <button onClick={() => onNavigate?.('career-tracks')} className="hover:text-white transition">Career Tracks</button>
            <button onClick={() => onNavigate?.('live-search')} className="hover:text-white transition">Live Search</button>
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate?.('live-search');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Live Search
              </button>
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <Badge className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-300/30">Live Job Market Data</Badge>
              <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                <span className="text-cyan-300">Real-time insights</span> into Cayman's <span className="text-white">job market</span>.
              </h1>
              <p className="text-neutral-300 text-base md:text-lg max-w-2xl">
                Access live job postings, salary data, industry trends, and career planning tools.
                Built with real WORC data to help Caymanians make informed career decisions.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-cyan-400/15 grid place-items-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Career Mapper</div>
                    <div className="text-xs text-neutral-400">Match your lifestyle to careers</div>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate?.('career-tracks')}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-400/15 grid place-items-center flex-shrink-0">
                    <Compass className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Career Tracks</div>
                    <div className="text-xs text-neutral-400">Explore by industry & salary</div>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate?.('live-search')}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-400/15 grid place-items-center flex-shrink-0">
                    <Search className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Live Search</div>
                    <div className="text-xs text-neutral-400">Browse active job postings</div>
                  </div>
                </button>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 h-12 text-base" onClick={() => setOnboardingOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  Start Career Mapper
                </Button>
                <Button size="lg" variant="secondary" className="gap-2 h-12 text-base" onClick={() => onNavigate?.('live-search')}>
                  <Search className="w-4 h-4" />
                  Browse Jobs
                </Button>
              </div>

              {/* <div className="flex flex-wrap gap-2">
                {featuredBadges.map((b, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 border-white/10 text-neutral-200 text-xs">{b}</Badge>
                ))}
              </div> */}
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-1.5 bg-gradient-to-b from-cyan-300/30 via-cyan-300/5 to-transparent">
                <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4 md:p-6">
                  <div className="text-sm text-neutral-400 mb-4">Market Snapshot</div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl font-semibold text-cyan-300 mb-1">{jobs.length}</div>
                      <div className="text-xs text-neutral-400">Active Jobs</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl font-semibold text-emerald-300 mb-1">{new Set(jobs.map(j => j.occupation)).size}+</div>
                      <div className="text-xs text-neutral-400">Industries</div>
                    </div>
                  </div>

                  <div className="h-px my-4 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  {/* Quick Links to Tools */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setOnboardingOpen(true)}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-cyan-300 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Tool</span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">Career Mapper</div>
                      <p className="text-xs text-neutral-400">Lifestyle-first career matching</p>
                    </button>

                    <button
                      onClick={() => onNavigate?.('career-tracks')}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-emerald-300 mb-1">
                        <Compass className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Data</span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">Career Tracks</div>
                      <p className="text-xs text-neutral-400">Industry insights & salary ranges</p>
                    </button>

                    <button
                      onClick={() => onNavigate?.('live-search')}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-purple-300 mb-1">
                        <Search className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Search</span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">Live Job Search</div>
                      <p className="text-xs text-neutral-400">Browse & filter active postings</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* subtle hero divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* Lifestyle → Career Pathway (scrollytelling) */}
      {/* <section id="map" className="relative py-20">
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
      </section> */}

      {/* Tracks grid */}
      <section id="tracks" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Explore career tracks</h3>
              <p className="text-neutral-400 text-sm mt-2">Browse by industry category with live market data</p>
            </div>
            <Button variant="secondary" className="gap-2" onClick={() => onNavigate?.('career-tracks')}>
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerTracks.map((track) => (
              <Card 
                key={track.id} 
                ref={addRevealEl} 
                className="group bg-white/5 border-white/10 hover:border-cyan-300/40 hover:shadow-2xl hover:shadow-cyan-300/10 transition cursor-pointer"
                onClick={() => onNavigate?.('career-tracks')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30 text-xs">
                      {track.id}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-cyan-300 transition" />
                  </div>
                  <div className="font-semibold text-base mb-2 group-hover:text-cyan-300 transition line-clamp-2 min-h-[2.5rem]">
                    {track.title}
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">{track.subcategories} specializations</p>
                  
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Active Jobs</span>
                      <span className="font-semibold text-emerald-300">{track.jobCount}</span>
                    </div>
                    {track.avgSalary > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Avg. Salary</span>
                        <span className="font-semibold text-cyan-300">CI$ {track.avgSalary.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Job carousel under tracks grid */}
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Plane className="w-5 h-5 text-cyan-300" />
              <h4 className="text-xl font-semibold tracking-tight">Work on what you love.</h4>
            </div>
            <div className="overflow-hidden">
              <div className="flex gap-3 animate-[marquee_24s_linear_infinite] will-change-transform">
                {Array.from({ length: 2 }).map((_, duplicateIndex) => 
                  jobs.slice(0, Math.min(8, jobs.length)).map((job, i) => (
                    <div key={`${duplicateIndex}-${i}`} className="group min-w-[260px] rounded-2xl p-4 bg-white/10 border border-white/20 backdrop-blur-sm">
                      <div className="text-sm text-neutral-300 mb-2">Live posting</div>
                      <div className="font-medium mb-1 text-white">{truncateText(job.jobTitle, 25)}</div>
                      <div className="text-xs text-neutral-300">
                        {fmtSalary(job)} · {WORK_TYPE[job.workType] || job.workType}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs CTA Section */}
      <section id="jobs" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-cyan-500/15 via-emerald-500/15 to-purple-500/15 border-white/20 backdrop-blur-md shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Ready to explore <span className="text-cyan-300">{jobs.length}+ active jobs</span>?
              </h3>
              <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto">
                Browse real-time job postings from WORC, filter by location, salary, and industry.
                Find your next opportunity in Cayman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2" onClick={() => onNavigate?.('live-search')}>
                  <Search className="w-4 h-4" />
                  Browse All Jobs
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" onClick={() => setOnboardingOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  Get Personalized Matches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h5 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Frequently asked</h5>
          <Accordion type="single" collapsible className="bg-white/5 border border-white/10 rounded-2xl" ref={faqRef}>
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6">What is careers.ky?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is a comprehensive job market platform for the Cayman Islands, providing real-time insights into active job postings, salary data, and industry trends. We pull live data from WORC (Workforce Opportunities & Residency Cayman) to help you make informed career decisions with three powerful tools: Career Mapper for lifestyle-first job matching, Career Tracks for exploring industries and salary ranges, and Live Search for browsing all active postings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6">Where does your job data come from?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                All job postings, salary information, and market data are sourced directly from WORC (my.egov.ky), the official government portal for job opportunities in the Cayman Islands. Our data is regularly updated to ensure you have access to the most current job market information available.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">How does the Career Mapper work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Career Mapper is our lifestyle-first job matching tool. It asks you about your priorities—like work-life balance, commute preferences, salary expectations, and personal interests—then matches you with career paths and job opportunities that align with your lifestyle goals, not just your skills. It's designed to help you find work that fits your life, not the other way around.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6">What's the difference between Career Tracks and Live Search?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Career Tracks lets you explore the job market by industry category, showing you aggregated data like average salaries, number of active jobs, and career pathways within each sector. It's perfect for researching industries and planning your career direction. Live Search, on the other hand, is a real-time job board where you can browse, filter, and search through all active job postings with detailed information about each role.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6">Can I apply to jobs directly through careers.ky?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is a job discovery and research platform. When you find a position you're interested in, we'll direct you to the official WORC portal or the employer's application page where you can submit your application. We help you discover opportunities and make informed decisions, but applications are processed through the official channels.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="px-6">Who can use this platform?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is designed for anyone interested in working in the Cayman Islands—Caymanians, residents, and international talent exploring opportunities. Whether you're a student planning your career path, a professional considering a career change, or someone relocating to Cayman, our platform provides valuable insights into the local job market.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="px-6">How often is the job data updated?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Our job listings are synced regularly with the WORC database to ensure you're seeing current, active postings. The job counts, salary statistics, and industry trends you see on the platform reflect the latest available data from official government sources.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger className="px-6">What types of jobs are listed? Are remote roles available?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                We list all types of employment opportunities available through WORC, including full-time, part-time, temporary positions, internships, and apprenticeships. Job types range from entry-level to senior positions across all major industries in the Cayman Islands. Each job posting clearly indicates the work arrangement, location requirements, and whether remote or hybrid options are available.
              </AccordionContent>
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
              <div className="h-8 w-8">
                <img 
                  src="/src/images/logo-careers.png" 
                  alt="careers.ky logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-medium text-neutral-200">careers.ky</div>
                <div className="text-xs">Live Job Market Data for Caymanians</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6">
              <button onClick={() => onNavigate?.('career-tracks')} className="hover:text-neutral-200">Career Tracks</button>
              <button onClick={() => onNavigate?.('live-search')} className="hover:text-neutral-200">Live Search</button>
              <a href="#faq" className="hover:text-neutral-200">FAQ</a>
              <a href="https://my.egov.ky/web/myworc/find-a-job#/" target="_blank" rel="noreferrer" className="hover:text-neutral-200">WORC Portal ↗</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-xs text-center md:text-left">
            <p>Built with real WORC data. Job postings updated regularly from official government sources.</p>
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

