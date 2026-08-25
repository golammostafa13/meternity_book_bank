import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchClient } from "@/components/search-client";
import { getSearchIndex } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/[lang]/search">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.common.search,
    description: dict.search.metaDescription,
    alternates: { canonical: localePath(lang, "/search") },
    // A search results page has nothing durable to index, but its links
    // should still be followed through to the book pages.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage(props: PageProps<"/[lang]/search">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const sp = await props.searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const docs = await getSearchIndex();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
      <h1
        className={cn(
          "text-[clamp(2.1rem,5vw,3.2rem)] font-bold tracking-tight text-ink",
          lang === "bn" && "bn leading-[1.3]",
        )}
      >
        {dict.search.title}
      </h1>
      <p className={cn("mt-3 text-lg text-ink-mute", textClass(lang))}>
        {dict.search.lead}
      </p>

      <div className="mt-10">
        <SearchClient
          docs={docs}
          initialQuery={q ?? ""}
          lang={lang}
        />
      </div>
    </div>
  );
}
