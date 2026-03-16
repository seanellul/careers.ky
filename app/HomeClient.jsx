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
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
}) {
  const router = useRouter();
  const root = useRef(null);
  const hero = useRef(null);
  const revealEls = useRef([]);
  revealEls.current = [];
  const faqRef = useRef(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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
      if (res.searchQuery) params.set("q", res.searchQuery);
      if (res.ciscoCode) params.set("cisco", res.ciscoCode);
      router.push(`/jobs?${params.toString()}`);
    } else if (res?.targetPage === "career-tracks") {
      const params = new URLSearchParams();
      if (res.searchQuery) params.set("q", res.searchQuery);
      if (res.ciscoCode) params.set("cisco", res.ciscoCode);
      router.push(`/career-tracks?${params.toString()}`);
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

      <Navigation />

      {/* Hero */}
      <section ref={hero} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <Badge className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-300/30">
                Live Job Market Data
              </Badge>
              <h1 className="text-4xl/tight sm:text-5xl/tight md:text-6xl/tight font-semibold tracking-tight">
                <span className="text-cyan-300">Real-time insights</span> into
                Cayman's <span className="text-white">job market</span>.
              </h1>
              <p className="text-neutral-300 text-base md:text-lg max-w-2xl">
                Access live job postings, salary data, industry trends, and
                career planning tools. Built with real WORC data to help
                Caymanians make informed career decisions.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition cursor-pointer text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-cyan-400/15 grid place-items-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Career Mapper</div>
                    <div className="text-xs text-neutral-400">
                      Match your lifestyle to careers
                    </div>
                  </div>
                </button>
                <Link
                  href="/career-tracks"
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
                  href="/jobs"
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

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="gap-2 h-12 text-base"
                  onClick={() => setOnboardingOpen(true)}
                >
                  <Sparkles className="w-4 h-4" />
                  Start Career Mapper
                </Button>
                <Link href="/jobs">
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
              <div className="rounded-3xl p-1.5 bg-gradient-to-b from-cyan-300/30 via-cyan-300/5 to-transparent">
                <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4 md:p-6">
                  <div className="text-sm text-neutral-400 mb-4">
                    Market Snapshot
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl font-semibold text-cyan-300 mb-1">
                        {jobCount}
                      </div>
                      <div className="text-xs text-neutral-400">Active Jobs</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl font-semibold text-emerald-300 mb-1">
                        {industryCount}+
                      </div>
                      <div className="text-xs text-neutral-400">Industries</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl font-semibold text-orange-300 mb-1">
                        {employerCount > 0 ? employerCount.toLocaleString() : "—"}
                      </div>
                      <div className="text-xs text-neutral-400">Employers</div>
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
                        <span className="text-xs uppercase tracking-wide">
                          Tool
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">
                        Career Mapper
                      </div>
                      <p className="text-xs text-neutral-400">
                        Lifestyle-first career matching
                      </p>
                    </button>

                    <Link
                      href="/career-tracks"
                      className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-emerald-300 mb-1">
                        <Compass className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Data
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">
                        Career Tracks
                      </div>
                      <p className="text-xs text-neutral-400">
                        Industry insights & salary ranges
                      </p>
                    </Link>

                    <Link
                      href="/jobs"
                      className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-purple-300 mb-1">
                        <Search className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Search
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">
                        Live Job Search
                      </div>
                      <p className="text-xs text-neutral-400">
                        Browse & filter active postings
                      </p>
                    </Link>

                    <Link
                      href="/talent"
                      className="block w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-300/40 transition group"
                    >
                      <div className="flex items-center gap-2 text-orange-300 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          Employer
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-white transition">
                        Search Local Talent
                      </div>
                      <p className="text-xs text-neutral-400">
                        Find candidates in Cayman
                      </p>
                    </Link>
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
                Explore career tracks
              </h3>
              <p className="text-neutral-400 text-sm mt-2">
                Browse by industry category with live market data
              </p>
            </div>
            <Link href="/career-tracks">
              <Button variant="secondary" className="gap-2">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerTracks.map((track) => (
              <Link key={track.id} href="/career-tracks">
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

      {/* Jobs CTA Section */}
      <section id="jobs" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-cyan-500/15 via-emerald-500/15 to-purple-500/15 border-white/20 backdrop-blur-md shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Ready to explore{" "}
                <span className="text-cyan-300">{jobCount}+ active jobs</span>?
              </h3>
              <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto">
                Browse real-time job postings from WORC, filter by location,
                salary, and industry. Find your next opportunity in Cayman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/jobs">
                  <Button size="lg" className="gap-2">
                    <Search className="w-4 h-4" />
                    Browse All Jobs
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setOnboardingOpen(true)}
                >
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
                careers.ky is a comprehensive job market platform for the Cayman Islands, providing real-time insights into active job postings, salary data, and industry trends. We pull live data from WORC (Workforce Opportunities & Residency Cayman) to help you make informed career decisions with three powerful tools: Career Mapper for lifestyle-first job matching, Career Tracks for exploring industries and salary ranges, and Live Search for browsing all active postings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6">Where does your job data come from?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                All job postings, salary information, and market data are sourced directly from WORC (my.egov.ky), the official government portal for job opportunities in the Cayman Islands. Our data is updated daily to ensure you have access to the most current job market information available.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">How does the Career Mapper work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Career Mapper is our lifestyle-first job matching tool. It asks you about your priorities—like work-life balance, commute preferences, salary expectations, and personal interests—then matches you with career paths and job opportunities that align with your lifestyle goals, not just your skills.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6">What's the difference between Career Tracks and Live Search?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Career Tracks lets you explore the job market by industry category, showing you aggregated data like average salaries, number of active jobs, and career pathways within each sector. Live Search is a real-time job board where you can browse, filter, and search through all active job postings with detailed information about each role.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6">Can I apply to jobs directly through careers.ky?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is a job discovery and research platform. When you find a position you're interested in, we'll direct you to the official WORC portal or the employer's application page where you can submit your application.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="px-6">Who can use this platform?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                careers.ky is designed for anyone interested in working in the Cayman Islands—Caymanians, residents, and international talent exploring opportunities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="px-6">How often is the job data updated?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Our job listings are synced daily with the WORC database to ensure you're seeing current, active postings. The job counts, salary statistics, and industry trends you see on the platform reflect the latest available data from official government sources.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger className="px-6">What types of jobs are listed?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                We list all types of employment opportunities available through WORC, including full-time, part-time, temporary positions, internships, and apprenticeships across all major industries in the Cayman Islands.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger className="px-6">What are talent profiles and how does talent search work?</AccordionTrigger>
              <AccordionContent className="px-6 text-neutral-300">
                Job seekers can create a talent profile with their career interests, skills, education, and experience. When you opt in to be discoverable, employers can find you through talent search and request an introduction — but your name and contact details stay hidden until you choose to accept. It's a double opt-in system designed to protect your privacy while connecting you with relevant opportunities.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-neutral-400">For Job Seekers</div>
                  <div className="text-xl font-semibold">Looking for work?</div>
                  <p className="text-neutral-300 text-sm">
                    Create your talent profile and let Cayman employers find you.
                  </p>
                  <Link href="/profile/setup">
                    <Button className="gap-2 mt-2">
                      <User className="w-4 h-4" /> Create Profile <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:border-white/10 md:pl-6">
                  <div className="text-sm text-neutral-400">For Employers</div>
                  <div className="text-xl font-semibold">Hiring in Cayman?</div>
                  <p className="text-neutral-300 text-sm">
                    Search our local talent pool and request introductions.
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

      <Footer />
    </div>
  );
}
