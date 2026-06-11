export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getIntroductionsForEmployer } from "@/lib/data";
import PipelineBoardClient from "./PipelineBoardClient";

export const metadata = {
  title: "Pipeline — careers.ky",
  description: "Drag-and-drop candidate pipeline",
};

export default async function PipelinePage() {
  const session = await getSession();
  const introductions = await getIntroductionsForEmployer(session.employerAccountId);
  return <PipelineBoardClient initialIntroductions={introductions} />;
}
