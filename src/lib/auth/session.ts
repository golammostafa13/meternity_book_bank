import {
  authSecret,
  sessionCookieName,
  sessionTtlSeconds,
  type Role,
} from "@/lib/auth/config";

/**
 * Session cookie: a JSON payload with an HMAC-SHA256 tag appended.
 *
 * Stateless on purpose. Nobody has an account here (there is one password for
 * readers and one for the administrator), so a session store would be a table
 * of rows that say nothing a signed cookie cannot. And a stateless token can be
 * checked inside `proxy.ts` without a round trip, which is what keeps the guard
 * on /admin free.
 *
 * Everything here uses Web Crypto only (no `node:crypto`), because the same
 * verification runs in the proxy runtime as in Server Actions.
 */

export interface Session {
  /** Which password was typed at the door. */
  role: Role;
  /** Display name. A constant per role: see `lib/auth/username`. */
  name: string;
  /** Seconds since the epoch. */
  exp: number;
}

/**
 * The role *is* in the token, and that is a reversal worth explaining.
 *
 * The usual rule (the one this codebase's ancestor followed) is to keep roles
 * out of a session and recompute them on every request, so that revoking an
 * administrator takes effect now rather than whenever an eight-hour cookie
 * happens to expire. That rule assumes there is something to recompute
 * *against*: an identity in the token and a list of privileged identities in
 * the environment.
 *
 * Here there is neither. The door is a password, not an identity, so the only
 * fact the server can ever know about a session is which password produced it.
 * Recomputing would mean re-deriving that fact from itself.
 *
 * The property normally lost is not lost either: rotating `ADMIN_PASSWORD` does
 * not expire outstanding admin cookies, but rotating `AUTH_SECRET` invalidates
 * every session in one move, which is the actual revocation lever, and it is
 * the lever you want anyway, because a leaked printed password is a leak of the
 * reader door, not of one account.
 */
export function canAdminister(session: Session | null | undefined): boolean {
  return session?.role === "admin";
}

/**
 * Whether a session may read the library at all.
 *
 * Both roles may. The administrator is a reader with an extra screen, not a
 * separate kind of visitor, and the catalogue pages should never have to ask
 * which one they are rendering for.
 */
export function hasLibraryAccess(
  session: Session | null | undefined,
): session is Session {
  return session != null;
}

/**
 * Signing key.
 *
 * A missing `AUTH_SECRET` in development falls back to a fixed string so a
 * fresh clone can be opened locally. In production it stays empty, and an empty
 * key disables sign-in altogether (`signSession` throws and `readSessionToken`
 * returns null) rather than silently signing cookies with something guessable.
 *
 * The ancestor of this file derived a fallback from the configured admin email
 * list, which is a signing key made of public information. There is no such
 * fallback here on purpose: either the secret is set, or nobody gets in.
 */
function secret(): string {
  if (authSecret) return authSecret;
  return process.env.NODE_ENV === "production" ? "" : "dev-only-insecure-secret";
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

/** Length-independent comparison, so a tag can't be guessed a byte at a time. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(
  session: Omit<Session, "exp"> & { exp?: number },
): Promise<string> {
  if (!secret()) throw new Error("AUTH_SECRET is not set.");

  const payload: Session = {
    ...session,
    exp: session.exp ?? Math.floor(Date.now() / 1000) + sessionTtlSeconds,
  };
  const body = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return `${body}.${await hmac(body)}`;
}

/**
 * Verify and decode. Returns null for anything at all suspicious (a bad tag,
 * a malformed payload, an unknown role, an expired session), so callers only
 * ever handle a valid session or nothing.
 */
export async function readSessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token || !secret()) return null;

  const [body, tag] = token.split(".");
  if (!body || !tag) return null;
  if (!safeEqual(tag, await hmac(body))) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(body)),
    ) as Session;

    // An unrecognised role is not a reader by default. A payload this cheap to
    // validate should be validated: the only two values that exist are listed.
    if (session.role !== "reader" && session.role !== "admin") return null;
    if (typeof session.name !== "string") return null;
    if (typeof session.exp !== "number") return null;
    if (session.exp * 1000 < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

export { sessionCookieName };
