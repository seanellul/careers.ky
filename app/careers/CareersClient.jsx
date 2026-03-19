"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  useState, useRef, useCallback, useLayoutEffect, useEffect, useMemo,
} from "react";
import gsap from "gsap";
import LiveSearchClient from "@/app/jobs/LiveSearchClient";
import EmployerListClient from "@/app/employers/EmployerListClient";
import CareerTracksClient from "@/app/career-tracks/CareerTracksClient";
import { Briefcase, Building2, Compass } from "lucide-react";

const TABS = [
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "employers", label: "Employers", icon: Building2 },
  { key: "career-tracks", label: "Career Tracks", icon: Compass },
];

// --- Animated number counter ---
function AnimatedStat({ value, suffix = "" }) {
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: prevValue.current };
    const tween = gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString() + suffix;
      },
    });
    prevValue.current = value;
    return () => tween.kill();
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function CareersClient({
  jobs,
  employers,
  tree,
  aggregates,
  workTypes,
  eduTypes,
  expTypes,
  locTypes,
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "jobs";

  // --- Tab indicator refs ---
  const tabBarRef = useRef(null);
  const tabRefs = useRef({});
  const indicatorRef = useRef(null);
  const contentRef = useRef(null);
  const prevTabRef = useRef(activeTab);
  const isFirstRender = useRef(true);

  const setTabRef = useCallback((key) => (el) => { tabRefs.current[key] = el; }, []);

  // Position the sliding indicator
  useLayoutEffect(() => {
    const bar = tabBarRef.current;
    const btn = tabRefs.current[activeTab];
    const pill = indicatorRef.current;
    if (!bar || !btn || !pill) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - barRect.left;
    const width = btnRect.width;

    if (isFirstRender.current) {
      gsap.set(pill, { x: left, width, opacity: 1 });
      isFirstRender.current = false;
    } else {
      gsap.to(pill, {
        x: left,
        width,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [activeTab]);

  // --- Content crossfade ---
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (prevTabRef.current !== activeTab) {
      // Animate in
      gsap.fromTo(el,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  const setTab = (tab) => {
    if (tab === activeTab) return;
    // Quick fade-out before URL change
    const el = contentRef.current;
    if (el) {
      gsap.to(el, {
        opacity: 0,
        y: -8,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", tab);
          for (const key of [...params.keys()]) {
            if (key !== "tab") params.delete(key);
          }
          router.replace(`/careers?${params.toString()}`, { scroll: false });
        },
      });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      for (const key of [...params.keys()]) {
        if (key !== "tab") params.delete(key);
      }
      router.replace(`/careers?${params.toString()}`, { scroll: false });
    }
  };

  // --- Aggregate stats ---
  const totalJobs = jobs.length;
  const totalEmployers = employers.length;
  const hiringEmployers = useMemo(
    () => employers.filter((e) => Number(e.active_postings) > 0).length,
    [employers]
  );

  // --- Stagger stat cards on mount ---
  const statsRef = useRef(null);
  useEffect(() => {
    if (!statsRef.current) return;
    const cards = statsRef.current.querySelectorAll("[data-stat-card]");
    if (!cards.length) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Macro stats bar */}
        <div ref={statsRef} className="grid grid-cols-3 gap-3 mb-6">
          <div data-stat-card className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-400/15 grid place-items-center shrink-0">
              <Briefcase className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-xl font-semibold">
                <AnimatedStat value={totalJobs} />
              </div>
              <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Active Jobs</div>
            </div>
          </div>
          <div data-stat-card className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-400/15 grid place-items-center shrink-0">
              <Building2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xl font-semibold">
                <AnimatedStat value={totalEmployers} />
              </div>
              <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Employers</div>
            </div>
          </div>
          <div data-stat-card className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-400/15 grid place-items-center shrink-0">
              <Building2 className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="text-xl font-semibold">
                <AnimatedStat value={hiringEmployers} />
              </div>
              <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Hiring Now</div>
            </div>
          </div>
        </div>

        {/* Tab bar with sliding indicator */}
        <div
          ref={tabBarRef}
          className="relative flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-8 max-w-full overflow-x-auto"
        >
          {/* Sliding pill */}
          <div
            ref={indicatorRef}
            className="absolute top-1 bottom-1 rounded-lg bg-cyan-500/20 border border-cyan-300/30 pointer-events-none"
            style={{ opacity: 0 }}
          />

          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              ref={setTabRef(key)}
              onClick={() => setTab(key)}
              className={`relative z-10 flex items-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                activeTab === key
                  ? "text-cyan-300"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4 hidden sm:inline" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content with crossfade */}
      <div ref={contentRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "jobs" && (
          <LiveSearchClient
            jobs={jobs}
            workTypes={workTypes}
            eduTypes={eduTypes}
            expTypes={expTypes}
            locTypes={locTypes}
            embedded
          />
        )}
        {activeTab === "employers" && (
          <EmployerListClient employers={employers} embedded />
        )}
        {activeTab === "career-tracks" && (
          <CareerTracksClient
            tree={tree}
            aggregates={aggregates}
            workTypes={workTypes}
            eduTypes={eduTypes}
            expTypes={expTypes}
            embedded
          />
        )}
      </div>
    </div>
  );
}
