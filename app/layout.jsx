import "@/styles/globals.css";
import { Suspense } from "react";
import PostHogProvider, { PostHogPageView } from "@/components/PostHogProvider";
import DevToolbar from "@/components/DevToolbar";

export const metadata = {
  title: {
    default: "careers.ky — Live Job Market Data for Cayman",
    template: "%s | careers.ky",
  },
  description:
    "Access live job postings, salary data, industry trends, and career planning tools. Built with real WORC data to help Caymanians make informed career decisions.",
  openGraph: {
    title: "careers.ky — Live Job Market Data for Cayman",
    description:
      "Access live job postings, salary data, industry trends, and career planning tools for the Cayman Islands.",
    url: "https://careers.ky",
    siteName: "careers.ky",
    locale: "en_KY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "careers.ky — Live Job Market Data for Cayman",
    description:
      "Access live job postings, salary data, industry trends, and career planning tools for the Cayman Islands.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
          <DevToolbar />
        </PostHogProvider>
      </body>
    </html>
  );
}
