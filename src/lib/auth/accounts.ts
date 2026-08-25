import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { normaliseEmail, type Role } from "@/lib/auth/config";

/**
 * Who has opened the library, and when.
 *
 * This is **not** an account table, in the sense that nothing here is ever
 * consulted to decide whether someone may come in. The door is a printed word
 * plus — for administrators — a list in the environment, and neither of those
 * reads this file. Deleting the whole store locks nobody out and lets nobody
 * in; it would only lose the history.
 *
 * What it is: the sponsor gave away a print run behind a shared password, and a
 * shared password can tell you how many times it was typed but never by how
 * many people. The address collected at the door is the only durable handle on
 * a visitor this site has, so it is written down. Two readers on one password
 * are two rows here; one reader across eight sessions is one row with a visit
 * count.
 *
 * Distinct from `lib/auth/readers`, which is keyed on a phone number and
 * records who *received a copy* — a form someone chose to fill in. This records
 * who *used* one, and is written without anybody being asked. They are not two
 * views of one table: plenty of readers will appear in exactly one of them.
 *
 * Two stores, one shape: Upstash Redis in production, `private/accounts.json`
 * locally. The JSON file is not viable on serverless — the filesystem is
 * ephemeral and per-instance, so a row written by one lambda is invisible to
 * the next and gone by morning — which is the whole reason the Redis path
 * exists. Same reasoning as `lib/auth/readers`, same shape of solution.
 */

const DATA_FILE = join(process.cwd(), "private", "accounts.json");
const DATA_DIR = dirname(DATA_FILE);

export interface AccountRecord {
  /** Normalised. The key. */
  email: string;
  /**
   * Which word was typed on the most recent visit.
   *
   * Historical, not authoritative. Whether this address may administer the
   * library is decided by `canAdminister` against the live `ADMIN_EMAILS`, and
   * a row saying `admin` for an address since removed from that list is a true
   * statement about a past visit rather than a stale grant.
   */
  role: Role;
  /** Milliseconds since the epoch. */
  firstSeenAt: number;
  lastSeenAt: number;
  /** How many times this address has come through the door. */
  visits: number;
}

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

type RedisClient = import("@upstash/redis").Redis;
let redis: RedisClient | undefined;

async function getRedis(): Promise<RedisClient | undefined> {
  if (!redisUrl || !redisToken) return undefined;
  if (!redis) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
      automaticDeserialization: false,
    });
  }
  return redis;
}

/** The sorted set that makes the store listable; score is `lastSeenAt`. */
const INDEX_KEY = "accounts:index";
const recordKey = (email: string) => `account:${email}`;

function readAll(): Record<string, AccountRecord> {
  if (!existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8")) as Record<
      string,
      AccountRecord
    >;
  } catch {
    // A corrupt file is not a reason to fail a sign-in. Behave as an empty
    // store and let the next write rebuild it.
    return {};
  }
}

function writeAll(data: Record<string, AccountRecord>): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function findAccount(email: string): Promise<AccountRecord | undefined> {
  const key = normaliseEmail(email);
  if (!key) return undefined;

  const client = await getRedis();
  if (client) {
    const raw = await client.get<string>(recordKey(key));
    return typeof raw === "string"
      ? (JSON.parse(raw) as AccountRecord)
      : undefined;
  }
  return readAll()[key];
}

/**
 * Note one trip through the door.
 *
 * An upsert: `firstSeenAt` survives, everything else is refreshed. There is no
 * "already exists" case to report because there is nothing here to take over —
 * a second visit from the same address is the ordinary thing that happens, not
 * a collision.
 *
 * Callers must not let a failure here fail the sign-in. A reader holding the
 * right printed word is entitled to the library whether or not a cache is
 * having a good minute, and this store grants nothing that could be lost by
 * skipping a write. See how `enterAction` calls it.
 */
export async function recordEntry(
  email: string,
  role: Role,
  now = Date.now(),
): Promise<AccountRecord> {
  const key = normaliseEmail(email);
  const existing = await findAccount(key);

  const saved: AccountRecord = {
    email: key,
    role,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    visits: (existing?.visits ?? 0) + 1,
  };

  const client = await getRedis();
  if (client) {
    await client.set(recordKey(key), JSON.stringify(saved));
    await client.zadd(INDEX_KEY, { score: saved.lastSeenAt, member: key });
    return saved;
  }

  const data = readAll();
  data[key] = saved;
  writeAll(data);
  return saved;
}

/**
 * Everyone who has opened the library, most recent first.
 *
 * No pagination, for the same reason as `listReaders`: this is a print run's
 * worth of addresses and the screen that shows it filters in the browser. The
 * sorted set is already the right index if a run ever gets large enough for
 * that to hurt.
 */
export async function listAccounts(): Promise<AccountRecord[]> {
  const client = await getRedis();
  if (client) {
    const emails = await client.zrange<string[]>(INDEX_KEY, 0, -1, { rev: true });
    if (emails.length === 0) return [];
    const raw = await client.mget<(string | null)[]>(
      ...emails.map((email) => recordKey(email)),
    );
    return raw
      .filter((value): value is string => typeof value === "string")
      .map((value) => JSON.parse(value) as AccountRecord);
  }
  return Object.values(readAll()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/** Whether a durable store is configured. Shown on the admin screen. */
export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken);
}
