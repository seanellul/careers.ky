"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Briefcase,
  Compass,
  Plane,
  Search,
  ChevronRight,
  Sparkles,
  Users,
  Building2,
  User,
  CheckCircle2,
} from "lucide-react";
import OnboardingFlow from "@/components/OnboardingFlow";
import AuthModal from "@/components/AuthModal";
import t from "@/lib/theme";
import {
  useHeroIntro,
  useFadeInOnScroll,
  useParallaxBackground,
  useMarqueeControl,
  useHoverFloat,
  useAccordionMotion,
  useCTAGradientPulse,
  useFooterReveal,
} from "@/animations/gsapEffects";

const WORK_TYPE = {
  0: "Undefined",
  1: "Full-time",
  2: "Part-time",
  3: "Shifts",
  4: "Weekends",
  5: "Temporary",
  6: "Internships",
  7: "Apprenticeships",
};

function fmtSalary(job) {
  const cur = job?.currency || "KYD";
  const fmt = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: cur,
          maximumFractionDigits: 0,
        }).format(n)
      : null;
  if (job?.salaryShort) return job.salaryShort;
  if (job?.minimumAmount && job?.maximumAmount)
    return `${fmt(job.minimumAmount)} - ${fmt(job.maximumAmount)}`;
  return "Salary not listed";
}

function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export default function HomeClient({
  careerTracks,
  jobs,
  jobCount,
  industryCount,
  employerCount,
  authRequired,
}) {
  const router = useRouter();
  const root = useRef(null);
  const hero = useRef(null);
  const revealEls = useRef([]);
  revealEls.current = [];
  const faqRef = useRef(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-open auth modal when redirected here from a gated route
  useEffect(() => {
    if (authRequired) {
      setAuthModalOpen(true);
    }
  }, [authRequired]);

  const addRevealEl = (el) => {
    if (el && !revealEls.current.includes(el)) revealEls.current.push(el);
  };

  useHeroIntro(hero);
  useFadeInOnScroll(revealEls);
  useParallaxBackground(root, "#bg-gradient");
  useMarqueeControl("#tracks .animate-[marquee_24s_linear_infinite]");
  useHoverFloat("#tracks .group, #map .group, #jobs .group");
  useAccordionMotion(faqRef);
  useCTAGradientPulse("#cta-gradient");
  useFooterReveal("footer a");

  const handleOnboardingComplete = (res) => {
    setOnboardingOpen(false);
    if (res?.targetPage === "live-search") {
      const params = new URLSearchParams();
      params.set("tab", "jobs");
      if (res.searchQuery) params.set("q", res.searchQuery);
      if (res.ciscoCode) params.set("cisco", res.ciscoCode);
      router.push(`/careers?${params.toString()}`);
    } else if (res?.targetPage === "career-tracks") {
      const params = new URLSearchParams();
      params.set("tab", "career-tracks");
      if (res.searchQuery) params.set("q", res.searchQuery);
      if (res.ciscoCode) params.set("cisco", res.ciscoCode);
      router.push(`/careers?${params.toString()}`);
    }
  };

  if (onboardingOpen) {
    return (
      <OnboardingFlow
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <>
    <AuthModal
      open={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      type="candidate"
      redirectTo="/profile/setup"
    />
    <div ref={root} className={`${t.page} w-full`}>
      {/* Dynamic background */}
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={t.pageGradientStyle}
      />

      {/* Hero */}
      <section ref={hero} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <Badge className="w-fit bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">
                A Caymanian-First Careers Platform
              </Badge>
              <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                <span className="text-primary-500">A Caymanian-First</span>{" "}
                Careers <span className="text-neutral-900 dark:text-neutral-100">Platform.</span>
              </h1>
              <p className="text-neutral-700 dark:text-neutral-300 text-lg md:text-xl max-w-2xl font-medium">
                Making hiring talent visible, accessible and fair.
              </p>
              <div className="space-y-2 text-neutral-600 dark:text-neutral-400 text-base md:text-lg max-w-2xl">
                <p>
                  <span className="text-primary-500 font-medium">For candidates:</span>{" "}
                  Every Caymanian deserves a fair shot at every role. Create your profile free. Get matched. Get hired.
                </p>
                <p>
                  <span className="text-emerald-600 font-medium">For employers:</span>{" "}
                  Find Caymanian talent directly. Direct connections with your community. Save money. One platform. One monthly fee.
                </p>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-primary-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left w-full"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-500/15 grid place-items-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Create Profile</div>
                    <div className="text-xs text-neutral-500">
                      Get seen by every employer
                    </div>
                  </div>
                </button>
                <Link
                  href="/careers?tab=career-tracks"
                  href="/careers?tab=career-tracks"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-emerald-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 grid place-items-center flex-shrink-0">
                    <Compass className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Career Tracks</div>
                    <div className="text-xs text-neutral-500">
                      Explore by industry & salary
                    </div>
                  </div>
                </Link>
                <Link
                  href="/careers"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-purple-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-50 grid place-items-center flex-shrink-0">
                    <Search className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Live Search</div>
                    <div className="text-xs text-neutral-500">
                      Browse active job postings
                    </div>
                  </div>
                </Link>
                <Link
                  href="/talent"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-orange-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-orange-50 grid place-items-center flex-shrink-0">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Find Talent</div>
                    <div className="text-xs text-neutral-500">
                      Search local talent pool
                    </div>
                  </div>
                </Link>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="gap-2 h-12 text-base"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <User className="w-4 h-4" />
                  Create Your Free Profile
                </Button>
                <Link href="/careers">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 h-12 text-base w-full"
                  >
                    <Search className="w-4 h-4" />
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-1.5 bg-gradient-to-b from-primary-200 via-primary-50 to-transparent dark:from-primary-500/20 dark:via-primary-500/5 dark:to-transparent">
                <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 p-4 md:p-6">
                  <div className="text-sm text-neutral-500 mb-4">
                    Market Snapshot
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-semibold text-primary-500 mb-1">
                        {jobCount}
                      </div>
                      <div className="text-xs text-neutral-500">Active Jobs</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-semibold text-emerald-600 mb-1">
                        {industryCount}+
                      </div>
                      <div className="text-xs text-neutral-500">Industries</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-semibold text-orange-600 mb-1">
                        {employerCount > 0 ? employerCount.toLocaleString() : "—"}
                      </div>
                      <div className="text-xs text-neutral-500">Employers</div>
                    </div>
                  </div>

                  <div className="h-px my-4 bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                  {/* Quick Links to Tools */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="block w-full text-left p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-primary-300 transition group"
                    >
                      <div className="flex items-center gap-2 text-primary-500 mb-1">
                        <User className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Candidates
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition">
                        Create Your Profile
                      </div>
                      <p className="text-xs text-neutral-500">
                        Get seen by every employer on the island
                      </p>
                    </button>

                    <Link
                      href="/careers?tab=career-tracks"
                      className="block w-full text-left p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-emerald-300 transition group"
                    >
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <Compass className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Explore
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition">
                        Career Tracks
                      </div>
                      <p className="text-xs text-neutral-500">
                        Industry insights & salary ranges
                      </p>
                    </Link>

                    <Link
                      href="/careers"
                      className="block w-full text-left p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-purple-300 transition group"
                    >
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Search className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Search
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition">
                        Live Job Search
                      </div>
                      <p className="text-xs text-neutral-500">
                        Browse & filter active postings
                      </p>
                    </Link>

                    <Link
                      href="/talent"
                      className="block w-full text-left p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm hover:border-orange-300 transition group"
                    >
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Employer
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition">
                        Search Local Talent
                      </div>
                      <p className="text-xs text-neutral-500">
                        Find Caymanian candidates directly
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
      </section>

      {/* Tracks grid */}
      <section id="tracks" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Explore career tracks
              </h3>
              <p className="text-neutral-500 text-sm mt-2">
                Browse by industry category with live market data
              </p>
            </div>
            <Link href="/careers?tab=career-tracks">
              <Button variant="secondary" className="gap-2">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerTracks.map((track) => (
              <Link key={track.id} href="/careers?tab=career-tracks">
                <Card
                  ref={addRevealEl}
                  className="group bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-200/20 transition cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 text-xs"
                      >
                        {track.id}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-primary-500 transition" />
                    </div>
                    <div className="font-semibold text-base mb-2 group-hover:text-primary-500 transition line-clamp-2 min-h-[2.5rem]">
                      {track.title}
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      {track.subcategories} specializations
                    </p>

                    <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Active Jobs</span>
                        <span className="font-semibold text-emerald-600">
                          {track.jobCount}
                        </span>
                      </div>
                      {track.avgSalary > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Avg. Salary</span>
                          <span className="font-semibold text-primary-500">
                            CI$ {track.avgSalary.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Job carousel */}
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Plane className="w-5 h-5 text-primary-500" />
              <h4 className="text-xl font-semibold tracking-tight">
                Work on what you love.
              </h4>
            </div>
            <div className="overflow-hidden">
              <div className="flex gap-3 animate-[marquee_24s_linear_infinite] will-change-transform">
                {Array.from({ length: 2 }).map((_, duplicateIndex) =>
                  jobs
                    .slice(0, Math.min(8, jobs.length))
                    .map((job, i) => (
                      <Link
                        key={`${duplicateIndex}-${i}`}
                        href={`/jobs/${job.jobPostId || job.jobPostIdString}`}
                        className="group min-w-[220px] sm:min-w-[260px] rounded-2xl p-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 backdrop-blur-sm hover:border-primary-300 transition"
                      >
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          Live posting
                        </div>
                        <div className="font-medium mb-1 text-white group-hover:text-primary-500 transition">
                          {truncateText(job.jobTitle, 25)}
                        </div>
                        {job.employerName && (
                          <div className="text-xs text-neutral-500 mb-1">
                            {truncateText(job.employerName, 25)}
                          </div>
                        )}
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          {fmtSalary(job)} ·{" "}
                          {WORK_TYPE[job.workType] || job.workType}
                        </div>
                      </Link>
                    ))
                )}
              </div>
              <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
            </div>
          </div>
        </div>
      </section>

      {/* For Candidates + For Employers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Candidates */}
            <div ref={addRevealEl} className="rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm p-8">
              <div className="flex items-center gap-2 text-primary-500 mb-4">
                <User className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide font-medium">For Candidates</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Connect with your community. Get the right role.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                You shouldn&apos;t need connections to get a fair shot. Create a profile free.
                Get seen by {employerCount > 0 ? employerCount.toLocaleString() + "+" : ""} employers on the island.
                Get introduced directly — no recruiter middleman.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Free forever.</span> Create your profile, get matched, get introduced. No cost to you.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Get seen by every employer.</span> Not just the ones using one recruiter. Everyone.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Direct introductions.</span> Employers contact you directly. Build real relationships.</span>
                </div>
              </div>
              <Button className="gap-2" onClick={() => setAuthModalOpen(true)}>
                <User className="w-4 h-4" /> Create Your Free Profile <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* For Employers */}
            <div ref={addRevealEl} className="rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm p-8">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <Building2 className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide font-medium">For Employers</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Hire Caymanian talent. Direct connections with your community.
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Stop paying 15-25% per hire. Search Caymanian talent directly.
                Send introductions. Build relationships. Hire faster. Stay compliant. One monthly fee.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Save money.</span> $299/month replaces 15-25% per-hire fees. Hiring 10 people/year? Save CI$90-150K.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Save time.</span> Search talent by skill, education, experience, location. Direct introductions. No recruiter delays.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><span className="text-neutral-900 dark:text-neutral-100 font-medium">Stay compliant.</span> Timestamped records. Structured feedback. One-click reports. Proof you tried.</span>
                </div>
              </div>
              <Link href="/talent">
                <Button variant="secondary" className="gap-2">
                  <Users className="w-4 h-4" /> Search Talent <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs CTA Section */}
      <section id="jobs" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-primary-50 via-emerald-50 to-purple-50 border-neutral-300 dark:border-neutral-700 backdrop-blur-md shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Ready to explore{" "}
                <span className="text-primary-500">{jobCount}+ active jobs</span>?
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-8 max-w-2xl mx-auto">
                Browse real-time job postings, filter by location,
                salary, and industry. Find your next opportunity in Cayman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/careers">
                  <Button size="lg" className="gap-2">
                    <Search className="w-4 h-4" />
                    Browse All Jobs
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <User className="w-4 h-4" />
                  Create Your Free Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h5 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
            Frequently asked
          </h5>
          <Accordion
            type="single"
            collapsible
            className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm rounded-2xl"
            ref={faqRef}
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6">What is careers.ky?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                careers.ky is a Caymanian-First Careers Platform that makes hiring talent visible, accessible and fair. For candidates, it&apos;s a free way to create a profile, get matched to roles, and get introduced directly to employers. For employers, it replaces recruiters — search Caymanian talent directly, send introductions, and stay compliant. One monthly fee instead of 15-25% per hire.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6">Is it free for candidates?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                Yes, completely free. Create your profile, get matched to roles, get introduced to employers — all at no cost. We make money from employer subscriptions, not from candidates. You&apos;ll never pay a fee.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">How do talent profiles work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                Create a profile with your education, experience, skills, and career interests. When you opt in to be discoverable, employers can find you through talent search and request an introduction — but your name and contact details stay hidden until you choose to accept. It&apos;s a double opt-in system designed to protect your privacy while connecting you with relevant opportunities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6">How do introductions work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                When an employer finds a candidate who matches their needs, they send an introduction request. The candidate sees the employer and role details, then chooses to accept or decline. If accepted, both parties can communicate directly. No recruiter middleman. No commission. Just a direct connection.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6">How much does it cost for employers?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                careers.ky Pro is $299/month — that replaces recruiter fees of 15-25% per hire (CI$10-16K per person). A firm hiring 10 people a year saves CI$90-150K. Enterprise is $799/month with unlimited reports, API access, and advanced analytics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="px-6">Where does the job data come from?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                Job postings are synced daily from WORC (my.egov.ky), the official government portal for job opportunities in the Cayman Islands. You&apos;re seeing current, active postings from official government sources.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="px-6">How does careers.ky help with compliance?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                Every interaction on the platform creates a timestamped record. When employers search talent, send introductions, and provide feedback, it&apos;s all documented automatically. One-click compliance reports give employers proof they genuinely considered Caymanian candidates — and candidates know they were fairly evaluated.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger className="px-6">Who can use this platform?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                careers.ky is built for Caymanians first — young professionals, career changers, people re-entering the workforce. Employers of all sizes use it to find local talent. We serve law firms, hospitality, financial services, government, construction, retail — anyone hiring in Cayman.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger className="px-6">What makes this different from a recruiter?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-600 dark:text-neutral-400">
                Recruiters charge 15-25% of first-year salary per hire and control the relationship between employer and candidate. careers.ky gives employers direct access to Caymanian talent for a flat monthly fee. You search, you introduce, you hire — directly. No per-hire fees. No middleman. Plus you get compliance automation built in.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-1.5 bg-gradient-to-r from-primary-200 via-emerald-100 to-primary-100"
            id="cta-gradient"
          >
            <div className="rounded-[20px] bg-white/80 border border-neutral-200 dark:border-neutral-700 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-neutral-500">For Candidates</div>
                  <div className="text-xl font-semibold">Your talent. Your opportunity. Fair shot.</div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Create your profile free and let every employer on the island find you. No recruiter. No commission. Just opportunity.
                  </p>
                  <Button className="gap-2 mt-2" onClick={() => setAuthModalOpen(true)}>
                    <User className="w-4 h-4" /> Create Profile <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:border-neutral-200 dark:border-neutral-700 md:pl-6">
                  <div className="text-sm text-neutral-500">For Employers</div>
                  <div className="text-xl font-semibold">Find Caymanian talent. Direct connections with your community.</div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Search local talent directly. Send introductions. One monthly fee replaces 15-25% per-hire recruiter costs.
                  </p>
                  <Link href="/talent">
                    <Button variant="secondary" className="gap-2 mt-2">
                      <Users className="w-4 h-4" /> Search Talent <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
