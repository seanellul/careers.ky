const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "protonmail.com", "proton.me", "aol.com", "mail.com", "zoho.com",
  "ymail.com", "live.com", "msn.com", "me.com", "mac.com",
  "fastmail.com", "tutanota.com", "gmx.com", "gmx.net",
]);

/**
 * Extract domain from email. Returns null for freemail providers.
 */
export function extractDomain(email) {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1].toLowerCase().trim();
  if (FREEMAIL_DOMAINS.has(domain)) return null;
  return domain;
}

/**
 * Normalize a domain string — strips protocol, www., trailing slashes.
 */
function normalizeDomain(input) {
  if (!input) return null;
  let d = input.toLowerCase().trim();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/+$/, "");
  return d || null;
}

/**
 * Check if an email domain matches a company domain.
 */
export function domainsMatch(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  const a = normalizeDomain(emailDomain);
  const b = normalizeDomain(companyDomain);
  if (!a || !b) return false;
  return a === b;
}

/**
 * Derive company domain from employer record (domain field or website).
 */
export function getCompanyDomain(employer) {
  if (employer.domain) return normalizeDomain(employer.domain);
  if (employer.website) return normalizeDomain(employer.website);
  return null;
}

/**
 * Send verification notification email to the admin team.
 */
export async function sendVerificationNotificationToTeam(account, employer, emailDomain) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set — skipping verification notification");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const matchStatus = emailDomain ? "Non-matching domain" : "Freemail / no corporate domain";
  const structuredData = JSON.stringify({
    type: "verification_request",
    accountId: account.id,
    accountEmail: account.email,
    accountName: account.name,
    employerId: employer.id,
    employerName: employer.name,
    emailDomain: emailDomain || "freemail",
    companyDomain: employer.domain || employer.website || "unknown",
    matchStatus,
    timestamp: new Date().toISOString(),
  });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
    to: adminEmail,
    subject: `[Verification] ${account.email} wants to claim ${employer.name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #0e0e0e; margin-bottom: 16px;">New Employer Verification Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Person</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${account.name || "Not provided"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${account.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email Domain</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${emailDomain || "Freemail"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Company Claimed</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${employer.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Company Domain</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${employer.domain || employer.website || "Not set"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Match Status</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #d97706; font-weight: 600;">${matchStatus}</td></tr>
        </table>
        <a href="${baseUrl}/admin/verifications" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 16px 0;">
          Review in Admin
        </a>
        <!-- STRUCTURED_DATA: ${structuredData} -->
      </div>
    `,
  });
}
