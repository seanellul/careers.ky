// Server-side PostHog capture via the HTTP API (no SDK dependency).
// Business outcomes (introductions, stage changes) happen in API routes,
// so they must be captured server-side to make funnels trustworthy.
// Fire-and-forget: analytics must never break or slow a request.

const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Distinct IDs must match what the client identifies as (PostHogProvider):
//   candidate-<id> / employer-<employerAccountId>
export function candidateDistinctId(candidateId) {
  return `candidate-${candidateId}`;
}

export function employerDistinctId(employerAccountId) {
  return `employer-${employerAccountId}`;
}

export function captureServer(distinctId, event, properties = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !distinctId) return;

  fetch(`${HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event,
      distinct_id: distinctId,
      properties: { ...properties, source: "server" },
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}
