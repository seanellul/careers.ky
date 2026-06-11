export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getEmployerNativePostings } from "@/lib/native-jobs";
import EmployerJobsClient from "./EmployerJobsClient";

export const metadata = {
  title: "Job Postings — careers.ky",
  description: "Manage your job postings on careers.ky",
};

export default async function EmployerJobsPage() {
  const session = await getSession();
  const postings = await getEmployerNativePostings(session.employerId);
  return <EmployerJobsClient postings={postings} />;
}
