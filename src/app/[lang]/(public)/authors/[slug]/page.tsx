import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCard } from "@/components/book-card";
import { getAuthor, getAuthors, getBooksByAuthor } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath, locales } from "@/lib/i18n";
import { authorBio, authorName, textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { inCollectionCount } from "@/lib/i18n/format";

export async function generateStaticParams() {
  const authors = await getAuthors();
  return locales.flatMap((lang) =>
    authors.map((a) => ({ lang, slug: a.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[lang]/authors/[slug]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const author = await getAuthor(slug);
  if (!author) return { title: dict.authors.notFound };

  return {
    title: authorName(author, lang),
    description: authorBio(author, lang),
    alternates: {
      canonical: localePath(lang, `/authors/${author.slug}`),
      languages: {
        en: localePath("en", `/authors/${author.slug}`),
        bn: localePath("bn", `/authors/${author.slug}`),
      },
    },
  };
}

export default async function AuthorPage(
  props: PageProps<"/[lang]/authors/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const author = await getAuthor(slug);
  if (!author) notFound();

  const books = await getBooksByAuthor(author.id);
  const name = authorName(author, lang);
  const href = (path: string) => localePath(lang, path);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    alternateName: author.nameBn,
    description: authorBio(author, lang),
    url: `${site.url}${href(`/authors/${author.slug}`)}`,
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <nav
        aria-label={dict.common.breadcrumb}
        className={cn("text-sm text-ink-faint", textClass(lang))}
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={href("/")} className="hover:text-ink">
              {dict.common.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={href("/authors")} className="hover:text-ink">
              {dict.common.authors}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-mute">{name}</li>
        </ol>
      </nav>

      <header className="reveal-3d mt-10 max-w-3xl">
        <h1
          className={cn(
            "text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
            lang === "bn" && "bn leading-[1.3]",
          )}
        >
          {name}
        </h1>
        {/* The name in the other script, for readers who know the writer by it. */}
        <p className={cn("mt-1 text-2xl text-ink-mute", lang === "bn" || "bn")}>
          {lang === "bn" ? author.name : author.nameBn}
        </p>
        {author.era && <p className="mt-2 text-ink-faint">{author.era}</p>}
        <p
          className={cn(
            "mt-6 text-lg leading-relaxed text-ink-mute",
            textClass(lang),
          )}
        >
          {authorBio(author, lang)}
        </p>
      </header>

      <h2
        className={cn(
          "reveal-3d mt-16 text-2xl font-bold tracking-tight text-ink",
          textClass(lang),
        )}
      >
        {inCollectionCount(dict, lang, books.length)}
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {books.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            lang={lang}
            dict={dict}
            index={i}
          />
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
