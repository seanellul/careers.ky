import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  description: "Sign in to careers.ky as a job seeker or employer.",
};

export default async function SignInPage() {
  const session = await getSession();
  if (session?.employerAccountId) redirect("/employer/dashboard");
  if (session?.candidateId) redirect("/dashboard");

  return (
    <main className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto h-64 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 animate-pulse" />
        }
      >
        <SignInClient />
      </Suspense>
    </main>
  );
}
