/**
 * A fixed-window rate limit for the door.
 *
 * One shared password with no throttle is a password an attacker can simply
 * try their way into: there is no account to lock, no address to alert, and the
 * search space is whatever a marketing team thought looked good on a printed
 * page. The site's ancestor had no limit at all, which was survivable because
 * every reader had their own password; here it is not.
 *
 * Two stores, same window:
 *
 *   • **Redis**, when Upstash credentials are configured. `INCR` plus `EXPIRE`
 *     on first write is atomic enough for this: the worst race lets one extra
 *     attempt through, and the point is to make ten thousand attempts
 *     impossible, not to make the eleventh one impossible.
 *   • **A Map in this process**, otherwise. It is per-instance and it forgets
 *     on restart, which on serverless means the limit is per-instance rather
 *     than global. That is a real weakness and the reason the Redis path
 *     exists; it is still enormously better than nothing, and it is exactly
 *     right in development.
 *
 * Keyed on the client IP. Behind a proxy that is `x-forwarded-for`'s first
 * entry, which a client can forge, so this raises the cost of a brute force,
 * it does not make one impossible. Layered defence, not a boundary.
 */

import { appKey, getRedis } from "@/lib/redis";

const WINDOW_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 10;

/** Fixed windows, so the whole record is one integer and one expiry. */
const local = new Map<string, { count: number; resetAt: number }>();

/**
 * The client's address, as well as it can be known.
 *
 * `x-forwarded-for` is a list appended to by each hop; the first entry is the
 * one the edge saw. `x-real-ip` is what a bare nginx sets. Neither is
 * trustworthy on its own, which is why the fallback is a single shared bucket
 * rather than "unlimited": an unattributable request still gets counted, just
 * counted together with every other unattributable request.
 */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  /** Whole seconds until the window rolls over. Shown to the person waiting. */
  retryAfterSeconds: number;
}

async function redisCheck(key: string): Promise<RateLimitResult | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;
    const count = Number(await redis.incr(key));
    // Only the request that created the key sets the expiry, so the window is
    // fixed from the first attempt rather than sliding forward on every one.
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    const ttl = Number(await redis.ttl(key));
    return {
      ok: count <= MAX_ATTEMPTS,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    };
  } catch {
    // A limiter that fails closed locks everyone out of a library of free
    // books because a cache had a bad minute. Fall through to the local Map.
    return null;
  }
}

function localCheck(key: string): RateLimitResult {
  const now = Date.now();
  const existing = local.get(key);

  if (!existing || existing.resetAt <= now) {
    local.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    // Opportunistic sweep. Without it a long-lived process accumulates one
    // entry per address that ever guessed wrong.
    if (local.size > 4096) {
      for (const [k, v] of local) if (v.resetAt <= now) local.delete(k);
    }
    return { ok: true, retryAfterSeconds: WINDOW_SECONDS };
  }

  existing.count += 1;
  return {
    ok: existing.count <= MAX_ATTEMPTS,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Count one attempt and say whether it is allowed.
 *
 * Called on every submission, including the successful ones: a limit that only
 * counts failures lets an attacker who has already guessed the reader password
 * hammer the admin one for free.
 */
export async function checkDoorAttempt(
  address: string,
): Promise<RateLimitResult> {
  // `appKey`, and this is the one key in the codebase where sharing a name
  // would be an outright bug rather than a merge. A neighbouring project
  // pointed at the same database and counting `door:1.2.3.4` would spend this
  // site's ten attempts for that address, and the reader turned away here
  // would be told to wait for something they never did.
  const key = appKey(`door:${address}`);
  return (await redisCheck(key)) ?? localCheck(key);
}

export { MAX_ATTEMPTS, WINDOW_SECONDS };
