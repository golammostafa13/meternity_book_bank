import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { site } from "@/lib/site";

export default async function PublicLayout(
  props: LayoutProps<"/[lang]">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: lang === "bn" ? site.descriptionBn : site.description,
  };

  const searchJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: `${site.url}${localePath(lang)}`,
    inLanguage: lang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}${localePath(lang, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-ink"
      >
        {dict.common.skipToContent}
      </a>
      <SiteHeader lang={lang} />
      {/* The header is fixed, so it takes no space in the flow. Every page
          therefore starts a header's height down, except a full-bleed hero,
          which pulls itself back up by the same amount (see `.cinema` in
          globals.css) so the picture runs to the top edge and the header
          floats on it. */}
      <main id="main" className="flex-1 pt-[var(--topbar-h)]">
        {props.children}
      </main>
      <SiteFooter lang={lang} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
      />
    </div>
  );
}
