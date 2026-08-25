/**
 * Who may read the library, and who may administer it.
 *
 * Two questions, one door each, and both doors are a single word:
 *
 *   • **Reading** needs `SITE_PASSWORD`. It is printed inside the sponsored
 *     copy, so every reader types the same word. There are no accounts to sign
 *     in to and nothing to be approved for. Nothing on these shelves opens
 *     without it: not a book page, not the reader, not a file.
 *   • **Administering** needs `ADMIN_PASSWORD`, which is printed nowhere.
 *
 * Registering is a third, separate thing (`/signup`) and is *not* how anyone
 * gets in. It records who received a copy and where (see District/Thana) for
 * the sponsor, and grants nothing.
 *
 * Everything comes from the environment, with the values printed in the current
 * run as defaults so a fresh clone matches the books already out there.
 */

/** The admin account's display name. Defined in `lib/auth/username`. */
export { adminUsername } from "@/lib/auth/username";

/**
 * The password printed inside the sponsored copy.
 *
 * Be clear-eyed about what this is. It is printed, in circulation, and
 * identical in every copy of the run, so anyone who photographs the page can
 * pass on what they saw. This is a lock on a door, not a vault, and nothing
 * that matters hangs on it: it can never administer the library, and there is
 * nothing behind it but books that are free to read anyway.
 */
export const SITE_PASSWORD = process.env.SITE_PASSWORD ?? "Exium";

/**
 * The administrator's password.
 *
 * Note the shape the sponsor asked for: this is the reader password with one
 * more character on the end. Two passwords where one is a prefix of the other
 * are a trap, and the trap is not in `===`: it is in every plausible edit
 * *around* it. A `startsWith`, a `includes`, a "be forgiving about trailing
 * characters" tweak, a fuzzy compare copied from the printed-code handling in
 * some other project: any of those matches `Exiumm` against the reader
 * password and hands /admin to whoever asks.
 *
 * So `passwordRole` below tests this one first and compares it exactly, and
 * that order is deliberate insurance rather than a consequence of `===`. If
 * either comparison is ever loosened, the admin test still runs before the
 * reader test rather than after it.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Exiumm";

/** Cookie signing secret. Any long random string; rotate to log everyone out. */
export const authSecret = process.env.AUTH_SECRET ?? "";

export const sessionCookieName = "mbb_session";

/** Eight hours: one working day at the desk, then type the word again. */
export const sessionTtlSeconds = 8 * 60 * 60;

/**
 * The session cookie's flags, in one place.
 *
 * Two code paths set this cookie, and a cookie that is `httpOnly` in one of
 * them and not the other is not a cookie anyone can reason about.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionTtlSeconds,
} as const;

/** What a typed password entitles the typist to, or null for neither. */
export type Role = "reader" | "admin";

/**
 * The whole authorisation decision, in one function.
 *
 * Compared against what was typed, untrimmed on the right-hand side only:
 * `Exium ` with a trailing space is a typo rather than a different password, so
 * the input is trimmed, but the configured value is used exactly as set, so a
 * deployment that deliberately puts a space in its password still works.
 *
 * Case-sensitive. The two passwords here differ by length rather than case, so
 * folding case would not help anyone type them, and it would double the search
 * space an attacker gets for free.
 */
export function passwordRole(typed: string): Role | null {
  const value = typed.trim();
  if (!value) return null;
  // Admin first, exact. See the note on ADMIN_PASSWORD.
  if (ADMIN_PASSWORD && value === ADMIN_PASSWORD) return "admin";
  if (SITE_PASSWORD && value === SITE_PASSWORD) return "reader";
  return null;
}

/** Registration is always open. It is a record, not a gate. */
export function isRegistrationOpen(): boolean {
  return true;
}

/**
 * Phone numbers are the key on a reader record, so both sides of every
 * comparison go through here: `+880 1712-345678`, `01712345678` and
 * `01712 345 678` are one person, and a record keyed on whichever punctuation
 * they happened to type is a record nobody can find again.
 *
 * Bangladeshi mobile numbers are eleven digits beginning `01`. A leading `+880`
 * or `880` is the same number dialled internationally, so it is folded to the
 * local form rather than kept as a second identity.
 */
export function normalisePhone(value: string): string {
  const digits = value.replace(/\D+/g, "");
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}
