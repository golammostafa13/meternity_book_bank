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
 * Shown for a reader.
 *
 * Everyone who typed the printed password is the same session as far as this
 * site is concerned, so the pill says what they are rather than inventing a
 * per-visitor identity the server does not have. A reader who registered on
 * /signup gave a name, but registering is not signing in: that name belongs to
 * the sponsor's record, not to the cookie.
 */
export const readerUsername = "reader";
