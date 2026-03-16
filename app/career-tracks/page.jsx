import { Suspense } from "react";
import {
  loadCISCO,
  buildCiscoTree,
  loadAggregates,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
} from "@/lib/data";
import CareerTracksClient from "./CareerTracksClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Career Tracks — Explore Cayman Industries",
  description:
    "Browse the Cayman Islands job market by industry category. View salary ranges, job counts, education requirements, and career pathways.",
};

export default async function CareerTracksPage() {
  const [ciscoRows, aggregates, workTypes, eduTypes, expTypes] =
    await Promise.all([
      loadCISCO(),
      loadAggregates(),
      loadWorkTypes(),
      loadEducationTypes(),
      loadExperienceTypes(),
    ]);

  const tree = buildCiscoTree(ciscoRows);

  // Serialize Maps for client
  return (
    <Suspense fallback={null}>
      <CareerTracksClient
        tree={tree}
        aggregates={Object.fromEntries(aggregates)}
        workTypes={Object.fromEntries(workTypes)}
        eduTypes={Object.fromEntries(eduTypes)}
        expTypes={Object.fromEntries(expTypes)}
      />
    </Suspense>
  );
}
