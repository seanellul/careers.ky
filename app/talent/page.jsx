export const dynamic = "force-dynamic";

import { loadEducationTypes, loadExperienceTypes, loadLocationTypes, loadCISCO } from "@/lib/data";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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

  const ciscoUnits = ciscoRows
    .filter(r => String(r.sCISCO).length === 4)
    .map(r => ({ code: r.sCISCO, title: r.cTitle }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)",
          backgroundPosition: "0% 50%",
        }}
      />
      <Navigation />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <TalentSearchClient
          eduTypes={Object.fromEntries(eduTypes)}
          expTypes={Object.fromEntries(expTypes)}
          locTypes={Object.fromEntries(locTypes)}
          ciscoUnits={ciscoUnits}
        />
      </div>
      <Footer />
    </div>
  );
}
