import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-12 pb-16 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-neutral-400">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8">
              <img
                src="/images/logo-careers.png"
                alt="careers.ky logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-medium text-neutral-200">careers.ky</div>
              <div className="text-xs">Live Job Market Data for Caymanians</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link href="/career-tracks" className="hover:text-neutral-200">
              Career Tracks
            </Link>
            <Link href="/jobs" className="hover:text-neutral-200">
              Live Search
            </Link>
            <a href="#faq" className="hover:text-neutral-200">
              FAQ
            </a>
            <a
              href="https://my.egov.ky/web/myworc/find-a-job#/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-200"
            >
              WORC Portal ↗
            </a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/5 text-xs text-center md:text-left">
          <p>
            Built with real WORC data. Job postings updated daily from official
            government sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
