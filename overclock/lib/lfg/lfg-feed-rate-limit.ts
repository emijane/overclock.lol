const LFG_FEED_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LFG_FEED_RATE_LIMIT_MAX_REQUESTS = 45;
const LFG_FEED_PATHS = new Set(["/duos", "/stacks"]);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function isLFGFeedRateLimited(request: Request) {
  const url = new URL(request.url);

  if (request.method !== "GET" || !LFG_FEED_PATHS.has(url.pathname)) {
    return false;
  }

  const now = Date.now();
  pruneExpiredEntries(now);

  const clientIp = getClientIp(request);
  const rateLimitKey = `${clientIp}:${url.pathname}`;
  const existingEntry = rateLimitStore.get(rateLimitKey);

  if (!existingEntry || existingEntry.resetAt <= now) {
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetAt: now + LFG_FEED_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existingEntry.count += 1;

  if (existingEntry.count > LFG_FEED_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  rateLimitStore.set(rateLimitKey, existingEntry);
  return false;
}
