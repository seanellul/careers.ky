import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { Building2, CheckCircle, XCircle, Clock, LogIn } from "lucide-react";
import Link from "next/link";
import t from "@/lib/theme";

export const metadata = { title: "Join Team — careers.ky" };

export default async function JoinTeamPage({ searchParams }) {
  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    return <ErrorState title="Invalid Link" message="No invitation token provided." />;
  }

  const sql = getDb();

  // Validate token
  const invitations = await sql`
    SELECT ei.*, e.name as employer_name
    FROM employer_invitations ei
    JOIN employers e ON ei.employer_id = e.id
    WHERE ei.token = ${token}
  `;

  if (!invitations.length) {
    return <ErrorState title="Invitation Not Found" message="This invitation link is invalid or has already been used." />;
  }

  const invitation = invitations[0];

  if (invitation.accepted_at) {
    return <ErrorState title="Already Accepted" message="This invitation has already been accepted." />;
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return <ErrorState title="Invitation Expired" message="This invitation has expired. Please ask your team to send a new one." />;
  }

  // Check if user is signed in as an employer
  const session = await getSession();

  if (!session?.employerAccountId) {
    // Not signed in — redirect to sign-in with return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const returnUrl = encodeURIComponent(`/employer/join?token=${token}`);
    return (
      <CenteredCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 grid place-items-center">
            <LogIn className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Sign In Required</h2>
            <p className="text-neutral-500 text-sm">You&apos;ve been invited to join {invitation.employer_name}</p>
          </div>
        </div>
        <p className="text-neutral-600 text-sm mb-4">
          Please sign in as an employer to accept this invitation.
        </p>
        <Link
          href={`/sign-in?type=employer&returnUrl=${returnUrl}`}
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm"
        >
          Sign In to Accept
        </Link>
      </CenteredCard>
    );
  }

  // Check if already linked to a different company
  if (session.employerId && session.employerId !== invitation.employer_id) {
    return (
      <ErrorState
        title="Already Linked"
        message={`Your account is already linked to ${session.employerCompanyName || "another company"}. You cannot join a different company.`}
      />
    );
  }

  // Accept the invitation — link account to employer
  await sql`
    UPDATE employer_accounts
    SET employer_id = ${invitation.employer_id},
        role = ${invitation.role},
        verification_status = 'verified',
        verified_at = NOW(),
        verified_by = 'invitation',
        invited_by = ${invitation.invited_by}
    WHERE id = ${session.employerAccountId}
  `;

  // Mark employer as claimed
  await sql`UPDATE employers SET claimed = TRUE WHERE id = ${invitation.employer_id}`;

  // Mark invitation as accepted
  await sql`UPDATE employer_invitations SET accepted_at = NOW() WHERE id = ${invitation.id}`;

  redirect("/employer/dashboard");
}

function CenteredCard({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#FEFCF3] text-neutral-800 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(1200px 1200px at 10% 10%, rgba(0,119,182,0.06) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(244,162,97,0.06) 0%, transparent 60%)",
        }}
      />
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full">
        {children}
      </div>
    </div>
  );
}

function ErrorState({ title, message }) {
  return (
    <CenteredCard>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-red-50 grid place-items-center">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <p className="text-neutral-500 text-sm mb-4">{message}</p>
      <Link
        href="/"
        className="inline-block text-primary-500 hover:text-primary-600 text-sm transition"
      >
        Go to Homepage
      </Link>
    </CenteredCard>
  );
}
