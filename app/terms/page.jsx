/*
  DRAFT — pending legal review.
  These terms were drafted in-house and have NOT yet been reviewed by counsel.
  Contact email is a placeholder (team@careers.ky) until the shared inbox exists.
*/
import Link from "next/link";
import t from "@/lib/theme";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of careers.ky.",
};

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className={t.page}>
      {/* Emit a real HTML comment in the served page marking this as a draft. */}
      <div
        aria-hidden
        className="hidden"
        dangerouslySetInnerHTML={{
          __html: "<!-- DRAFT terms of service: written in-house, pending legal review -->",
        }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Terms of <span className="text-primary-500">Service</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
          Last updated: July 2026
        </p>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-16">
          The rules for using careers.ky — please read them before creating an account.
        </p>

        <Section title="1. Agreement">
          <p>
            careers.ky is a Caymanian-first careers platform operated from the Cayman Islands
            (&ldquo;careers.ky&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the platform
            you agree to these terms. If you do not agree, please do not use the platform. Our{" "}
            <Link href="/privacy" className="text-primary-500 hover:underline">
              Privacy Policy
            </Link>{" "}
            explains how we handle personal data and forms part of these terms.
          </p>
        </Section>

        <Section title="2. What the Platform Is">
          <p>
            careers.ky connects Caymanian talent with employers hiring in the Cayman Islands. It
            includes job listings synced from the public WORC (Workforce Opportunities &amp;
            Residency Cayman) feed, jobs posted natively by employers, candidate profiles, talent
            search for verified employers, and an introduction system (&ldquo;Express
            Interest&rdquo;) that connects the two sides directly.
          </p>
          <p>
            We are an introduction platform, not a recruitment agency and not an employer. We do
            not guarantee interviews, offers, hires, or the accuracy of any listing, profile, or
            introduction outcome. Hiring decisions are made entirely between candidates and
            employers.
          </p>
        </Section>

        <Section title="3. Accounts">
          <p>
            You must provide accurate information when creating an account and keep it up to date.
            Sign-in is by email link or supported sign-in providers — you are responsible for
            keeping access to your email account secure. You must be of legal working age to use
            the platform.
          </p>
        </Section>

        <Section title="4. Candidate Terms">
          <ul className="list-disc pl-6 space-y-2">
            <li>Your profile must be truthful — including your status, education, and experience.</li>
            <li>Documents you upload must be genuine and belong to you.</li>
            <li>
              You control your visibility: open, selective, or closed, plus a block list of
              employers who can never see your profile. Creating a profile is free.
            </li>
          </ul>
        </Section>

        <Section title="5. Employer Terms">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                Recruitment agencies may not register.
              </span>{" "}
              The platform exists to connect employers and candidates directly. Registering as an
              employer requires a declaration that you are not acting as a recruitment agency, and
              accounts found to be agencies will be removed.
            </li>
            <li>
              You may use candidate data only to evaluate and contact candidates for genuine hiring
              at your organisation. Once you receive a candidate&rsquo;s data you are responsible
              for handling it in line with the Cayman Islands Data Protection Act.
            </li>
            <li>
              No scraping, bulk export, or re-sale of candidate data, and no contacting candidates
              for anything other than the role(s) at hand.
            </li>
            <li>
              Job postings you create must be real, lawful vacancies at your organisation, with
              honest salary and requirement information.
            </li>
            <li>
              Employer verification is required before searching talent, and paid subscription
              tiers may apply to employer features.
            </li>
          </ul>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>impersonate any person or organisation, or misrepresent your affiliation;</li>
            <li>post content that is unlawful, discriminatory, defamatory, or misleading;</li>
            <li>attempt to access accounts or data that are not yours;</li>
            <li>interfere with the platform&rsquo;s operation or security; or</li>
            <li>use the platform to send spam or unsolicited marketing.</li>
          </ul>
          <p>
            We may suspend or remove accounts that break these terms, and remove content at our
            discretion.
          </p>
        </Section>

        <Section title="7. WORC Data">
          <p>
            Listings synced from the WORC feed are public government data reproduced for
            convenience. careers.ky is an independent platform and is not affiliated with,
            endorsed by, or acting for WORC or the Cayman Islands Government. Listings may lag,
            contain errors, or be withdrawn at source; always verify details with the employer or
            WORC before acting on them.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            The platform, its design, and its software remain ours. Content you submit (profiles,
            postings, company descriptions) remains yours; you grant us a licence to host, display,
            and share it as needed to operate the platform under your settings.
          </p>
        </Section>

        <Section title="9. Termination & Account Deletion">
          <p>
            You can delete your account yourself at any time — candidates from their profile page,
            employer users from their profile settings — and deletion takes effect immediately as
            described in the{" "}
            <Link href="/privacy" className="text-primary-500 hover:underline">
              Privacy Policy
            </Link>
            . We may suspend or terminate accounts that violate these terms or the law.
          </p>
        </Section>

        <Section title="10. Disclaimers & Liability">
          <p>
            The platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the
            maximum extent permitted by Cayman Islands law, we disclaim warranties of any kind and
            are not liable for indirect or consequential losses, lost opportunities, hiring
            outcomes, or the conduct of other users. Nothing in these terms excludes liability
            that cannot lawfully be excluded.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these terms from time to time. If we make material changes we will
            update the date at the top of this page and, where appropriate, notify you. Continuing
            to use the platform after changes take effect means you accept the updated terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These terms are governed by the laws of the Cayman Islands, and disputes are subject
            to the exclusive jurisdiction of the courts of the Cayman Islands.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            <a href="mailto:team@careers.ky" className="text-primary-500 hover:underline">
              team@careers.ky
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
