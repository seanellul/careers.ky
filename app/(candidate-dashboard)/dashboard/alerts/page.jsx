export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMatchAlerts } from "@/lib/data";
import AlertsClient from "./AlertsClient";

export const metadata = {
  title: "Alerts — Dashboard — careers.ky",
  description: "Manage your job match alerts",
};

export default async function DashboardAlertsPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  const alerts = await getMatchAlerts(session.candidateId);

  return <AlertsClient alerts={alerts} />;
}
