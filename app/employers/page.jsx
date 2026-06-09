import { getCachedEmployerList } from "@/lib/cached-data";
import EmployerListClient from "./EmployerListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employers — Companies Hiring in Cayman",
  description:
    "Browse 3,500+ employers in the Cayman Islands. View hiring trends, salary ranges, and active job postings for each company.",
};

export default async function EmployersPage() {
  const employers = await getCachedEmployerList();
  return <EmployerListClient employers={employers} />;
}
