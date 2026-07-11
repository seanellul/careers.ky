"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";

// First-visit cookie banner. Renders nothing once a choice is stored, and is
// position:fixed, so it never causes layout shift. Analytics (PostHog) only
// initializes if the visitor picks "Accept analytics" — see PostHogProvider.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-sm z-50"
    >
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-4 sm:p-5">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
          Cookies on careers.ky
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
          We use one essential cookie to keep you signed in. With your permission we&rsquo;d also
          use analytics to understand how the platform is used. See our{" "}
          <Link href="/privacy" className="text-primary-500 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => choose("essential")}>
            Essential only
          </Button>
          <Button size="sm" className="flex-1" onClick={() => choose("analytics")}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
