"use client";

import { Clock } from "lucide-react";

export default function VerificationBanner({ verificationStatus }) {
  if (verificationStatus !== "pending") return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
      <Clock className="w-5 h-5 text-amber-300 shrink-0" />
      <p className="text-sm text-amber-200">
        Your account is pending verification. Some features may be limited. We&apos;ll email you once approved.
      </p>
    </div>
  );
}
