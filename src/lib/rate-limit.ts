/**
 * Simple in-memory per-IP rate limiter for server-side API routes.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRecords = new Map<string, RateLimitRecord>();

/**
 * Checks whether an IP has exceeded the given request threshold within the window.
 * Default: 30 requests per minute per IP.
 */
export function checkRateLimit(
  ip: string,
  limit: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRecords.get(ip);

  // Periodic cleanup of expired records if map exceeds 10,000 IPs
  if (ipRecords.size > 10000) {
    for (const [k, v] of ipRecords.entries()) {
      if (now > v.resetTime) {
        ipRecords.delete(k);
      }
    }
  }

  if (!record || now > record.resetTime) {
    ipRecords.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

/**
 * Extracts client IP from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
