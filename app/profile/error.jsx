"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ProfileError({ error, reset }) {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />
      <Navigation />
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Profile error</h1>
            <p className="text-neutral-400 mb-6">We couldn't load your profile. Please try again.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()}>Try Again</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/"}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
