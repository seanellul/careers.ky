export const dynamic = "force-dynamic";

import { getEmployerList } from "@/lib/data";
import EmployerListClient from "./EmployerListClient";

export const metadata = {
  title: "Employers — Companies Hiring in Cayman",
  description: "Browse 3,500+ employers in the Cayman Islands. View hiring trends, salary ranges, and active job postings for each company.",
};

export default async function EmployersPage() {
  const employers = await getEmployerList();
  return <EmployerListClient employers={employers} />;
}
