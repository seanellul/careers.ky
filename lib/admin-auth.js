export function isAdmin(session) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !session) return false;
  const admins = adminEmail.split(",").map(e => e.trim().toLowerCase());
  const userEmail = (session.candidateEmail || session.employerEmail || "").toLowerCase();
  return admins.includes(userEmail);
}
