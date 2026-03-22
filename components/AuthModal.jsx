"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import t from "@/lib/theme";

export default function AuthModal({ open, onClose, type = "candidate" }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const loginType = type === "employer" ? "employer" : "candidate";

  return (
    <div
      ref={overlayRef}
      className={t.overlay + " flex items-center justify-center"}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <div className={t.modal}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-1">
          {loginType === "candidate"
            ? "Get discovered by Cayman's top employers"
            : "Find your next hire in the Cayman Islands"}
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Sign in to get started — it's free
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={`/api/auth/google?type=${loginType}`}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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

        <p className="text-xs text-neutral-400 text-center mt-4">
          We only use your name and email to create your account.
          <br />
          We'll never post on your behalf.
        </p>
      </div>
    </div>
  );
}
