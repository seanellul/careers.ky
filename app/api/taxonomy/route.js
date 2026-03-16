import { NextResponse } from "next/server";
import {
  loadCISCO,
  buildCiscoTree,
  loadAggregates,
  loadEducationTypes,
  loadExperienceTypes,
  loadWorkTypes,
} from "@/lib/data";

export async function GET() {
  const [ciscoRows, aggregates, eduTypes, expTypes, workTypes] =
    await Promise.all([
      loadCISCO(),
      loadAggregates(),
      loadEducationTypes(),
      loadExperienceTypes(),
      loadWorkTypes(),
    ]);

  const tree = buildCiscoTree(ciscoRows);

  return NextResponse.json({
    tree,
    aggregates: Object.fromEntries(aggregates),
    eduTypes: Object.fromEntries(eduTypes),
    expTypes: Object.fromEntries(expTypes),
    workTypes: Object.fromEntries(workTypes),
  });
}
