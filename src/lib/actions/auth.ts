"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isRegistrationOpen,
  normalisePhone,
  passwordRole,
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
import { adminUsername, readerUsername } from "@/lib/auth/username";
import { districtById, thanaById } from "@/lib/data/bd-geo";
import { getDictionaryFor, localePath } from "@/lib/i18n";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";

/**
 * Getting in, and being counted.
 *
 * Two actions, and they are not two halves of one flow:
 *
 * **`enterAction`** is the door. One field. The word printed in the sponsored
 * copy opens the library; a different word, known to the sponsor and printed
 * nowhere, opens the admin screens as well. There is nothing else to prove and
 * nobody to be recognised as.
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
 * The rate limit is counted before the password is even looked at, and it
 * counts successes as well as failures: a limiter that only counts failures
 * lets someone who already has the reader password hammer the admin one for
 * free. See `lib/auth/rate-limit`.
 *
 * The rejection message does not say whether the word was close, how long the
 * right one is, or which of the two was being compared. There is one message
 * for "that is not the password", and it is the same message whether the field
 * was empty, wrong, or the admin password mistyped.
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

  const role = passwordRole(String(formData.get("password") ?? ""));
  if (!role) {
    return { ok: false, attempt, message: dict.auth.errorWrongPassword };
  }

  await setSessionCookie(
    await signSession({
      role,
      name: role === "admin" ? adminUsername : readerUsername,
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

/** Deliberately loose: one @, a dot in the domain, no spaces. */
function isEmailShaped(email: string): boolean {
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
