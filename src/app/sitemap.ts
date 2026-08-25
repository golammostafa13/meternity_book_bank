import type { MetadataRoute } from "next";
import { localePath, locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * Sitemap.
 *
 * Almost empty now, and deliberately so. The catalogue is behind an account:
 * every book, author and category URL answers a crawler with a redirect to the
 * sign-in form. Listing them would be advertising a thousand addresses that
 * all resolve to the same page, which earns a pile of "redirect" errors in
 * Search Console and not one indexed book.
 *
 * What is left is the door itself. That is the honest extent of what this site
 * now offers a search engine, and the cost of gating the shelves.
 */

const full = (lang: Locale, path = "/") => `${site.url}${localePath(lang, path)}`;

/** The hreflang block every entry shares, for one path. */
const alternatesFor = (path: string) => ({
  languages: Object.fromEntries(
    locales.map((lang) => [lang, full(lang, path)]),
  ),
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return locales.map((lang) => ({
    url: full(lang, "/signin"),
    changeFrequency: "monthly" as const,
    priority: 1,
    alternates: alternatesFor("/signin"),
  }));
}
