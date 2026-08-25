import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Shelf3D } from "@/components/shelf-3d";
import { getAuthorShelves } from "@/lib/data/books";
import { markTheme } from "@/lib/cover-theme";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { authorBio, authorName, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill, titlesCount } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/authors">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.authors.title,
    description: dict.authors.metaDescription,
    alternates: {
      canonical: localePath(lang, "/authors"),
      languages: {
        en: localePath("en", "/authors"),
        bn: localePath("bn", "/authors"),
      },
    },
  };
}

/**
 * Initials avatar: no image bytes. Colour comes from the same restricted warm
 * set as the covers, so a grid of twelve of them can't turn into a pastel
 * rainbow the way a hue-per-index avatar does.
 *
 * Initials always come from the Latin name: Bengali conjuncts do not abbreviate
 * to single letters the way Latin ones do.
 */
function Avatar({ latinName, seed }: { latinName: string; seed: string }) {
  const initials = latinName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  const t = markTheme(seed);
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-e1"
      style={{ background: t.bg, color: t.fg }}
    >
      {initials}
    </span>
  );
}

export default async function AuthorsPage(props: PageProps<"/[lang]/authors">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const authors = await getAuthorShelves(6);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="reveal-3d max-w-2xl">
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
            textClass(lang),
          )}
        >
          {dict.authors.eyebrow}
        </p>
        <h1
          className={cn(
            "mt-2 text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
            lang === "bn" && "bn leading-[1.3]",
          )}
        >
          {dict.authors.title}
        </h1>
        <p className={cn("mt-4 text-lg text-ink-mute", textClass(lang))}>
          {fill(lang, dict.authors.lead, { n: authors.length })}
        </p>
      </header>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {authors.map((author, i) => (
          /* Reveal on a wrapper: the tile's own hover transform has to stay
             free, and a filled scroll animation would own it for good. */
          <div
            key={author.id}
            className="reveal-3d h-full"
            style={{ "--lag": (i % 3) * 5 } as React.CSSProperties}
          >
            <Link
              href={localePath(lang, `/authors/${author.slug}`)}
              className="tile3d group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 hover:border-accent/40"
            >
              <div className="flex gap-4">
                <Avatar latinName={author.name} seed={author.id} />
                <div className="min-w-0">
                  <h2
                    className={cn(
                      "font-semibold text-ink transition-colors group-hover:text-accent",
                      textClass(lang),
                    )}
                  >
                    {authorName(author, lang)}
                  </h2>
                  {author.era && (
                    <p className="mt-0.5 text-xs text-ink-faint">{author.era}</p>
                  )}
                  <p
                    className={cn(
                      "mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-ink-mute",
                      textClass(lang),
                    )}
                  >
                    {authorBio(author, lang)}
                  </p>
                  <p
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink",
                      textClass(lang),
                    )}
                  >
                    {titlesCount(dict, lang, author.bookCount)}
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </p>
                </div>
              </div>

              {/* This writer's body of work, as it would stand on a shelf. */}
              <div className="mt-auto pl-18 pt-7">
                <Shelf3D
                  books={author.shelf}
                  lang={lang}
                  height={56}
                  linked={false}
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
