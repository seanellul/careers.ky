export const dynamic = "force-dynamic";

import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  // Get all CISCO codes that have active postings
  const rows = await sql`
    SELECT DISTINCT oc.cisco_code, MAX(jp.synced_at) as last_synced
    FROM job_postings jp
    INNER JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
    WHERE jp.status = 'Active' AND jp.end_date > NOW()
    GROUP BY oc.cisco_code
    ORDER BY oc.cisco_code
  `;

  const now = new Date().toISOString();
  const baseUrl = "https://careers.ky";

  // Get all employers (safe — table may not exist yet)
  let employers = [];
  try {
    employers = await sql`SELECT slug FROM employers ORDER BY slug`;
  } catch (e) {
    // employers table not yet migrated
  }

  const staticPages = [
    { url: "/", changefreq: "daily", priority: "1.0" },
    { url: "/career-tracks", changefreq: "daily", priority: "0.9" },
    { url: "/jobs", changefreq: "daily", priority: "0.9" },
    { url: "/employers", changefreq: "daily", priority: "0.8" },
    { url: "/talent", changefreq: "weekly", priority: "0.7" },
  ];

  const dynamicPages = [
    ...rows.map((r) => ({
      url: `/job/${r.cisco_code}`,
      lastmod: r.last_synced ? new Date(r.last_synced).toISOString() : now,
      changefreq: "daily",
      priority: "0.8",
    })),
    ...employers.map((e) => ({
      url: `/employer/${e.slug}`,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ];

  const allPages = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : `<lastmod>${now}</lastmod>`}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
