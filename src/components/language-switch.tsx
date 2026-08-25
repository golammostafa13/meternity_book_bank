"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  localeNames,
  locales,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Language switch.
 *
 * Two links, not a button: the language is part of the URL, so switching is a
 * navigation. That means it works without JavaScript, the browser's back button
 * undoes it, and a reader can bookmark or share the page in the language they
 * were reading. It also keeps the current route: switching on a book page
 * lands on that same book in the other language, not back at the home page.
 */
export function LanguageSwitch(props: {
  lang: Locale;
  /** Accessible group label, already translated. */
  label: string;
  className?: string;
}) {
  // `useSearchParams` forces a client-render bailout unless it sits under a
  // Suspense boundary, and this component appears in the header of every
  // prerendered page. The boundary lives here rather than at each of the four
  // call sites, and the fallback is the same switch minus the query string,
  // which is all the query is used for.
  return (
    <Suspense fallback={<Switch {...props} query="" />}>
      <SwitchWithQuery {...props} />
    </Suspense>
  );
}

function SwitchWithQuery(props: {
  lang: Locale;
  label: string;
  className?: string;
}) {
  const query = useSearchParams().toString();
  return <Switch {...props} query={query} />;
}

function Switch({
  lang,
  label,
  className,
  query,
}: {
  lang: Locale;
  label: string;
  className?: string;
  /** Preserved across the switch, so filters survive a language change. */
  query: string;
}) {
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-e1",
        className,
      )}
    >
      {locales.map((locale) => {
        const active = locale === lang;
        const target = switchLocalePath(pathname, locale);
        return (
          <Link
            key={locale}
            href={query ? `${target}?${query}` : target}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            // Both languages are separate documents; a client-side transition
            // would keep the old <html lang> until hydration.
            prefetch={false}
            className={cn(
              "min-w-9 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition-colors",
              active
                ? "bg-accent text-accent-ink"
                : "text-ink-mute hover:bg-accent-soft hover:text-accent",
            )}
          >
            <span aria-hidden="true">{localeNames[locale].short}</span>
            <span className="sr-only">{localeNames[locale].full}</span>
          </Link>
        );
      })}
    </div>
  );
}
