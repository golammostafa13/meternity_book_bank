"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { categoryName, formatNumberIn, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { resultsCount } from "@/lib/i18n/format";
import type { Category } from "@/types";

/**
 * Filter bar for /books.
 *
 * Filters live entirely in the URL rather than component state, so every
 * filtered view is linkable, shareable, back-button-correct and (once this
 * is on Cloudflare) independently cacheable at the edge.
 */
export function CatalogueFilters({
  categories,
  total,
  lang,
}: {
  categories: Category[];
  total: number;
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const router = useRouter();
  const params = useSearchParams();

  const current = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    language: params.get("language") ?? "",
    sort: params.get("sort") ?? "recent",
  };

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any filter change resets to page 1
    router.push(`${localePath(lang, "/books")}?${next.toString()}`, {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            update("q", String(value ?? ""));
          }}
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={current.q}
            placeholder={dict.catalogue.searchPlaceholder}
            aria-label={dict.common.searchTheCatalogue}
            className={cn(
              "h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[0.95rem] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none",
              textClass(lang),
            )}
          />
        </form>

        <label className="sr-only" htmlFor="sort">
          {dict.catalogue.sortBy}
        </label>
        <select
          id="sort"
          value={current.sort}
          onChange={(e) => update("sort", e.target.value)}
          className={cn(
            "h-12 rounded-full border border-line bg-surface px-5 text-[0.95rem] text-ink focus:border-accent focus:outline-none",
            textClass(lang),
          )}
        >
          <option value="recent">{dict.catalogue.sortRecent}</option>
          <option value="popular">{dict.catalogue.sortPopular}</option>
          <option value="title">{dict.catalogue.sortTitle}</option>
          <option value="year">{dict.catalogue.sortYear}</option>
        </select>

        <label className="sr-only" htmlFor="language">
          {dict.catalogue.language}
        </label>
        <select
          id="language"
          value={current.language}
          onChange={(e) => update("language", e.target.value)}
          className={cn(
            "h-12 rounded-full border border-line bg-surface px-5 text-[0.95rem] text-ink focus:border-accent focus:outline-none",
            textClass(lang),
          )}
        >
          {/* The *book's* language, which is a different question from the
              interface language: a Bengali reader may well want an English
              title. */}
          <option value="">{dict.catalogue.allLanguages}</option>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "mr-1 inline-flex items-center gap-1.5 text-sm text-ink-faint",
            textClass(lang),
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {dict.catalogue.filter}
        </span>
        <FilterChip
          label={dict.catalogue.all}
          active={!current.category}
          lang={lang}
          onClick={() => update("category", "")}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            label={categoryName(c, lang)}
            count={formatNumberIn(c.bookCount, lang)}
            active={current.category === c.id}
            lang={lang}
            onClick={() => update("category", c.id)}
          />
        ))}
        <span
          className={cn("ml-auto text-sm text-ink-faint", textClass(lang))}
        >
          {resultsCount(dict, lang, total)}
        </span>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  lang,
  onClick,
}: {
  label: string;
  count?: string;
  active: boolean;
  lang: Locale;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm transition-all",
        textClass(lang),
        active
          ? "bg-accent text-accent-ink shadow-glow"
          : "border border-line bg-surface text-ink-mute hover:border-accent/40 hover:text-accent",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "ml-1.5",
            active ? "text-accent-ink/65" : "text-ink-faint",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
