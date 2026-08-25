import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalisePhone } from "@/lib/auth/config";
import { appKey, getRedis } from "@/lib/redis";

/**
 * The register of readers.
 *
 * This is **not** an account table. Nobody signs in with a record from here:
 * the door is a printed password (`lib/auth/config`) and it does not consult
 * this file. What this is: the sponsor gave away a print run and would like to
 * know who received it and where, which is what the District and Thana fields
 * on /signup are for and why every field on that form is optional.
 *
 * Because it is a record rather than a credential, there is no password hash
 * here and nothing to compromise beyond the contact details someone chose to
 * volunteer. That is a deliberate simplification over the ancestor of this
 * file, which stored unsalted SHA-256 password hashes and let the first
 * password typed claim any record that had none.
 *
 * Two stores, one shape: Upstash Redis in production, `private/readers.json`
 * locally. The JSON file is not viable on serverless (the filesystem is
 * ephemeral and per-instance), hence the Redis path.
 */

const DATA_FILE = join(process.cwd(), "private", "readers.json");
const DATA_DIR = dirname(DATA_FILE);

export interface ReaderRecord {
  /** Normalised. The key. See `normalisePhone`. */
  phone: string;
  name: string;
  /** Optional: plenty of readers will not have one and should not be blocked. */
  email?: string;
  /** District id from `lib/data/bd-geo`, not free text. */
  district?: string;
  /** Thana id from `lib/data/bd-geo`, and always inside `district`. */
  thana?: string;
  /** Milliseconds since the epoch. */
  createdAt: number;
}

/**
 * The sorted set that makes the register listable; score is `createdAt`.
 *
 * `appKey`, not `sharedKey`: this register is keyed on a phone number and
 * carries District and Thana, which is a shape no other project writes. See
 * `lib/redis` for why the distinction is spelled out at every call site.
 */
const INDEX_KEY = appKey("readers:index");
const recordKey = (phone: string) => appKey(`reader:${phone}`);

function readAll(): Record<string, ReaderRecord> {
  if (!existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8")) as Record<
      string,
      ReaderRecord
    >;
  } catch {
    // A corrupt file is not a reason to fail a page render. It is a reason to
    // behave as an empty register and let the next write rebuild it.
    return {};
  }
}

function writeAll(data: Record<string, ReaderRecord>): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function findReader(
  phone: string,
): Promise<ReaderRecord | undefined> {
  const key = normalisePhone(phone);
  if (!key) return undefined;

  const client = await getRedis();
  if (client) {
    const raw = await client.get<string>(recordKey(key));
    return typeof raw === "string" ? (JSON.parse(raw) as ReaderRecord) : undefined;
  }
  return readAll()[key];
}

/**
 * Record a reader, or update the one already there.
 *
 * Deliberately an upsert rather than a "already exists" error. Someone
 * registering twice is someone who forgot they had, or who is correcting their
 * thana: neither is an error worth showing them, and there is no account here
 * to be taken over by the second submission. The original `createdAt` is kept
 * so the register still says when this reader first appeared.
 */
export async function saveReader(
  record: Omit<ReaderRecord, "createdAt"> & { createdAt?: number },
): Promise<ReaderRecord> {
  const phone = normalisePhone(record.phone);
  const existing = await findReader(phone);
  const saved: ReaderRecord = {
    ...record,
    phone,
    createdAt: existing?.createdAt ?? record.createdAt ?? Date.now(),
  };

  const client = await getRedis();
  if (client) {
    await client.set(recordKey(phone), JSON.stringify(saved));
    await client.zadd(INDEX_KEY, { score: saved.createdAt, member: phone });
    return saved;
  }

  const data = readAll();
  data[phone] = saved;
  writeAll(data);
  return saved;
}

/**
 * The whole register, newest first.
 *
 * No pagination. This is a print run's worth of readers, and the admin screen
 * that shows it filters in the browser; adding a cursor API for a few thousand
 * rows would be machinery in place of a scroll bar. If a run ever gets large
 * enough for that to hurt, the sorted set is already the right index for it.
 */
export async function listReaders(): Promise<ReaderRecord[]> {
  const client = await getRedis();
  if (client) {
    const phones = await client.zrange<string[]>(INDEX_KEY, 0, -1, { rev: true });
    if (phones.length === 0) return [];
    const raw = await client.mget<(string | null)[]>(
      ...phones.map((p) => recordKey(p)),
    );
    return raw
      .filter((value): value is string => typeof value === "string")
      .map((value) => JSON.parse(value) as ReaderRecord);
  }
  return Object.values(readAll()).sort((a, b) => b.createdAt - a.createdAt);
}
