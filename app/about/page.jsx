import t from "@/lib/theme";

export const metadata = {
  title: "About",
  description:
    "A Caymanian-First Careers Platform, making hiring talent visible, accessible and fair.",
};

export default function AboutPage() {
  return (
    <div className={t.page}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          About <span className="text-primary-500">careers.ky</span>
        </h1>
        <p className="text-lg text-neutral-600 mb-16">
          A Caymanian-First Careers Platform, making hiring talent visible,
          accessible and fair.
        </p>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">Why We Exist</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>
              Caymanian talent deserves better. Qualified people send resumes
              into the void. They don&apos;t know if they&apos;re being
              considered. They don&apos;t know if they lost out to
              someone&apos;s connection. The Caymanian preference system exists
              on paper — but without infrastructure, it can&apos;t work the way
              it should.
            </p>
            <p>
              On the other side, employers rely on recruiters because
              there&apos;s nowhere else to look — paying 15-25% of first-year
              salary per hire. That&apos;s CI$10-16K per person. For a firm
              hiring 10 people a year, that&apos;s CI$90-150K in recruiter fees
              alone.
            </p>
            <p>
              There&apos;s no platform connecting both sides directly. No
              infrastructure making Caymanian talent visible to every employer.
              No system ensuring fair consideration.
            </p>
            <p className="text-neutral-900 font-medium">
              We built careers.ky to change that.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
          <div className="space-y-6">
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-primary-500 mb-2">
                For Caymanians
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                We show you to every employer on the island. Create a profile
                once — education, experience, skills. Get matched to roles
                automatically. Get introduced directly. Never wonder if you were
                considered again.
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-emerald-600 mb-2">
                For Employers
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                We replace your recruiter. Search Caymanian talent by skill,
                education, and experience. Introduction system. Match alerts.
                One monthly fee instead of 15-25% per hire. A firm hiring 10
                people a year saves CI$90-150K.
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-purple-600 mb-2">
                For the System
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                We create timestamped records. Structured feedback. Proof that
                employers tried. The Caymanian preference system gets teeth.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">Who We Serve</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>
              <span className="text-neutral-900 font-medium">Caymanians.</span> Young
              professionals, career changers, people re-entering the workforce.
              People with talent who deserve to be seen.
            </p>
            <p>
              <span className="text-neutral-900 font-medium">Employers.</span> Law
              firms, hospitality, financial services, government. Anyone hiring
              in Cayman. Anyone tired of paying recruiter fees.
            </p>
            <p>
              <span className="text-neutral-900 font-medium">
                WORC &amp; Government.
              </span>{" "}
              We make the preference system transparent. We give you data. We
              make it actually work.
            </p>
            <p>
              We don&apos;t pick sides. We serve all three. The platform is only
              strong if everyone wins.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-primary-500 mb-3">
                For Candidates
              </h3>
              <ol className="space-y-3 text-neutral-600">
                <li className="flex gap-3">
                  <span className="text-primary-500 font-semibold">1.</span>
                  Create your profile (free, takes 10 minutes)
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-500 font-semibold">2.</span>
                  Get matched to roles that fit your skills and experience
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-500 font-semibold">3.</span>
                  Get introduced directly to employers — no recruiter middleman
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-600 mb-3">
                For Employers
              </h3>
              <ol className="space-y-3 text-neutral-600">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-semibold">1.</span>
                  Subscribe to careers.ky Pro
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-semibold">2.</span>
                  Search Caymanian talent by skill, education, experience,
                  location
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-semibold">3.</span>
                  Send introductions directly. Build relationships. Hire faster.
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>
              We&apos;re committed to{" "}
              <span className="text-neutral-900 font-medium">Caymanian talent</span>.
              You&apos;re not a checkbox — you&apos;re the reason we exist.
            </p>
            <p>
              We&apos;re committed to{" "}
              <span className="text-neutral-900 font-medium">transparency</span>.
              Both sides of the table see what&apos;s happening. You get proof
              you were considered. Employers get proof they tried.
            </p>
            <p>
              We&apos;re committed to{" "}
              <span className="text-neutral-900 font-medium">fairness</span>.
              You&apos;re hired on merit. Your network shouldn&apos;t matter.
              Your talent should.
            </p>
            <p>
              We&apos;re committed to{" "}
              <span className="text-neutral-900 font-medium">the island</span>. When
              Cayman hires better, Cayman wins.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
