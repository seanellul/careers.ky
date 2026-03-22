"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import t from "@/lib/theme";

export default function Error({ error, reset }) {
  return (
    <div className={t.page}>
      <div id="bg-gradient" aria-hidden className={t.pageGradient} style={t.pageGradientStyle} />

      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 grid place-items-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-neutral-500 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()} className="gap-2">
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = "/"}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
