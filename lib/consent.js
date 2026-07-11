// Cookie/analytics consent helpers (client-side only).
//
// The choice lives in localStorage — no consent cookie is set. Values:
//   "analytics" — user accepted optional analytics (PostHog may initialize)
//   "essential" — essential only (PostHog never initializes)
// Absent key = not asked yet (banner shows, no analytics).
//
// The essential session cookie (ck_session) is never gated on this — it is
// strictly necessary for sign-in and is not used for tracking.

export const CONSENT_KEY = "ck_cookie_consent";
export const CONSENT_EVENT = "ck-consent-changed";

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {}
}
