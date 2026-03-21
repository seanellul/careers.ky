"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  LayoutDashboard,
} from "lucide-react";
import OnboardingFlow from "@/components/OnboardingFlow";
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

const CANDIDATE_SIGNIN_HREF = `/sign-in?type=candidate&next=${encodeURIComponent("/profile/setup")}`;
const CANDIDATE_PROFILE_HREF = "/profile";

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
  initialOpenPlanner = false,
}) {
  const router = useRouter();
  const { session } = useSession();
  const root = useRef(null);
  const hero = useRef(null);
  const revealEls = useRef([]);
  revealEls.current = [];
  const faqRef = useRef(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const isCandidate = Boolean(session?.candidateId && !session?.employerAccountId);
  const isEmployer = Boolean(session?.employerAccountId);

  const candidateSignupOrProfileHref = isCandidate
    ? CANDIDATE_PROFILE_HREF
    : CANDIDATE_SIGNIN_HREF;

  const candidateFirstName =
    session?.candidateName?.trim()?.split(/\s+/)?.[0] || null;

  useEffect(() => {
    if (initialOpenPlanner) setOnboardingOpen(true);
  }, [initialOpenPlanner]);

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
    <div ref={root} className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Dynamic background */}
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)",
          backgroundPosition: "0% 50%",
        }}
      />

      {/* Hero */}
      <section ref={hero} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              {isEmployer ? (
                <>
                  <Badge className="w-fit bg-emerald-500/10 text-emerald-300 border-emerald-300/30">
                    Employer workspace
                  </Badge>
                  <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                    <span className="text-emerald-300">Hire Caymanian talent</span>
                    <br />
                    <span className="text-white">without the recruiter tax.</span>
                  </h1>
                  <p className="text-neutral-200 text-lg md:text-xl max-w-2xl font-medium">
                    Search local candidates, send introductions, and keep a clear compliance trail — from one dashboard.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Link
                      href="/employer/dashboard"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-400/15 grid place-items-center flex-shrink-0">
                        <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Dashboard</div>
                        <div className="text-xs text-neutral-400">Pipeline & activity</div>
                      </div>
                    </Link>
                    <Link
                      href="/talent"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-orange-400/15 grid place-items-center flex-shrink-0">
                        <Users className="w-4 h-4 text-orange-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Search talent</div>
                        <div className="text-xs text-neutral-400">Filter by skills & background</div>
                      </div>
                    </Link>
                    <Link
                      href="/employer/profile"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-cyan-400/15 grid place-items-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Company profile</div>
                        <div className="text-xs text-neutral-400">How candidates see you</div>
                      </div>
                    </Link>
                    <Link
                      href="/careers"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-400/15 grid place-items-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Live job market</div>
                        <div className="text-xs text-neutral-400">WORC postings & benchmarks</div>
                      </div>
                    </Link>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <Link href="/talent" className={cn(buttonVariants({ size: "lg" }), "gap-2 h-12 text-base")}>
                      <Users className="w-4 h-4" />
                      Search talent
                    </Link>
                    <Link href="/employer/dashboard">
                      <Button size="lg" variant="secondary" className="gap-2 h-12 text-base w-full sm:w-auto">
                        <LayoutDashboard className="w-4 h-4" />
                        Open dashboard
                      </Button>
                    </Link>
                  </div>
                </>
              ) : isCandidate ? (
                <>
                  <Badge className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-300/30">
                    Your career hub
                  </Badge>
                  <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                    {candidateFirstName ? (
                      <>
                        <span className="text-cyan-300">Welcome back,</span>{" "}
                        <span className="text-white">{candidateFirstName}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-cyan-300">Your next role</span>{" "}
                        <span className="text-white">starts here.</span>
                      </>
                    )}
                  </h1>
                  <p className="text-neutral-200 text-lg md:text-xl max-w-2xl font-medium">
                    Explore live jobs and career tracks, sharpen your profile so employers can find you, and use the planner to chart your path.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Link
                      href={CANDIDATE_PROFILE_HREF}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-cyan-400/15 grid place-items-center flex-shrink-0">
                        <User className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Your profile</div>
                        <div className="text-xs text-neutral-400">Add skills & details to stand out</div>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-400/15 grid place-items-center flex-shrink-0">
                        <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Dashboard</div>
                        <div className="text-xs text-neutral-400">Introductions & saved items</div>
                      </div>
                    </Link>
                    <Link
                      href="/careers?tab=career-tracks"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-400/15 grid place-items-center flex-shrink-0">
                        <Compass className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Career tracks</div>
                        <div className="text-xs text-neutral-400">Salaries & demand by industry</div>
                      </div>
                    </Link>
                    <Link
                      href="/careers"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 hover:bg-white/10 transition text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-400/15 grid place-items-center flex-shrink-0">
                        <Search className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Live jobs</div>
                        <div className="text-xs text-neutral-400">Active WORC postings</div>
                      </div>
                    </Link>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <Link href={CANDIDATE_PROFILE_HREF} className={cn(buttonVariants({ size: "lg" }), "gap-2 h-12 text-base")}>
                      <User className="w-4 h-4" />
                      Improve your profile
                    </Link>
                    <Link href="/careers">
                      <Button size="lg" variant="secondary" className="gap-2 h-12 text-base w-full sm:w-auto">
                        <Search className="w-4 h-4" />
                        Browse jobs
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="gap-2 h-12 text-base border-cyan-300/25 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-100"
                      onClick={() => setOnboardingOpen(true)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Career planner
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Badge className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-300/30">
                    A Caymanian-First Careers Platform
                  </Badge>
                  <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                    <span className="text-cyan-300">A Caymanian-First</span>{" "}
                    Careers <span className="text-white">Platform.</span>
                  </h1>
                  <p className="text-neutral-200 text-lg md:text-xl max-w-2xl font-medium">
                    Making hiring talent visible, accessible and fair.
                  </p>
                  <div className="space-y-2 text-neutral-300 text-base md:text-lg max-w-2xl">
                    <p>
                      <span className="text-cyan-300 font-medium">For candidates:</span>{" "}
                      Every Caymanian deserves a fair shot at every role. Create your profile free. Get matched. Get hired.
                    </p>
                    <p>
                      <span className="text-emerald-300 font-medium">For employers:</span>{" "}
                      Find Caymanian talent directly. Skip the recruiter. Save money. One platform. One monthly fee.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Link
                      href={candidateSignupOrProfileHref}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition cursor-pointer text-left w-full"
                    >
                      <div className="h-8 w-8 rounded-lg bg-cyan-400/15 grid place-items-center flex-shrink-0">
                        <User className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Create Profile</div>
                        <div className="text-xs text-neutral-400">
                          Get seen by every employer
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/careers?tab=career-tracks"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-400/15 grid place-items-center flex-shrink-0">
                        <Compass className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Career Tracks</div>
                        <div className="text-xs text-neutral-400">
                          Explore by industry & salary
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/careers"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-400/15 grid place-items-center flex-shrink-0">
                        <Search className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Live Search</div>
                        <div className="text-xs text-neutral-400">
                          Browse active job postings
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/talent"
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-orange-400/15 grid place-items-center flex-shrink-0">
                        <Users className="w-4 h-4 text-orange-300" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">Find Talent</div>
                        <div className="text-xs text-neutral-400">
                          Search local talent pool
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <Link
                      href={candidateSignupOrProfileHref}
                      className={cn(buttonVariants({ size: "lg" }), "gap-2 h-12 text-base")}
                    >
                      <User className="w-4 h-4" />
                      Create Your Free Profile
                    </Link>
                    <Link href="/careers">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="gap-2 h-12 text-base w-full sm:w-auto"
                      >
                        <Search className="w-4 h-4" />
                        Browse Jobs
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="gap-2 h-12 text-base border-cyan-300/25 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-100"
                      onClick={() => setOnboardingOpen(true)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Career planner
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-1.5 bg-gradient-to-b from-cyan-300/30 via-cyan-300/5 to-transparent">
                <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4 md:p-6">
                  <div className="text-sm text-neutral-400 mb-4">
                    {isEmployer ? "Hiring snapshot" : "Market snapshot"}
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-2xl sm:text-3xl font-semibold text-cyan-300 mb-1">
                        {jobCount}
                      </div>
                      <div className="text-xs text-neutral-400">Active Jobs</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-2xl sm:text-3xl font-semibold text-emerald-300 mb-1">
                        {industryCount}+
                      </div>
                      <div className="text-xs text-neutral-400">Industries</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-2xl sm:text-3xl font-semibold text-orange-300 mb-1">
                        {employerCount > 0 ? employerCount.toLocaleString() : "—"}
                      </div>
                      <div className="text-xs text-neutral-400">Employers</div>
                    </div>
                  </div>

                  <div className="h-px my-4 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  {/* Quick Links to Tools */}
                  <div className="space-y-2">
                    {isEmployer ? (
                      <>
                        <Link
                          href="/employer/dashboard"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-emerald-300 mb-1">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Workspace</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Employer dashboard</div>
                          <p className="text-xs text-neutral-400">Introductions, alerts & pipeline</p>
                        </Link>
                        <Link
                          href="/talent"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-orange-300 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Talent</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Search candidates</div>
                          <p className="text-xs text-neutral-400">Filter by skills & experience</p>
                        </Link>
                        <Link
                          href="/employer/profile"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-cyan-300 mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Brand</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Company profile</div>
                          <p className="text-xs text-neutral-400">Polish how you show up to talent</p>
                        </Link>
                        <Link
                          href="/careers"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-purple-300 mb-1">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Market</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Live job postings</div>
                          <p className="text-xs text-neutral-400">Benchmark demand & compensation</p>
                        </Link>
                      </>
                    ) : isCandidate ? (
                      <>
                        <Link
                          href={CANDIDATE_PROFILE_HREF}
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-cyan-300 mb-1">
                            <User className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Profile</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Improve your profile</div>
                          <p className="text-xs text-neutral-400">Skills, headline & discoverability</p>
                        </Link>
                        <Link
                          href="/dashboard"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-emerald-300 mb-1">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Activity</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Your dashboard</div>
                          <p className="text-xs text-neutral-400">Introductions & job interests</p>
                        </Link>
                        <Link
                          href="/careers?tab=career-tracks"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-emerald-300 mb-1">
                            <Compass className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Explore</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Career tracks</div>
                          <p className="text-xs text-neutral-400">Industry insights & salary ranges</p>
                        </Link>
                        <Link
                          href="/careers"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-purple-300 mb-1">
                            <Search className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Jobs</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Live job search</div>
                          <p className="text-xs text-neutral-400">Browse & filter active postings</p>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={candidateSignupOrProfileHref}
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-cyan-300 mb-1">
                            <User className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Candidates</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Create your profile</div>
                          <p className="text-xs text-neutral-400">Get seen by every employer on the island</p>
                        </Link>
                        <Link
                          href="/careers?tab=career-tracks"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-emerald-300 mb-1">
                            <Compass className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Explore</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Career tracks</div>
                          <p className="text-xs text-neutral-400">Industry insights & salary ranges</p>
                        </Link>
                        <Link
                          href="/careers"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-purple-300 mb-1">
                            <Search className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Search</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Live job search</div>
                          <p className="text-xs text-neutral-400">Browse & filter active postings</p>
                        </Link>
                        <Link
                          href="/talent"
                          className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-300/40 transition group"
                        >
                          <div className="flex items-center gap-2 text-orange-300 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wide">Employer</span>
                          </div>
                          <div className="font-medium group-hover:text-white transition">Search local talent</div>
                          <p className="text-xs text-neutral-400">Find Caymanian candidates directly</p>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* Tracks grid */}
      <section id="tracks" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {isEmployer
                  ? "Market demand by industry"
                  : "Explore career tracks"}
              </h3>
              <p className="text-neutral-400 text-sm mt-2">
                {isEmployer
                  ? "Live job counts and salaries to benchmark roles and comps."
                  : "Browse by industry category with live market data"}
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
                  className="group bg-white/5 border-white/10 hover:border-cyan-300/40 hover:shadow-2xl hover:shadow-cyan-300/10 transition cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30 text-xs"
                      >
                        {track.id}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-cyan-300 transition" />
                    </div>
                    <div className="font-semibold text-base mb-2 group-hover:text-cyan-300 transition line-clamp-2 min-h-[2.5rem]">
                      {track.title}
                    </div>
                    <p className="text-xs text-neutral-400 mb-4">
                      {track.subcategories} specializations
                    </p>

                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Active Jobs</span>
                        <span className="font-semibold text-emerald-300">
                          {track.jobCount}
                        </span>
                      </div>
                      {track.avgSalary > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Avg. Salary</span>
                          <span className="font-semibold text-cyan-300">
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
              <Plane className="w-5 h-5 text-cyan-300" />
              <h4 className="text-xl font-semibold tracking-tight">
                {isEmployer ? "Live postings across Cayman." : "Work on what you love."}
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
                        className="group min-w-[220px] sm:min-w-[260px] rounded-2xl p-4 bg-white/10 border border-white/20 backdrop-blur-sm hover:border-cyan-300/40 transition"
                      >
                        <div className="text-sm text-neutral-300 mb-2">
                          Live posting
                        </div>
                        <div className="font-medium mb-1 text-white group-hover:text-cyan-300 transition">
                          {truncateText(job.jobTitle, 25)}
                        </div>
                        {job.employerName && (
                          <div className="text-xs text-neutral-400 mb-1">
                            {truncateText(job.employerName, 25)}
                          </div>
                        )}
                        <div className="text-xs text-neutral-300">
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

      {/* Value props — role-specific or dual for guests */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`grid gap-8 ${isCandidate || isEmployer ? "md:grid-cols-1 max-w-3xl mx-auto" : "md:grid-cols-2"}`}
          >
            {isEmployer ? (
              <div ref={addRevealEl} className="rounded-2xl bg-white/5 border border-white/10 p-8">
                <div className="flex items-center gap-2 text-emerald-300 mb-4">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-wide font-medium">Built for your hiring</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  Source, introduce, and document — in one place.
                </h3>
                <p className="text-neutral-300 mb-6">
                  Search Caymanian talent, send structured introductions, and keep timestamped records for compliance. Replace per-hire recruiter fees with a predictable subscription.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">Direct access.</span> Reach candidates who opt in to be discoverable — no middleman.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">Faster pipeline.</span> Shortlists, templates, and alerts tuned to your roles.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">Compliance-ready.</span> One-click reports and structured feedback trails.</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/talent" className={cn(buttonVariants(), "gap-2")}>
                    <Users className="w-4 h-4" /> Search talent <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link href="/employer/dashboard">
                    <Button variant="secondary" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isCandidate ? (
              <div ref={addRevealEl} className="rounded-2xl bg-white/5 border border-white/10 p-8">
                <div className="flex items-center gap-2 text-cyan-300 mb-4">
                  <User className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-wide font-medium">Built for your career</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  Get discovered — and choose who reaches out.
                </h3>
                <p className="text-neutral-300 mb-6">
                  A stronger profile helps employers find you in talent search. You stay in control: introductions are double opt-in, and you decide what to share.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">Always free.</span> Browse jobs, explore tracks, and use the career planner at no cost.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">Better matches.</span> Interests and skills help surface the right introductions.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                    <span><span className="text-white font-medium">You&apos;re in control.</span> Accept or decline requests before any contact is shared.</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={CANDIDATE_PROFILE_HREF} className={cn(buttonVariants(), "gap-2")}>
                    <User className="w-4 h-4" /> Improve your profile <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div ref={addRevealEl} className="rounded-2xl bg-white/5 border border-white/10 p-8">
                  <div className="flex items-center gap-2 text-cyan-300 mb-4">
                    <User className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-wide font-medium">For Candidates</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">
                    Get seen. Get matched. Get hired.
                  </h3>
                  <p className="text-neutral-300 mb-6">
                    You shouldn&apos;t need connections to get a fair shot. Create a profile free.
                    Get seen by {employerCount > 0 ? employerCount.toLocaleString() + "+" : ""} employers on the island.
                    Get introduced directly — no recruiter middleman.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Free forever.</span> Create your profile, get matched, get introduced. No cost to you.</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Get seen by every employer.</span> Not just the ones using one recruiter. Everyone.</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Direct introductions.</span> Employers contact you directly. Build real relationships.</span>
                    </div>
                  </div>
                  <Link href={candidateSignupOrProfileHref} className={cn(buttonVariants(), "gap-2")}>
                    <User className="w-4 h-4" /> Create your free profile <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div ref={addRevealEl} className="rounded-2xl bg-white/5 border border-white/10 p-8">
                  <div className="flex items-center gap-2 text-emerald-300 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-wide font-medium">For Employers</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">
                    Hire Caymanian talent. Skip the recruiter.
                  </h3>
                  <p className="text-neutral-300 mb-6">
                    Stop paying 15-25% per hire. Search Caymanian talent directly.
                    Send introductions. Build relationships. Hire faster. Stay compliant. One monthly fee.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Save money.</span> $299/month replaces 15-25% per-hire fees. Hiring 10 people/year? Save CI$90-150K.</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Save time.</span> Search talent by skill, education, experience, location. Direct introductions. No recruiter delays.</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span><span className="text-white font-medium">Stay compliant.</span> Timestamped records. Structured feedback. One-click reports. Proof you tried.</span>
                    </div>
                  </div>
                  <Link href="/talent">
                    <Button variant="secondary" className="gap-2">
                      <Users className="w-4 h-4" /> Search Talent <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Jobs / market CTA */}
      <section id="jobs" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-cyan-500/15 via-emerald-500/15 to-purple-500/15 border-white/20 backdrop-blur-md shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              {isEmployer ? (
                <>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                    <span className="text-emerald-300">{jobCount}+ live postings</span> on the market
                  </h3>
                  <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto">
                    Use WORC data to benchmark roles and comps, then find people in talent search who fit your needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/talent">
                      <Button size="lg" className="gap-2">
                        <Users className="w-4 h-4" />
                        Search talent
                      </Button>
                    </Link>
                    <Link href="/careers">
                      <Button size="lg" variant="secondary" className="gap-2">
                        <Search className="w-4 h-4" />
                        Browse job market
                      </Button>
                    </Link>
                  </div>
                </>
              ) : isCandidate ? (
                <>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                    Explore{" "}
                    <span className="text-cyan-300">{jobCount}+ active jobs</span>
                  </h3>
                  <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto">
                    Filter by location, salary, and industry — and keep your profile sharp so the right employers can find you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/careers">
                      <Button size="lg" className="gap-2">
                        <Search className="w-4 h-4" />
                        Browse all jobs
                      </Button>
                    </Link>
                    <Link
                      href={CANDIDATE_PROFILE_HREF}
                      className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "gap-2")}
                    >
                      <User className="w-4 h-4" />
                      Improve your profile
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                    Ready to explore{" "}
                    <span className="text-cyan-300">{jobCount}+ active jobs</span>?
                  </h3>
                  <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto">
                    Browse real-time job postings, filter by location,
                    salary, and industry. Find your next opportunity in Cayman.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/careers">
                      <Button size="lg" className="gap-2">
                        <Search className="w-4 h-4" />
                        Browse all jobs
                      </Button>
                    </Link>
                    <Link
                      href={candidateSignupOrProfileHref}
                      className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "gap-2")}
                    >
                      <User className="w-4 h-4" />
                      Create your free profile
                    </Link>
                  </div>
                </>
              )}
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
            className="bg-white/5 border border-white/10 rounded-2xl"
            ref={faqRef}
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6">What is careers.ky?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is a Caymanian-First Careers Platform that makes hiring talent visible, accessible and fair. For candidates, it&apos;s a free way to create a profile, get matched to roles, and get introduced directly to employers. For employers, it replaces recruiters — search Caymanian talent directly, send introductions, and stay compliant. One monthly fee instead of 15-25% per hire.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6">Is it free for candidates?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Yes, completely free. Create your profile, get matched to roles, get introduced to employers — all at no cost. We make money from employer subscriptions, not from candidates. You&apos;ll never pay a fee.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">How do talent profiles work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Create a profile with your education, experience, skills, and career interests. When you opt in to be discoverable, employers can find you through talent search and request an introduction — but your name and contact details stay hidden until you choose to accept. It&apos;s a double opt-in system designed to protect your privacy while connecting you with relevant opportunities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6">How do introductions work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                When an employer finds a candidate who matches their needs, they send an introduction request. The candidate sees the employer and role details, then chooses to accept or decline. If accepted, both parties can communicate directly. No recruiter middleman. No commission. Just a direct connection.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6">How much does it cost for employers?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky Pro is $299/month — that replaces recruiter fees of 15-25% per hire (CI$10-16K per person). A firm hiring 10 people a year saves CI$90-150K. Enterprise is $799/month with unlimited reports, API access, and advanced analytics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="px-6">Where does the job data come from?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Job postings are synced daily from WORC (my.egov.ky), the official government portal for job opportunities in the Cayman Islands. You&apos;re seeing current, active postings from official government sources.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="px-6">How does careers.ky help with compliance?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Every interaction on the platform creates a timestamped record. When employers search talent, send introductions, and provide feedback, it&apos;s all documented automatically. One-click compliance reports give employers proof they genuinely considered Caymanian candidates — and candidates know they were fairly evaluated.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger className="px-6">Who can use this platform?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is built for Caymanians first — young professionals, career changers, people re-entering the workforce. Employers of all sizes use it to find local talent. We serve law firms, hospitality, financial services, government, construction, retail — anyone hiring in Cayman.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger className="px-6">What makes this different from a recruiter?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
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
            className="rounded-3xl p-1.5 bg-gradient-to-r from-cyan-300/30 via-emerald-300/20 to-fuchsia-300/20"
            id="cta-gradient"
          >
            <div className="rounded-[20px] bg-neutral-900/60 border border-white/10 p-8">
              {isEmployer ? (
                <div className="space-y-3 max-w-xl">
                  <div className="text-sm text-neutral-400">Employer</div>
                  <div className="text-xl font-semibold">Keep hiring moving.</div>
                  <p className="text-neutral-300 text-sm">
                    Jump into talent search or your dashboard — introductions and compliance trails stay in one workspace.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/talent" className={cn(buttonVariants(), "gap-2")}>
                      <Users className="w-4 h-4" /> Search talent <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link href="/employer/dashboard">
                      <Button variant="secondary" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : isCandidate ? (
                <div className="space-y-3 max-w-xl">
                  <div className="text-sm text-neutral-400">Candidate</div>
                  <div className="text-xl font-semibold">Small updates, better matches.</div>
                  <p className="text-neutral-300 text-sm">
                    Refresh your profile and interests so employers see the best version of you — or open the planner to explore paths.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href={CANDIDATE_PROFILE_HREF} className={cn(buttonVariants(), "gap-2")}>
                      <User className="w-4 h-4" /> Improve profile <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setOnboardingOpen(true)}
                    >
                      <Sparkles className="w-4 h-4" /> Career planner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="text-sm text-neutral-400">For Candidates</div>
                    <div className="text-xl font-semibold">Your talent. Your opportunity. Fair shot.</div>
                    <p className="text-neutral-300 text-sm">
                      Create your profile free and let every employer on the island find you. No recruiter. No commission. Just opportunity.
                    </p>
                    <Link href={candidateSignupOrProfileHref} className={cn(buttonVariants(), "gap-2 mt-2")}>
                      <User className="w-4 h-4" /> Create profile <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:border-white/10 md:pl-6">
                    <div className="text-sm text-neutral-400">For Employers</div>
                    <div className="text-xl font-semibold">Find Caymanian talent. Skip the recruiter.</div>
                    <p className="text-neutral-300 text-sm">
                      Search local talent directly. Send introductions. One monthly fee replaces 15-25% per-hire recruiter costs.
                    </p>
                    <Link href="/talent">
                      <Button variant="secondary" className="gap-2 mt-2">
                        <Users className="w-4 h-4" /> Search talent <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
