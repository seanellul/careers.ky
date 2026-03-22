export const dynamic = "force-dynamic";

import { loadEducationTypes, loadExperienceTypes, loadLocationTypes, loadCISCO } from "@/lib/data";
import TalentSearchClient from "./TalentSearchClient";
import t from "@/lib/theme";

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

  const ciscoUnits = ciscoRows
    .filter(r => String(r.sCISCO).length === 4)
    .map(r => ({ code: r.sCISCO, title: r.cTitle }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className={`${t.page} w-full`}>
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={t.pageGradientStyle}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <TalentSearchClient
          eduTypes={Object.fromEntries(eduTypes)}
          expTypes={Object.fromEntries(expTypes)}
          locTypes={Object.fromEntries(locTypes)}
          ciscoUnits={ciscoUnits}
        />
      </div>
    </div>
  );
}
