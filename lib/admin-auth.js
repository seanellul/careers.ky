export function isAdmin(session) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !session) return false;
  return session.candidateEmail === adminEmail || session.employerEmail === adminEmail;
}
