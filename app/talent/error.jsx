"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import t from "@/lib/theme";

export default function TalentError({ error, reset }) {
  return (
    <div className={t.page}>
      <div id="bg-gradient" aria-hidden className={t.pageGradient} style={t.pageGradientStyle} />
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-white border-neutral-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">Talent search error</h1>
            <p className="text-neutral-500 mb-6">We couldn't load the talent search. Please try again.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()}>Try Again</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/"}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
