export const dynamic = "force-dynamic";

import { loadEducationTypes, loadExperienceTypes, loadLocationTypes, loadCISCO } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { getEmployerTier, hasFeature } from "@/lib/entitlements";
import TalentSearchClient from "@/app/talent/TalentSearchClient";

export const metadata = {
  title: "Talent Search — careers.ky",
  description: "Search the Cayman talent pool for your next hire.",
};

export default async function EmployerTalentPage() {
  const [eduTypes, expTypes, locTypes, ciscoRows, session] = await Promise.all([
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
    loadCISCO(),
    getSession(),
  ]);

  // Offshore Talent tab entitlement (CEO spec §25) — free tier sees the
  // tab locked; the API independently refuses overseas rows regardless.
  const tier = await getEmployerTier(session?.employerId);
  const offshoreEntitled = hasFeature(tier, "overseas_talent");

  const ciscoUnits = ciscoRows
    .filter((r) => String(r.sCISCO).length === 4)
    .map((r) => ({ code: r.sCISCO, title: r.cTitle }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <TalentSearchClient
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
      ciscoUnits={ciscoUnits}
      offshoreEntitled={offshoreEntitled}
    />
  );
}
