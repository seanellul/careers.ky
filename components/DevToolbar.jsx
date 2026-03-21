"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

export default function DevToolbar() {
  const [switching, setSwitching] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const router = useRouter();
  const { session, loading, refresh } = useSession();

  // Only show in development
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return null;
  }

  const switchTo = async (role) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/dev/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        refresh();
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  /** No OAuth — creates a synthetic DB user (dev only). */
  const loginDevCandidate = async (fresh) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/dev/login-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fresh }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        refresh();
        router.push(data.defaultNext || "/dashboard");
        router.refresh();
      } else {
        console.error("dev/login-candidate:", data?.error || res.status);
      }
    } finally {
      setSwitching(false);
    }
  };

  const currentRole = session?.employerAccountId ? "employer" : session?.candidateId ? "candidate" : "none";

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-orange-500 text-white text-xs font-bold grid place-items-center shadow-lg hover:bg-orange-400 transition"
        title="Dev Toolbar"
      >
        D
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-neutral-900 border border-orange-500/50 rounded-xl shadow-2xl p-3 text-xs text-neutral-200 space-y-2 w-64 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-orange-400">DEV TOOLBAR</span>
        <button onClick={() => setMinimized(true)} className="text-neutral-500 hover:text-white text-sm leading-none">&minus;</button>
      </div>

      <div className="text-neutral-400">
        Current: <span className={`font-semibold ${currentRole === "employer" ? "text-cyan-300" : currentRole === "candidate" ? "text-emerald-300" : "text-red-300"}`}>
          {currentRole === "employer" ? "Employer" : currentRole === "candidate" ? "Candidate" : "Not signed in"}
        </span>
      </div>

      {session && (
        <div className="text-neutral-500 truncate">
          {session.employerName || session.candidateName || "—"}
        </div>
      )}

      <div className="text-neutral-500 border-t border-white/10 pt-2 mt-1">
        Test without OAuth:
      </div>
      <button
        type="button"
        onClick={() => loginDevCandidate(true)}
        disabled={switching}
        className="w-full px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 transition text-left"
      >
        New candidate → profile setup
      </button>
      <button
        type="button"
        onClick={() => loginDevCandidate(false)}
        disabled={switching}
        className="w-full px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition text-left"
      >
        Stable dev candidate → dashboard
      </button>

      <div className="text-neutral-500 border-t border-white/10 pt-2 mt-1">
        Switch existing DB user:
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => switchTo("employer")}
          disabled={switching}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
            currentRole === "employer"
              ? "bg-cyan-500/30 text-cyan-300 border border-cyan-300/30"
              : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-cyan-300/30"
          }`}
        >
          Employer
        </button>
        <button
          onClick={() => switchTo("candidate")}
          disabled={switching}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
            currentRole === "candidate"
              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-300/30"
              : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-emerald-300/30"
          }`}
        >
          Candidate
        </button>
      </div>

      {switching && <div className="text-center text-orange-300">Switching...</div>}
    </div>
  );
}
