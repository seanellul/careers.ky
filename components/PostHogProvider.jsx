"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PostHogProvider({ children }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Respect Do Not Track
    if (navigator.doNotTrack === "1") return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false, // We capture manually for SPA nav
      capture_pageleave: true,
    });

    // Identify signed-in users so retention and funnels stitch across
    // sessions/devices. IDs match lib/analytics-server.js (no PII).
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (!s?.authenticated || !posthog.__loaded) return;
        if (s.candidateId) {
          posthog.identify(`candidate-${s.candidateId}`, { role: "candidate" });
        } else if (s.employerAccountId) {
          posthog.identify(`employer-${s.employerAccountId}`, {
            role: "employer",
            employer_id: s.employerId || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
