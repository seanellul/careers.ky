import Link from "next/link";
import Logo from "@/components/Logo";

import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  return (
    <footer className="pt-12 pb-16 border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-neutral-500 dark:text-neutral-400">
        <div className="mb-8">
          <NewsletterSignup />
        </div>
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8">
              <Logo />
            </div>
            <div>
              <div className="font-medium text-neutral-700 dark:text-neutral-200">careers.ky</div>
              <div className="text-xs">A Caymanian-First Careers Platform</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-4 sm:gap-y-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
                For Job Seekers
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/careers?tab=career-tracks"
                  className="hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Career Tracks
                </Link>
                <Link
                  href="/careers?tab=jobs"
                  className="hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Live Search
                </Link>
                <Link
                  href="/profile/setup"
                  className="hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Create Profile
                </Link>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
                For Employers
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/employers"
                  className="hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Employer Directory
                </Link>
                <Link href="/talent" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                  Search Talent
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/about" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              About
            </Link>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              FAQ
            </a>
            <Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-center md:text-left">
          <p>
            Making hiring talent visible, accessible and fair. Job postings synced daily from WORC.
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-center text-neutral-400 dark:text-neutral-500">
          Built by{" "}
          <a
            href="https://seanellul.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Sean Ellul
          </a>
          <span className="mx-2">·</span>
          Also:{" "}
          <a
            href="https://legislation.ky"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Legislation.ky
          </a>
          <span className="mx-1">|</span>
          <a
            href="https://constitution.ky"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Constitution.ky
          </a>
          <span className="mx-1">|</span>
          <a
            href="https://cheap.ky"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Cheap.ky
          </a>
          <span className="mx-1">|</span>
          <a
            href="https://caybooks.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            CayBooks
          </a>
        </div>
      </div>
    </footer>
  );
}
