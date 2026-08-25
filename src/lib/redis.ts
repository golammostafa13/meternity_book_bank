/**
 * The one Redis connection, and the one place key names are decided.
 *
 * Upstash's REST API has no `SELECT`: a URL and token address exactly one
 * keyspace, and there is no `db 1` to move a second project into. So when two
 * sites share a database — which is the whole reason this file exists — the
 * only thing keeping them apart is the shape of their key names. That is a
 * convention, and a convention nobody wrote down is a convention that lasts
 * until the next person picks an obvious name that was already taken.
 *
 * Hence two functions, and the distinction between them is the interesting
 * part:
 *
 *   • `appKey` — **this site's own.** Prefixed with `KV_PREFIX`, so the same
 *     database can hold another project's rows without either one seeing the
 *     other's. The door's rate limiter is the sharp example: `door:1.2.3.4`
 *     unprefixed means a reader failing sign-ins on the *other* site spends
 *     this site's ten-attempt budget for that address, and nothing anywhere
 *     reports that as the cause.
 *   • `sharedKey` — **deliberately common.** No prefix, because the point is
 *     for both sites to land on the same row. Anything passed here is a
 *     contract with another codebase: changing its name or its record shape
 *     breaks a project this one cannot see and does not build.
 *
 * The asymmetry is intentional. Sharing is the exception and it should be
 * spelled out at the call site; isolation is the default and costs nothing.
 */

/**
 * Either pair of names works. `KV_*` is what Vercel's own KV integration sets
 * on a linked project; `UPSTASH_*` is what the Upstash console hands you.
 * Read once at module load — these are deployment configuration, not something
 * that changes between requests.
 */
const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * This site's namespace inside a possibly shared database.
 *
 * Defaults to `mbb` so a deployment that sets nothing is still separated from
 * a neighbour that also sets nothing under a different default. The trailing
 * colon is added here rather than being expected in the value, because a
 * variable set in a hosting dashboard will be `mbb` about as often as `mbb:`
 * and the difference should not silently produce a second namespace.
 *
 * Changing it after rows exist orphans them: the old keys are still in the
 * database and nothing will look for them again. It is a name, not a setting
 * to tune.
 */
const prefix = (() => {
  const configured = (process.env.KV_PREFIX ?? "mbb").trim();
  if (!configured) return "";
  return configured.endsWith(":") ? configured : `${configured}:`;
})();

type RedisClient = import("@upstash/redis").Redis;

/**
 * One client, built on first use.
 *
 * Dynamically imported rather than imported at the top, so that a module
 * reaching for a key name does not drag the Upstash SDK into a bundle that
 * only needed the string. It also keeps the SDK out of the proxy runtime,
 * which verifies sessions without ever touching this file.
 *
 * The client is cached because the previous arrangement built a fresh one per
 * call — cheap, since the transport is stateless HTTP, but it re-parsed
 * configuration on every rate-limit check for no benefit.
 */
let client: RedisClient | undefined;

export async function getRedis(): Promise<RedisClient | undefined> {
  if (!redisUrl || !redisToken) return undefined;
  if (!client) {
    const { Redis } = await import("@upstash/redis");
    client = new Redis({
      url: redisUrl,
      token: redisToken,
      // Values are written as JSON strings by every caller here and parsed
      // explicitly on the way out. Letting the SDK guess would mean a record
      // whose type depends on what it happened to look like.
      automaticDeserialization: false,
    });
  }
  return client;
}

/**
 * A key belonging to this site alone.
 *
 * Everything that is not an explicit cross-project contract goes through here.
 */
export function appKey(name: string): string {
  return `${prefix}${name}`;
}

/**
 * A key shared with another project pointed at this same database.
 *
 * Unprefixed on purpose: the name *is* the interface. Callers should say in a
 * comment which other codebase writes the same key and what it expects to find
 * there, because nothing in this repository will fail to build when that
 * expectation stops being true.
 */
export function sharedKey(name: string): string {
  return name;
}

/**
 * Whether a durable store is configured at all.
 *
 * Every store in this codebase falls back to a file under `private/` when it
 * is not, which is right in development and quietly wrong on serverless — the
 * filesystem there is per-instance and wiped by every deploy. The admin screen
 * shows this so the difference is visible rather than discovered.
 */
export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken);
}

/** The active namespace, for the admin screen. Empty when prefixing is off. */
export function keyPrefix(): string {
  return prefix;
}
