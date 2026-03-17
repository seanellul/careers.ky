export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Introductions — careers.ky",
  description: "View and respond to employer introduction requests",
};

export default async function IntroductionsPage() {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  // Introductions now live in the candidate dashboard
  redirect("/dashboard/introductions");
}
