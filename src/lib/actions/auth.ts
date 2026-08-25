"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordEntry } from "@/lib/auth/accounts";
import {
  doorRole,
  isEmailShaped,
  isRegistrationOpen,
  normaliseEmail,
  normalisePhone,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/config";
import {
  checkDoorAttempt,
  clientAddress,
  MAX_ATTEMPTS,
} from "@/lib/auth/rate-limit";
import { saveReader } from "@/lib/auth/readers";
import { signSession } from "@/lib/auth/session";
import { adminUsername, displayName } from "@/lib/auth/username";
import { districtById, thanaById } from "@/lib/data/bd-geo";
import { getDictionaryFor, localePath } from "@/lib/i18n";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";

/**
 * Getting in, and being counted.
 *
 * Two actions, and they are not two halves of one flow:
 *
 * **`enterAction`** is the door. Two fields, answering two different questions.
 * The word printed in the sponsored copy opens the library, and every reader
 * types the same one; the address alongside it grants a reader nothing at all
 * and is collected because it is the only durable handle this site has on who
 * is reading. For an administrator the two are read together: a different word,
 * printed nowhere, opens the admin screens *only* for an address listed in
 * `ADMIN_EMAILS`.
 *
 * **`registerAction`** is the register. It writes a row so the sponsor knows who
 * received a copy and where (which is what the District and Thana fields are
 * for), and it grants nothing at all. A reader who registers still needs the
 * password, and a reader who never registers is not held back by it. Every
 * field on it is optional except the name and the phone number that keys it.
 *
 * Keeping those apart is the whole reason each one stays this short.
 */

export interface DoorState {
  ok: boolean;
  message?: string;
  /**
   * The address that was typed, echoed back.
   *
   * The password never is, and that asymmetry is the point: a rejected reader
   * should not have to retype an address they got right in order to correct a
   * word they got wrong, and a password put back into the DOM is a password
   * sitting in the page for whatever reads it next.
   */
  email?: string;
  /** Bumped every time, so a second identical rejection still remounts. */
  attempt?: number;
}

export interface RegisterState {
  ok: boolean;
  message?: string;
  /** Per-field messages, keyed by input name. */
  fieldErrors?: Partial<Record<"name" | "phone" | "email", string>>;
  /** What was typed, echoed back. */
  values?: {
    name?: string;
    phone?: string;
    email?: string;
    district?: string;
    thana?: string;
  };
  attempt?: number;
}

/** Which language to answer in. */
function localeOf(formData: FormData) {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

/**
 * Where to go once through the door.
 *
 * `next` comes from the proxy's redirect and is therefore attacker-supplied.
 * Only a same-site absolute path is honoured: `//evil.example` is a protocol-
 * relative URL that browsers treat as another origin, which is why the second
 * test is there and not redundant.
 */
function destination(
  formData: FormData,
  lang: ReturnType<typeof localeOf>,
  fallback = "/books",
) {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//")
    ? next
    : localePath(lang, fallback);
}

/** The session cookie's flags live in config; both setters go through here. */
async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(sessionCookieName, token, sessionCookieOptions);
}

/**
 * The door.
 *
 * The rate limit is counted before either field is looked at, and it counts
 * successes as well as failures: a limiter that only counts failures lets
 * someone who already has the reader password hammer the admin one for free.
 * See `lib/auth/rate-limit`.
 *
 * The address is checked first, and only for shape. That order matters for the
 * reason a form's order usually does — "that is not an email address" is a
 * message someone can act on, and burying it under a password rejection means
 * retyping the word before discovering the real problem — but it also means the
 * cheap test runs before the one worth protecting.
 *
 * The password rejection says nothing else. Not whether the word was close, not
 * how long the right one is, not which of the two was being compared, and — the
 * one that would matter most — not whether the failure was the word or the
 * address. `doorRole` returns the same `null` for an unlisted address typing the
 * admin password as for a listed one typing nonsense, and this returns the same
 * sentence for both, so the form cannot be used to discover who the
 * administrators are.
 */
export async function enterAction(
  prev: DoorState,
  formData: FormData,
): Promise<DoorState> {
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);
  const attempt = (prev.attempt ?? 0) + 1;

  const limit = await checkDoorAttempt(clientAddress(await headers()));
  if (!limit.ok) {
    return {
      ok: false,
      attempt,
      message: fill(lang, dict.auth.errorTooMany, {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
        attempts: MAX_ATTEMPTS,
      }),
    };
  }

  const email = normaliseEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { ok: false, attempt, email, message: dict.auth.errorEmailEmpty };
  }
  if (!isEmailShaped(email)) {
    return { ok: false, attempt, email, message: dict.auth.errorEmailInvalid };
  }

  const role = doorRole(email, String(formData.get("password") ?? ""));
  if (!role) {
    return { ok: false, attempt, email, message: dict.auth.errorWrongPassword };
  }

  // Written down, never depended on. A reader holding the right printed word is
  // entitled to the library whether or not the store is reachable, and there is
  // nothing here that granting access would consult — so a failure is swallowed
  // rather than turned into a locked door. See `lib/auth/accounts`.
  try {
    await recordEntry(email, role);
  } catch {
    // Intentionally empty: the history is worth having, not worth a 500.
  }

  await setSessionCookie(
    await signSession({
      role,
      email,
      // The administrator shows as the library rather than as a person: the
      // admin screens are the library's own, and whoever is at the desk today
      // is not what that header is naming.
      name: role === "admin" ? adminUsername : displayName(email),
    }),
  );

  redirect(destination(formData, lang));
}

/**
 * Sign out. Clears the cookie and returns to the door.
 */
export async function leaveAction(formData?: FormData): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName);
  redirect(localePath(formData ? localeOf(formData) : defaultLocale, "/signin"));
}

/**
 * The register.
 *
 * Validation is deliberately thin. This is a courtesy record, not a credential,
 * and every rejected submission is a reader who wanted to be counted and was
 * told no by a form. So: a name, a phone number that looks like a Bangladeshi
 * mobile, and everything else optional.
 *
 * The one non-obvious rule is the district/thana pair. Both are optional, but a
 * thana that does not belong to the chosen district is not a validation error to
 * show someone: it is what happens when they pick Dhaka / Savar and then change
 * the district to Khulna. The stale thana is dropped and the district kept,
 * because that is what they last said.
 */
export async function registerAction(
  prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);

  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = normalisePhone(phoneRaw);
  const email = String(formData.get("email") ?? "").trim();
  const districtId = String(formData.get("district") ?? "").trim();
  const thanaId = String(formData.get("thana") ?? "").trim();

  const values = {
    name,
    phone: phoneRaw,
    email,
    district: districtId,
    thana: thanaId,
  };
  const reject = (
    fieldErrors: RegisterState["fieldErrors"],
    message?: string,
  ): RegisterState => ({
    ok: false,
    message,
    fieldErrors,
    values,
    attempt: (prev.attempt ?? 0) + 1,
  });

  if (!isRegistrationOpen()) {
    return reject(undefined, dict.auth.errorUnavailable);
  }

  const fieldErrors: RegisterState["fieldErrors"] = {};
  if (!name) fieldErrors.name = dict.auth.errorNameEmpty;
  if (!phone) {
    fieldErrors.phone = dict.auth.errorPhoneEmpty;
  } else if (!/^01[3-9]\d{8}$/.test(phone)) {
    // Eleven digits beginning 01, and the third digit is the operator prefix:
    // 013 through 019 are the ones in issue. Looser than that accepts a
    // landline; tighter than that starts rejecting real numbers whenever the
    // regulator hands out a new prefix.
    fieldErrors.phone = dict.auth.errorPhoneInvalid;
  }
  if (email && !isEmailShaped(email)) {
    fieldErrors.email = dict.auth.errorEmailInvalid;
  }
  if (Object.keys(fieldErrors).length > 0) return reject(fieldErrors);

  const district = districtById(districtId);
  const thana = thanaById(district?.id, thanaId);

  try {
    await saveReader({
      phone,
      name,
      email: email || undefined,
      district: district?.id,
      // Dropped rather than rejected when it does not belong to the district.
      thana: thana?.id,
    });
  } catch {
    return reject(undefined, dict.auth.errorUnavailable);
  }

  redirect(localePath(lang, "/signin?registered=1"));
}
