"use client";

import { useState, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { User, Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import gsap from "gsap";

const SEGMENT_PILL_CANDIDATE = {
  backgroundColor: "rgba(6, 182, 212, 0.25)",
  borderColor: "rgba(34, 211, 238, 0.35)",
  boxShadow: "0 1px 3px 0 rgba(6, 182, 212, 0.18)",
};

const SEGMENT_PILL_EMPLOYER = {
  backgroundColor: "rgba(16, 185, 129, 0.2)",
  borderColor: "rgba(52, 211, 153, 0.35)",
  boxShadow: "0 1px 3px 0 rgba(16, 185, 129, 0.14)",
};

export default function SignInForm({ initialLoginType = "candidate" }) {
  const [loginType, setLoginType] = useState(
    initialLoginType === "employer" ? "employer" : "candidate"
  );
  const segmentBarRef = useRef(null);
  const segmentPillRef = useRef(null);
  const segmentBtnCandidateRef = useRef(null);
  const segmentBtnEmployerRef = useRef(null);
  const isSegmentFirstFrame = useRef(true);

  useLayoutEffect(() => {
    const bar = segmentBarRef.current;
    const pill = segmentPillRef.current;
    const btn =
      loginType === "candidate"
        ? segmentBtnCandidateRef.current
        : segmentBtnEmployerRef.current;
    if (!bar || !pill || !btn) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - barRect.left;
    const width = btnRect.width;
    const colors = loginType === "candidate" ? SEGMENT_PILL_CANDIDATE : SEGMENT_PILL_EMPLOYER;

    if (isSegmentFirstFrame.current) {
      gsap.set(pill, { x: left, width, opacity: 1, ...colors });
      isSegmentFirstFrame.current = false;
    } else {
      gsap.to(pill, { x: left, width, duration: 0.38, ease: "power3.out" });
      gsap.to(pill, { ...colors, duration: 0.28, ease: "power2.out" });
    }

    const syncInstant = () => {
      const b = segmentBarRef.current;
      const p = segmentPillRef.current;
      const active =
        loginType === "candidate"
          ? segmentBtnCandidateRef.current
          : segmentBtnEmployerRef.current;
      if (!b || !p || !active) return;
      const br = b.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      gsap.set(p, { x: ar.left - br.left, width: ar.width });
    };

    const ro = new ResizeObserver(syncInstant);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      if (segmentPillRef.current) gsap.killTweensOf(segmentPillRef.current);
    };
  }, [loginType]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {loginType === "candidate"
            ? "Get discovered by Cayman's top employers"
            : "Find your next hire in the Cayman Islands"}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Sign in to get started — it's free
        </p>
      </div>

      <div
        ref={segmentBarRef}
        className="relative flex rounded-xl p-1 bg-white/[0.06] border border-white/10 gap-1"
        role="tablist"
        aria-label="Account type"
      >
        <div
          ref={segmentPillRef}
          className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg border border-solid opacity-0"
          aria-hidden
        />
        <button
          ref={segmentBtnCandidateRef}
          type="button"
          role="tab"
          aria-selected={loginType === "candidate"}
          onClick={() => setLoginType("candidate")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-2 sm:px-3 rounded-lg text-sm font-semibold min-h-[48px] transition-colors duration-200 ${
            loginType === "candidate"
              ? "text-cyan-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="text-left leading-tight">
            <span className="block">Job seekers</span>
            <span className="block text-[10px] font-normal opacity-80 sm:text-[11px]">Candidates</span>
          </span>
        </button>
        <button
          ref={segmentBtnEmployerRef}
          type="button"
          role="tab"
          aria-selected={loginType === "employer"}
          onClick={() => setLoginType("employer")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-2 sm:px-3 rounded-lg text-sm font-semibold min-h-[48px] transition-colors duration-200 ${
            loginType === "employer"
              ? "text-emerald-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="text-left leading-tight">
            <span className="block">Employers</span>
            <span className="block text-[10px] font-normal opacity-80 sm:text-[11px]">Hiring &amp; talent</span>
          </span>
        </button>
      </div>

      <ul className="space-y-2 -mt-2">
        {(loginType === "candidate"
          ? [
              "Build a profile that employers actively browse",
              "Express interest in jobs with one click",
              "Get matched to roles that fit your skills",
            ]
          : [
              "Browse candidates and reach out directly",
              "Post roles and manage applications in one place",
              "Skip the recruiter fees — connect with talent yourself",
            ]
        ).map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-neutral-400">
            <CheckCircle2
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                loginType === "candidate" ? "text-cyan-500" : "text-emerald-500"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <a
          href={`/api/auth/google?type=${loginType}`}
          className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-100 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </a>
        <a
          href={`/api/auth/linkedin?type=${loginType}`}
          className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-white text-sm font-medium hover:opacity-90 transition"
          style={{ backgroundColor: "#0A66C2" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Continue with LinkedIn
        </a>
      </div>

      <p className="text-xs text-neutral-600 text-center">
        We only use your name and email to create your account.
        <br />
        We'll never post on your behalf.
      </p>
    </div>
  );
}
