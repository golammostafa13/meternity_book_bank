/**
 * Readers who registered on the *other* library, sharing this database.
 *
 * The sponsor runs two sites against one Upstash database, and asked that a
 * person who registered on either be let into either. The other one — the
 * general library — has real accounts: an address, a name, and a password the
 * person chose. It keeps them at `user:<email>`, and that key is the whole
 * interface between the two codebases, which is why it goes through `sharedKey`
 * rather than `appKey`. See `lib/redis`.
 *
 * **Read-only, and that is a design decision rather than a missing feature.**
 * Nothing here creates a record, updates one, or writes a hash. Two
 * consequences, both wanted:
 *
 *   • This site cannot corrupt the other site's account store. A bug here
 *     turns readers away; it does not damage anybody's account.
 *   • The contract is one-directional and therefore comprehensible. Rows are
 *     written by exactly one codebase and read by two, so "who wrote this
 *     record" never needs investigating.
 *
 * Registration on *this* site is a different thing entirely and stays that way:
 * `lib/auth/readers` is keyed on a phone number, holds no password, and grants
 * nothing. It is a record of who received a printed copy. This file is about
 * credentials somebody else issued.
 */

import { normaliseEmail } from "@/lib/auth/config";
import { getRedis, sharedKey } from "@/lib/redis";

/**
 * The other site's record, as much of it as this one needs.
 *
 * Deliberately a narrow view of a wider row — the other codebase also keeps a
 * `via` and a `createdAt`, and will keep more in time. Declaring only what is
 * read here means a field added over there does not have to be mirrored over
 * here to keep this compiling.
 *
 * `passwordHash` is optional because over there it genuinely is: a record
 * created through Google sign-in has no password, and so does one created by an
 * administrator on someone's behalf. That optionality is the sharp edge in this
 * file — see `verifySharedUser`.
 *
 * `createdAt` is optional in the type for the same reason it is checked so
 * carefully below: this codebase does not write these rows and cannot promise
 * what is in them. A row missing it is refused rather than assumed recent.
 */
export interface SharedUser {
  email: string;
  name?: string;
  phone?: string;
  passwordHash?: string;
  /** Milliseconds since the epoch, set by the other site at creation. */
  createdAt?: number;
}

/**
 * The cutoff, and why this path is off unless you set one.
 *
 * The other library's registration is open: its `/signup` is a public route,
 * asks for a name and an address and nothing else, and creates a row with no
 * password — which its sign-in then sets to whatever is typed first. Three
 * steps, no secret at any point, and a stranger holds a credential this door
 * would otherwise honour. That would make the word printed in the sponsored
 * copy bypassable by anyone who found the other site.
 *
 * The fix has to live here, because that project is not ours to change. So this
 * path trusts a shared account only if it was registered *before* a moment you
 * name: the readers who were already there keep their way in, and an account
 * minted afterwards opens nothing here.
 *
 * **Unset means off.** Not "no cutoff" — off. An unparseable value means off
 * too. This is the same stance `adminEmails` takes in `lib/auth/config`: a
 * variable nobody set must never read as permission, and the failure that
 * turns readers away is always preferable to the one that lets strangers in.
 *
 * Accepts an ISO date (`2026-08-23`, `2026-08-23T00:00:00Z`) or milliseconds
 * since the epoch, because both are things a person reasonably pastes into a
 * hosting dashboard.
 */
const sharedLoginBefore: number | null = (() => {
  // Surrounding quotes are stripped because a value pasted into a hosting
  // dashboard keeps them as literal characters. Not cosmetic: `"2026-08-23"`
  // still parses, via a lenient fallback, but as *local* midnight rather than
  // UTC — six hours adrift here, and silently.
  const raw = (process.env.SHARED_LOGIN_BEFORE ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
})();

/**
 * Whether the cross-site path is switched on at all, for the admin screen.
 *
 * Worth surfacing: with this off, a reader from the other library is told to
 * check the page in a book they may not own, and nothing in the logs says why.
 */
export function isSharedLoginEnabled(): boolean {
  return sharedLoginBefore !== null;
}

/**
 * Look up an address in the other site's account store.
 *
 * Returns `undefined` for "no such account" *and* for "the store is not
 * reachable", and callers must treat those the same way: refuse. Distinguishing
 * them would mean the door behaving differently for a known address than an
 * unknown one during an outage, which is exactly the signal this door is
 * careful not to emit.
 */
export async function findSharedUser(
  email: string,
): Promise<SharedUser | undefined> {
  const key = normaliseEmail(email);
  if (!key) return undefined;

  try {
    const client = await getRedis();
    if (!client) return undefined;
    // `sharedKey`, unprefixed: this is the other project's key name, and the
    // name is the contract. Renaming it here does not rename it there.
    const raw = await client.get<string>(sharedKey(`user:${key}`));
    if (typeof raw !== "string") return undefined;
    const parsed = JSON.parse(raw) as SharedUser;
    return typeof parsed?.email === "string" ? parsed : undefined;
  } catch {
    // A malformed row or an unreachable cache is not a reason to 500 the door.
    // The printed-password path is checked before this one and touches nothing
    // here, so a reader holding the word in their book still gets in.
    return undefined;
  }
}

/**
 * SHA-256, hex, unsalted.
 *
 * This is not a good way to store a password and it is not this codebase's
 * choice: it is the scheme the other site already used on rows that already
 * exist, and a verifier has no freedom about which function to compute. Writing
 * a better one here would simply fail to match every record in the database.
 *
 * The honest way to fix it is over there, by rehashing on next sign-in with
 * something salted and slow, and this file gains a second branch when that
 * happens. Until then the mitigation that *is* available is the one already in
 * place: the door is rate-limited before it gets this far.
 *
 * Web Crypto rather than `node:crypto`, matching the rest of `lib/auth`.
 */
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent comparison, so a hash can't be guessed a byte at a time. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Whether (address, password) matches an account on the other site.
 *
 * Three things must hold, and only the third is about the password: the cutoff
 * must be configured at all, the account must predate it, and the hash must
 * match. The first two are `sharedLoginBefore` above — read that comment before
 * changing anything here, because loosening either one re-opens a bypass of the
 * printed word.
 *
 * The other case to read twice is **a record with no `passwordHash`**. This refuses
 * it. The other site does something different — it accepts whatever password is
 * typed and saves it — which means over there the first person to type anything
 * at a passwordless address takes it over. That is the same flaw the ancestor of
 * `lib/auth/readers` had, and it is noted in that file as the reason its
 * register holds no hashes at all.
 *
 * It is not this site's flaw to inherit. A record with no password is a record
 * that proves nothing, so it opens nothing here, and because this file never
 * writes, a passwordless row cannot be claimed through this door at all. The
 * cost is a reader who signed up over there with Google being turned away here
 * until they set a password over there. That is the right trade: the alternative
 * hands this library to whoever types an address they saw once.
 *
 * Returns the record on success rather than `true`, because the caller wants
 * the name for the session and should not have to fetch the row twice.
 */
export async function verifySharedUser(
  email: string,
  password: string,
): Promise<SharedUser | null> {
  // Off unless a cutoff is configured. First, so that an unconfigured
  // deployment does not even reach for the network to be told no.
  if (sharedLoginBefore === null) return null;
  if (!password) return null;

  const user = await findSharedUser(email);
  if (!user?.passwordHash) return null;

  // Registered before the cutoff, or it opens nothing. `typeof` rather than a
  // truthiness test, and refusing rather than defaulting: a row with no
  // `createdAt`, or a string where a number belongs, is a row this codebase
  // cannot date, and an undatable row must not be treated as an old one.
  if (typeof user.createdAt !== "number") return null;
  if (!(user.createdAt < sharedLoginBefore)) return null;

  return safeEqual(await sha256Hex(password), user.passwordHash) ? user : null;
}
