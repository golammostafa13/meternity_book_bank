/**
 * The names shown for the two kinds of session.
 *
 * Constants rather than settings, and in their own module rather than in
 * `lib/auth/config`: a Client Component needs these to render the account pill,
 * and importing them from `config` would pull the module that reads
 * `SITE_PASSWORD` and `ADMIN_PASSWORD` into the browser bundle. Nothing would
 * leak: `process.env` is inlined only for `NEXT_PUBLIC_` names, but a
 * password-reading module that is *reachable* from client code is a mistake
 * waiting for someone to make it.
 */

/** Shown wherever the administrator's own session appears. */
export const adminUsername = "maternity-book-bank";

/**
 * Shown for a reader whose address gave nothing to show.
 *
 * The door now asks for an address, so the pill usually says who is reading
 * rather than merely *what* they are — see `displayName`. This is the fallback
 * for the cases where it cannot: an address that survived the shape test but
 * has nothing usable in front of the `@`, and any session signed before the
 * address existed.
 */
export const readerUsername = "reader";

/**
 * What the account pill says for a given address.
 *
 * The local part, not the whole address. The pill sits in a header next to a
 * language switch and a theme toggle, and a full address is both wider than
 * that space and more than anyone standing behind the reader needs to see. It
 * is a greeting, not an identifier; the identifier is in the cookie.
 *
 * Nothing here is a security boundary — it is a string on a screen — so it
 * falls back rather than throwing on input the door should already have
 * rejected.
 */
export function displayName(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || readerUsername;
}
