export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployerSetupClient from "./EmployerSetupClient";

export const metadata = {
  title: "Employer Setup — careers.ky",
  description: "Link your employer account to your company on careers.ky",
};

export default async function EmployerSetupPage() {
  const session = await getSession();
  if (!session?.employerAccountId) redirect("/");
  if (session.employerId) redirect("/employer/dashboard");

  // Abandoned mid-flow? Let the wizard resume the pending selection.
  const pendingEmployer = session.pendingEmployerId
    ? { id: session.pendingEmployerId, name: session.pendingEmployerName }
    : null;

  return <EmployerSetupClient pendingEmployer={pendingEmployer} />;
}
