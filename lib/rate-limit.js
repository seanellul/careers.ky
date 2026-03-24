// Simple in-memory sliding-window rate limiter.
// Suitable for single-instance deployments (Vercel serverless resets between cold starts,
// so this degrades gracefully — worst case, limits reset on redeploy).

const windows = new Map();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entries] of windows) {
    const fresh = entries.filter((t) => now - t < 3_600_000); // keep 1h max
    if (fresh.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, fresh);
    }
  }
}

/**
 * Check if a request should be rate limited.
 * @param {string} key - Unique key (e.g. "login:1.2.3.4" or "interest:userId")
 * @param {number} limit - Max requests allowed in the window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ limited: boolean, remaining: number }}
 */
export function rateLimit(key, limit, windowMs) {
  cleanup();

  const now = Date.now();
  const entries = windows.get(key) || [];
  const windowStart = now - windowMs;
  const recent = entries.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    return { limited: true, remaining: 0 };
  }

  recent.push(now);
  windows.set(key, recent);
  return { limited: false, remaining: limit - recent.length };
}

/**
 * Get client IP from request headers (works behind Vercel/Cloudflare proxies).
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Return a 429 JSON response.
 */
export function rateLimitResponse(retryAfterSeconds = 60) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
