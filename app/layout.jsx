import "@/styles/globals.css";
import { Suspense } from "react";
import PostHogProvider, { PostHogPageView } from "@/components/PostHogProvider";
import { SessionProvider } from "@/components/SessionProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DevToolbar from "@/components/DevToolbar";

export const metadata = {
  title: {
    default: "careers.ky — A Caymanian-First Careers Platform",
    template: "%s | careers.ky",
  },
  description:
    "Making hiring talent visible, accessible and fair. Find Caymanian talent directly, get matched to roles, and skip the recruiter.",
  openGraph: {
    title: "careers.ky — A Caymanian-First Careers Platform",
    description:
      "Making hiring talent visible, accessible and fair. Find Caymanian talent directly, get matched to roles, and skip the recruiter.",
    url: "https://careers.ky",
    siteName: "careers.ky",
    locale: "en_KY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "careers.ky — A Caymanian-First Careers Platform",
    description:
      "Making hiring talent visible, accessible and fair. Find Caymanian talent directly, get matched to roles, and skip the recruiter.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" >
      <body className="min-h-screen bg-amber-50 text-slate-900 antialiased">
        <PostHogProvider>
          <SessionProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <Navigation />
            {children}
            <Footer />
            <DevToolbar />
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
