import * as Sentry from "@sentry/nextjs";

// No-ops when NEXT_PUBLIC_SENTRY_DSN is unset (local dev without Sentry).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: 0.1,
});
