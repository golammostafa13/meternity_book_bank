import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * Crawlers get the sign-in page and nothing else.
 *
 * Everything else on this site is behind an account and answers an anonymous
 * request (a crawler's included) with a redirect back to that page. Saying
 * so here saves the crawl budget being spent discovering the same redirect a
 * thousand times.
 *
 * `/api/` is listed even though nothing there would serve a crawler anything:
 * the book files live behind it now, and a disallow is cheaper than relying on
 * every crawler to give up politely at a 401.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Locale-prefixed, and the bare paths too in case a crawler finds one
        // before the redirect.
        allow: [
          "/$",
          ...locales.map((lang) => `/${lang}/signin`),
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
