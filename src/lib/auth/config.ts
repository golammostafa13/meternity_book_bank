/**
 * Who may read the library, and who may administer it.
 *
 * The door asks for two things — an address and a word — and they answer two
 * different questions:
 *
 *   • **Reading** needs `SITE_PASSWORD`. It is printed inside the sponsored
 *     copy, so every reader types the same word. Nothing on these shelves opens
 *     without it: not a book page, not the reader, not a file.
 *   • **Administering** needs `ADMIN_PASSWORD` *and* an address listed in
 *     `ADMIN_EMAILS`. Neither is sufficient alone. The password is printed
 *     nowhere; the list is configuration.
 *
 * The address is why this is not simply "one password, two roles". A shared
 * word cannot say who typed it, so an administrator was previously
 * indistinguishable from any other holder of the same word. Requiring the
 * address as well means administration is granted to a person rather than to a
 * string, and withdrawn by editing a variable rather than by rotating a
 * password every reader also uses.
 *
 * For a reader the address grants nothing at all — the printed word is still
 * the whole gate. It is collected because the sponsor is giving away a print
 * run and would like to know it is being read, and because it is the one
 * durable handle on a visitor that a shared password can never provide.
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

/**
 * The addresses that administer this library.
 *
 * One value, comma- or whitespace-separated, so a librarian with several
 * accounts — or several librarians — need not share one inbox:
 *
 *   ADMIN_EMAILS=librarian@example.org,second-account@example.org
 *
 * `ADMIN_EMAIL` (singular) is still read when `ADMIN_EMAILS` is unset: it is
 * the older name for the same setting, and one address is a perfectly good
 * list.
 *
 * Empty means *nobody* administers the library. That is the important case to
 * get right: an unset variable must not match a blank email and hand /admin to
 * whoever gets there first, which is why `isAdminEmail` refuses everything
 * rather than falling back to something permissive.
 */
export const adminEmails: readonly string[] = parseEmailList(
  process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "",
);

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

/**
 * Addresses are compared case-insensitively, and untrimmed input is a typo
 * rather than a different person — so both sides of every comparison go
 * through here.
 */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Splits a configured list into normalised addresses.
 *
 * Commas, semicolons and any whitespace all separate, because a value pasted
 * into a hosting dashboard picks up whichever the person happened to type. The
 * `filter(Boolean)` is not tidiness: without it a trailing comma contributes an
 * empty string to the list, and an empty string in `adminEmails` is an entry
 * that matches an unset address.
 */
export function parseEmailList(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map(normaliseEmail)
    .filter(Boolean);
}

/**
 * Deliberately loose: one `@`, a dot in the domain, no spaces.
 *
 * This is a shape test, not a validity test. Nothing is ever sent to the
 * address, so the only thing a stricter pattern could achieve is turning away
 * a reader whose real address it did not anticipate.
 */
export function isEmailShaped(email: string): boolean {
  const parts = email.split("@");
  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    parts[1].includes(".") &&
    !parts[1].startsWith(".") &&
    !parts[1].endsWith(".") &&
    !email.includes(" ")
  );
}

/**
 * Whether an address is on the administrators' list.
 *
 * Checked against the address inside the signed session rather than anything
 * the browser has just sent, and checked at the moment it matters rather than
 * stamped into the cookie — see the note on `canAdminister` in
 * `lib/auth/session`.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return adminEmails.includes(normaliseEmail(email));
}

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

/**
 * The printed door, both fields.
 *
 * `passwordRole` above says which of the two printed words was typed;
 * this says what the pair of (address, word) actually opens.
 *
 * No longer the *whole* door, and the rename is the warning. `enterAction` has
 * a third path: an address and password belonging to the other library sharing
 * this database (`lib/auth/shared-users`). It runs only after this returns
 * `null`, and it can only ever produce a reader. So this function remains the
 * only thing that decides `"admin"`, and it stays pure and offline — which is
 * what lets the ordinary reader in without a network round trip.
 *
 * The case worth reading twice is the admin password typed by an address that
 * is not on the list. It returns `null` — turned away — rather than falling
 * back to reader access. That is deliberate and it is not merely strict:
 * `ADMIN_PASSWORD` is `SITE_PASSWORD` plus a character, so "downgrade an
 * unlisted admin attempt to a reader" would mean anyone who guessed the reader
 * word could append characters at random and still be let in, which quietly
 * turns the admin password's extra character into no protection at all. One
 * word opens one thing.
 *
 * The address is not checked for readers *here*, and there is nothing in this
 * module to check it against: the printed reader door is a word by design, and
 * an allowlist of readers would be a different site. It is required,
 * shape-tested and recorded, and for this path that is all. A reader whose
 * address does mean something — because they registered on the other library —
 * is handled after this returns `null`, not by loosening it.
 */
export function doorRole(email: string, typed: string): Role | null {
  const word = passwordRole(typed);
  if (!word) return null;
  if (word === "admin") return isAdminEmail(email) ? "admin" : null;
  return "reader";
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
