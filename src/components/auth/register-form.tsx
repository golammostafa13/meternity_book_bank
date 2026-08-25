"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { SearchSelect, type SearchOption } from "@/components/ui/search-select";
import { registerAction, type RegisterState } from "@/lib/actions/auth";
import { districts, thanasOf } from "@/lib/data/bd-geo";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

const empty: RegisterState = { ok: false };

/**
 * The register.
 *
 * Not a sign-up form, whatever the URL says: nothing here opens the library (
 * the password does that), and this exists so the sponsor knows where a print
 * run went. Which is exactly why District and Thana are on it, and why they are
 * optional along with everything but a name and a number.
 *
 * The two geography fields are one control in two halves. District is searchable
 * because 64 options in a native `<select>` is unusable on a phone; Thana is
 * searchable because Cumilla has sixteen. Thana is disabled until a district is
 * chosen, and, more importantly, **cleared** when the district changes, because
 * the alternative is a form that quietly submits Dhaka / Teknaf. The server
 * checks the pair as well (`thanaById`), since a client-side reset is a
 * convenience and not a guarantee.
 */
export function RegisterForm({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const [state, formAction, pending] = useActionState(registerAction, empty);
  const bn = textClass(lang);
  const bengali = lang === "bn";

  const [district, setDistrict] = useState(state.values?.district ?? "");
  const [thana, setThana] = useState(state.values?.thana ?? "");

  const attempt = state.attempt ?? 0;
  const errors = state.fieldErrors ?? {};

  // Bengali first when the page is Bengali, and the other spelling still
  // searchable underneath: someone on the Bengali page may well type "Dhaka".
  const districtOptions: SearchOption[] = districts.map((d) => ({
    id: d.id,
    label: bengali ? d.nameBn : d.name,
    labelAlt: bengali ? d.name : d.nameBn,
    aliases: d.aliases,
    note: bengali ? d.divisionBn : d.division,
  }));

  const thanaOptions: SearchOption[] = thanasOf(district).map((t) => ({
    id: t.id,
    label: bengali ? t.nameBn : t.name,
    labelAlt: bengali ? t.name : t.nameBn,
  }));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />

      <div>
        <label
          htmlFor="name"
          className={cn("mb-2 block text-sm font-medium text-ink", bn)}
        >
          {dict.auth.nameLabel}
        </label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            key={`name-${attempt}`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus={attempt === 0}
            defaultValue={state.values?.name ?? ""}
            placeholder={dict.auth.namePlaceholder}
            className={fieldClass(errors.name, "pl-11")}
          />
        </div>
        {errors.name && (
          <p role="alert" className={cn("mt-1.5 text-sm text-danger", bn)}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className={cn("mb-2 block text-sm font-medium text-ink", bn)}
        >
          {dict.auth.phoneLabel}
        </label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            key={`phone-${attempt}`}
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={state.values?.phone ?? ""}
            placeholder={dict.auth.phonePlaceholder}
            className={fieldClass(errors.phone, "pl-11")}
          />
        </div>
        {errors.phone && (
          <p role="alert" className={cn("mt-1.5 text-sm text-danger", bn)}>
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className={cn("mb-2 block text-sm font-medium text-ink", bn)}
        >
          {dict.auth.emailLabel}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            key={`email-${attempt}`}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            defaultValue={state.values?.email ?? ""}
            placeholder={dict.auth.emailPlaceholder}
            className={fieldClass(errors.email, "pl-11")}
          />
        </div>
        {errors.email ? (
          <p role="alert" className={cn("mt-1.5 text-sm text-danger", bn)}>
            {errors.email}
          </p>
        ) : (
          <p className={cn("mt-1.5 text-sm text-ink-faint", bn)}>
            {dict.auth.fieldOptional}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="district"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.auth.districtLabel}
          </label>
          <SearchSelect
            id="district"
            name="district"
            options={districtOptions}
            value={district}
            onChange={(id) => {
              setDistrict(id);
              // The thana belonged to the old district. Keeping it would submit
              // a pair that does not exist.
              setThana("");
            }}
            placeholder={dict.auth.districtPlaceholder}
            searchPlaceholder={dict.auth.districtSearch}
            emptyLabel={dict.auth.districtEmpty}
            bnClass={bn}
          />
        </div>

        <div>
          <label
            htmlFor="thana"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.auth.thanaLabel}
          </label>
          <SearchSelect
            id="thana"
            name="thana"
            options={thanaOptions}
            value={thana}
            onChange={setThana}
            placeholder={dict.auth.thanaPlaceholder}
            searchPlaceholder={dict.auth.thanaPlaceholder}
            emptyLabel={dict.auth.thanaEmpty}
            disabled={!district}
            disabledLabel={dict.auth.thanaPickDistrictFirst}
            bnClass={bn}
          />
        </div>
      </div>

      <p className={cn("text-sm text-ink-faint", bn)}>
        {dict.auth.fieldOptional}
      </p>

      {state.message && (
        <p
          role="alert"
          className={cn("flex items-start gap-2 text-sm text-danger", bn)}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-6! w-full"
        disabled={pending}
      >
        {pending ? dict.auth.signingUp : dict.auth.signUpContinue}
      </Button>
    </form>
  );
}
