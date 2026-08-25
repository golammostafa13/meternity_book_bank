import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Atom,
  Baby,
  BookOpen,
  Feather,
  Landmark,
  Library,
} from "lucide-react";
import { Shelf3D } from "@/components/shelf-3d";
import { getCategoryShelves } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  categoryDescription,
  categoryName,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { titlesCount } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/categories">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.categories.title,
    description: dict.categories.metaDescription,
    alternates: {
      canonical: localePath(lang, "/categories"),
      languages: {
        en: localePath("en", "/categories"),
        bn: localePath("bn", "/categories"),
      },
    },
  };
}

const icons: Record<string, typeof BookOpen> = {
  BookOpen,
  Feather,
  Landmark,
  Atom,
  Baby,
  Library,
};

export default async function CategoriesPage(
  props: PageProps<"/[lang]/categories">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const categories = await getCategoryShelves(10);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="reveal-3d max-w-2xl">
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
            textClass(lang),
          )}
        >
          {dict.categories.eyebrow}
        </p>
        <h1
          className={cn(
            "mt-2 text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
            lang === "bn" && "bn leading-[1.3]",
          )}
        >
          {dict.categories.title}
        </h1>
        <p className={cn("mt-4 text-lg text-ink-mute", textClass(lang))}>
          {dict.categories.lead}
        </p>
      </header>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => {
          const Icon = icons[cat.icon] ?? BookOpen;
          return (
            /* Reveal on a wrapper: the tile's own hover transform has to stay
               free, and a filled scroll animation would own it for good. */
            <div
              key={cat.id}
              className="reveal-3d h-full"
              style={{ "--lag": (i % 3) * 5 } as React.CSSProperties}
            >
              <Link
                href={localePath(lang, `/categories/${cat.slug}`)}
                className="tile3d group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-7 hover:border-accent/40"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2
                  className={cn(
                    "mt-6 text-2xl font-semibold text-ink transition-colors group-hover:text-accent",
                    textClass(lang),
                  )}
                >
                  {categoryName(cat, lang)}
                </h2>
                <p className={cn("mt-3 leading-relaxed text-ink-mute", textClass(lang))}>
                  {categoryDescription(cat, lang)}
                </p>
                <p
                  className={cn(
                    "mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink",
                    textClass(lang),
                  )}
                >
                  {titlesCount(dict, lang, cat.bookCount)}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>

                {/* The shelf shows what is actually on it: this category's
                    most-downloaded volumes, thickness by page count. */}
                <div className="mt-auto pt-8">
                  <Shelf3D
                    books={cat.shelf}
                    lang={lang}
                    height={70}
                    linked={false}
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
