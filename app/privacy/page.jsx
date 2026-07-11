/*
  DRAFT — pending legal review.
  This privacy policy was drafted in-house under the Cayman Islands Data
  Protection Act (2021 Revision) and has NOT yet been reviewed by counsel.
  Contact email is a placeholder (team@careers.ky) until the shared inbox exists.
*/
import t from "@/lib/theme";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How careers.ky collects, uses, and protects your personal data under the Cayman Islands Data Protection Act.",
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

export default function PrivacyPage() {
  return (
    <div className={t.page}>
      {/* Emit a real HTML comment in the served page marking this as a draft. */}
      <div
        aria-hidden
        className="hidden"
        dangerouslySetInnerHTML={{
          __html: "<!-- DRAFT privacy policy: written in-house, pending legal review -->",
        }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Privacy <span className="text-primary-500">Policy</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
          Last updated: July 2026
        </p>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-16">
          How we collect, use, and protect your personal data — written to comply with the Cayman
          Islands Data Protection Act (2021 Revision).
        </p>

        <Section title="Who We Are">
          <p>
            careers.ky is a Caymanian-first careers platform operated from the Cayman Islands. For
            the purposes of the Cayman Islands Data Protection Act (2021 Revision) (the
            &ldquo;DPA&rdquo;), careers.ky is the data controller of the personal data described in
            this policy.
          </p>
          <p>
            Questions, requests, or concerns about your data can be sent to{" "}
            <a href="mailto:team@careers.ky" className="text-primary-500 hover:underline">
              team@careers.ky
            </a>
            .
          </p>
        </Section>

        <Section title="What We Collect">
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Candidate profiles.
            </span>{" "}
            When you create a profile we collect your name, email address, and the information you
            choose to add: phone number, LinkedIn and portfolio links, headline and bio, education
            level, experience level, location, skills, occupation interests, availability, notice
            period, work-type and industry preferences, and salary expectations (including current
            salary if you provide it).
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Immigration and employment status.
            </span>{" "}
            You may tell us whether you are Caymanian, hold permanent residency, are married to a
            Caymanian, or hold or require a work permit. We treat this as sensitive information: it
            is collected only from you, used only to operate the platform&rsquo;s
            Caymanian-preference features (such as status badges and employer search filters you
            control), and never sold or shared outside the visibility rules described below.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">Documents.</span>{" "}
            If you upload documents (CV, proof of status, police clearance, references) they are
            stored in a private document store and are accessible only through authenticated
            requests. Status-proof documents are viewed only by our verification team to grant the
            verified badge — employers never see the documents themselves.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Employer accounts.
            </span>{" "}
            For employer users we collect your name, email address, work email, role, company
            affiliation, verification records, and the declaration that you are not a recruitment
            agency.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Automatically.
            </span>{" "}
            We use an essential session cookie to keep you signed in, and standard server logs (IP
            address, request details) for security and reliability. Optional analytics data is
            collected only with your consent — see &ldquo;Cookies &amp; Analytics&rdquo; below.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">Newsletter.</span>{" "}
            If you subscribe to The Careers.ky Briefing we store your email address and an
            unsubscribe token. Every issue contains a one-click unsubscribe link.
          </p>
        </Section>

        <Section title="How We Use Your Data">
          <p>We use personal data to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>show your profile to employers according to the visibility settings you choose;</li>
            <li>match you with roles and send job alerts you set up;</li>
            <li>
              operate Express Interest and introductions between candidates and employers,
              including notifications and emails about them;
            </li>
            <li>verify candidate status (verified badge) and employer legitimacy;</li>
            <li>send transactional email such as sign-in links and introduction updates;</li>
            <li>send the weekly newsletter to subscribers who opted in;</li>
            <li>understand how the platform is used (analytics, only with your consent); and</li>
            <li>keep the platform secure and prevent abuse.</li>
          </ul>
        </Section>

        <Section title="Who Sees Your Data">
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">Employers</span>{" "}
            see candidate profiles only according to your profile type: an{" "}
            <em>open</em> profile is searchable by registered employers, a <em>selective</em>{" "}
            profile is searchable except by employers you block, and a <em>closed</em> profile is
            hidden from all employer searches. Employers on your block list can never see your
            profile under any setting. Your contact details are shared with a specific employer
            only when an introduction happens between you.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              We do not sell personal data
            </span>{" "}
            to anyone, and we do not share it with third parties for their own marketing.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Service providers.
            </span>{" "}
            We rely on a small number of processors to run the platform: Vercel (hosting and
            private document storage), Neon (database, hosted in the eastern United States), Resend
            (email delivery), and PostHog (analytics, only with your consent). This means your data
            is transferred to and stored in the United States and other jurisdictions outside the
            Cayman Islands; we use providers that commit to contractual data-protection safeguards
            consistent with the DPA&rsquo;s requirements for international transfers.
          </p>
          <p>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Legal requirements.
            </span>{" "}
            We may disclose data where we are required to by Cayman Islands law or a lawful
            request from a competent authority.
          </p>
        </Section>

        <Section title="Cookies & Analytics">
          <p>
            We keep cookies to a minimum. The <code>ck_session</code> cookie is essential — it
            keeps you signed in and the platform does not work without it. Your theme preference
            and cookie choice are stored in your browser&rsquo;s local storage.
          </p>
          <p>
            Analytics (PostHog) runs only if you choose &ldquo;Accept analytics&rdquo; in the
            cookie banner. If you decline, no analytics code is loaded at all. We also respect your
            browser&rsquo;s Do Not Track setting. To change your choice later, clear this
            site&rsquo;s data in your browser and you will be asked again on your next visit.
          </p>
        </Section>

        <Section title="How Long We Keep Data">
          <p>
            We keep your account data for as long as your account exists. If you delete your
            account (see below), your profile, documents, skills, interests, introductions,
            alerts, notifications, and sessions are deleted. Job postings synced from the public
            WORC feed are public data and are retained independently of any account. Routine
            database backups may retain deleted records for a limited period before they expire.
          </p>
        </Section>

        <Section title="Your Rights Under the DPA">
          <p>The DPA gives you rights over your personal data, including the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">access</span>{" "}
              the personal data we hold about you;
            </li>
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">correct</span>{" "}
              inaccurate data — most profile data can be edited directly from your profile page;
            </li>
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">erasure</span>{" "}
              — you can delete your account yourself at any time from your profile page, or ask us
              to do it;
            </li>
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                object to or stop
              </span>{" "}
              processing that causes damage or distress, and stop direct marketing (every
              newsletter has an unsubscribe link); and
            </li>
            <li>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">complain</span>{" "}
              to the Office of the Ombudsman of the Cayman Islands (
              <a
                href="https://ombudsman.ky"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                ombudsman.ky
              </a>
              ), the supervisory authority for data protection in the Cayman Islands.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a href="mailto:team@careers.ky" className="text-primary-500 hover:underline">
              team@careers.ky
            </a>
            . We will respond within the timelines the DPA requires.
          </p>
        </Section>

        <Section title="Deleting Your Account">
          <p>
            Candidates can delete their account from the bottom of their profile page; employer
            users can delete their account from their profile settings. Deletion removes your
            personal data as described in &ldquo;How Long We Keep Data&rdquo;. Deleting an employer
            user account does not delete the public company page, which is built from public
            information.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use encrypted connections (HTTPS), signed-in access controls on every candidate and
            employer route, private storage for uploaded documents, and short-lived sign-in links
            instead of passwords. No system is perfectly secure, but we design for data minimisation —
            we only collect what the platform needs to work.
          </p>
        </Section>

        <Section title="Children">
          <p>
            careers.ky is a platform for people of working age and is not directed at children. We
            do not knowingly collect personal data from anyone under 16.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If we make material changes to this policy we will update the date at the top of this
            page and, where the change significantly affects how we handle your data, notify you
            by email or an in-product notice.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            careers.ky — Cayman Islands
            <br />
            <a href="mailto:team@careers.ky" className="text-primary-500 hover:underline">
              team@careers.ky
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
