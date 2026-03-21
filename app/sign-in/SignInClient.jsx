"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SignInForm from "@/components/SignInForm";

function safeInternalPath(path) {
  if (!path || typeof path !== "string") return null;
  const p = path.trim();
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  return p;
}

export default function SignInClient() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const nextParam = searchParams.get("next");

  const initialLoginType = typeParam === "employer" ? "employer" : "candidate";
  const formKey = useMemo(
    () => `${initialLoginType}-${nextParam || ""}`,
    [initialLoginType, nextParam]
  );

  useEffect(() => {
    const next = safeInternalPath(nextParam);
    if (next) {
      try {
        localStorage.setItem("ck_auth_redirect", next);
      } catch {}
    }
  }, [nextParam]);

  return <SignInForm key={formKey} initialLoginType={initialLoginType} />;
}
