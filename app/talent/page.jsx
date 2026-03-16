export const dynamic = "force-dynamic";

import { loadEducationTypes, loadExperienceTypes, loadLocationTypes, loadCISCO } from "@/lib/data";
import TalentSearchClient from "./TalentSearchClient";

export const metadata = {
  title: "Talent Search — Find Cayman Talent",
  description: "Search the Cayman talent pool. Find candidates by skills, education, experience, and career interests.",
};

export default async function TalentPage() {
  const [eduTypes, expTypes, locTypes, ciscoRows] = await Promise.all([
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
    loadCISCO(),
  ]);

  // Build a flat list of CISCO units (4-digit codes) for the filter
  const ciscoUnits = ciscoRows
    .filter(r => String(r.sCISCO).length === 4)
    .map(r => ({ code: r.sCISCO, title: r.cTitle }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <TalentSearchClient
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
      ciscoUnits={ciscoUnits}
    />
  );
}
