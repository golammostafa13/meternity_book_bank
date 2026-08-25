"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MiniSearch from "minisearch";
import { Search as SearchIcon } from "lucide-react";
import { CoverArt } from "@/components/cover-art";
import type { SearchDoc } from "@/lib/data/books";
import { getDictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { formatYearIn, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill, searchResultsCount } from "@/lib/i18n/format";

/**
 * Client-side catalogue search.
 *
 * The index is a static JSON payload, so search costs zero server work and
 * survives any traffic spike from cache: the same reason the production design
 * generates this index into R2 on upload rather than querying Postgres.
 *
 * Both languages are always searched, whichever the interface is in: a reader on
 * the Bengali site may well type "Sagan", and one on the English site "কবিতা".
 */

/**
 * Split on whitespace and punctuation using Unicode property escapes, so
 * Bengali tokenizes as correctly as Latin. MiniSearch's default splitter is
 * ASCII-centric and would swallow conjuncts.
 */
const tokenize = (text: string): string[] =>
  text.split(/[\s\p{P}\p{S}]+/u).filter(Boolean);

export function SearchClient({
  docs,
  initialQuery = "",
  lang,
}: {
  docs: SearchDoc[];
  initialQuery?: string;
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const [query, setQuery] = useState(initialQuery);
  const bn = textClass(lang);

  const index = useMemo(() => {
    const mini = new MiniSearch<SearchDoc>({
      fields: ["title", "titleBn", "author", "authorBn", "category", "categoryBn"],
      storeFields: [
        "slug",
        "title",
        "titleBn",
        "author",
        "authorBn",
        "category",
        "categoryBn",
        "year",
        "coverHue",
        "id",
      ],
      tokenize,
      processTerm: (term) => term.toLowerCase().normalize("NFC"),
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 3, titleBn: 3 },
      },
    });
    mini.addAll(docs);
    return mini;
  }, [docs]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return index.search(query.trim()).slice(0, 24) as unknown as SearchDoc[];
  }, [index, query]);

  const trimmed = query.trim();

  return (
    <div>
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search.placeholder}
          aria-label={dict.common.searchTheCatalogue}
          autoFocus
          className={cn(
            "h-16 w-full rounded-2xl border border-line bg-surface pl-14 pr-5 text-lg text-ink shadow-e1 placeholder:text-ink-faint focus:border-accent focus:outline-none",
            bn,
          )}
        />
      </div>

      <p
        className={cn("mt-4 text-sm text-ink-faint", bn)}
        aria-live="polite"
      >
        {trimmed
          ? searchResultsCount(dict, lang, results.length, trimmed)
          : dict.search.hint}
      </p>

      {trimmed && results.length === 0 && (
        <p className={cn("mt-10 text-lg text-ink-mute", bn)}>
          {fill(lang, dict.search.empty, { q: trimmed })}
        </p>
      )}

      <ul className="mt-8 space-y-2">
        {results.map((doc) => (
          <li key={doc.id}>
            <Link
              href={localePath(lang, `/books/${doc.slug}`)}
              className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-line hover:bg-surface"
            >
              <span className="h-20 w-[3.4rem] shrink-0 overflow-hidden rounded-md shadow-e2">
                <CoverArt
                  book={{
                    id: doc.id,
                    title: doc.title,
                    titleBn: doc.titleBn || undefined,
                    authorName: doc.author,
                    authorNameBn: doc.authorBn || undefined,
                    coverHue: doc.coverHue,
                    coverImage: doc.coverImage,
                  }}
                  lang={lang}
                  size="sm"
                />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate font-semibold text-ink transition-colors group-hover:text-accent",
                    bn,
                  )}
                >
                  {lang === "bn" ? doc.titleBn || doc.title : doc.title}
                </span>
                <span className={cn("block truncate text-sm text-ink-mute", bn)}>
                  {lang === "bn" ? doc.authorBn || doc.author : doc.author} ·{" "}
                  {lang === "bn" ? doc.categoryBn : doc.category} ·{" "}
                  {formatYearIn(doc.year, lang)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
