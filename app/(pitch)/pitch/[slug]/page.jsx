import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
import crypto from "crypto";
import { headers } from "next/headers";
import { getEmployerPitchData, logPitchView } from "@/lib/data";
import { personalizePitchHTML, getSegment } from "@/lib/pitch";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const employer = await getEmployerPitchData(slug);
  if (!employer) return {};

  const seg = getSegment(employer.primary_industry);
  return {
    title: `careers.ky for ${employer.name}`,
    description: seg.hook,
    openGraph: {
      title: `careers.ky for ${employer.name}`,
      description: seg.hook,
    },
  };
}

export default async function PitchPage({ params }) {
  const { slug } = await params;
  const employer = await getEmployerPitchData(slug);
  if (!employer) notFound();

  const templatePath = join(process.cwd(), "public/pitch/pitch-deck-template.html");
  const template = readFileSync(templatePath, "utf8");

  const html = personalizePitchHTML(template, {
    name: employer.name,
    slug: employer.slug,
    industry: employer.primary_industry,
    jobCount: Number(employer.job_count),
    hiringVolume: Math.max(1, Math.round(Number(employer.active_count) * 0.3)) || 1,
  });

  // Log view
  const hdrs = await headers();
  const referrer = hdrs.get("referer") || null;
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  logPitchView(slug, referrer, ipHash).catch(() => {});

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
