"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import t from "@/lib/theme";

export default function EmployerError({ error, reset }) {
  return (
    <div className={t.page}>
      <div id="bg-gradient" aria-hidden className={t.pageGradient} style={t.pageGradientStyle} />
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Employer not found</h1>
            <p className="text-neutral-500 mb-6">We couldn't load this employer profile.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()}>Try Again</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/employers"}>Browse Employers</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
