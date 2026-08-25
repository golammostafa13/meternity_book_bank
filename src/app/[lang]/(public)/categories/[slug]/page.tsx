import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCard } from "@/components/book-card";
import {
  getBooksByCategory,
  getCategories,
  getCategory,
} from "@/lib/data/books";
import { getDictionary, hasLocale, localePath, locales } from "@/lib/i18n";
import {
  bookTitle,
  categoryDescription,
  categoryName,
  textClass,
} from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { titlesCount } from "@/lib/i18n/format";

export async function generateStaticParams() {
  const categories = await getCategories();
  return locales.flatMap((lang) =>
    categories.map((c) => ({ lang, slug: c.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[lang]/categories/[slug]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const category = await getCategory(slug);
  if (!category) return { title: dict.categories.notFound };

  return {
    title: categoryName(category, lang),
    description: categoryDescription(category, lang),
    alternates: {
      canonical: localePath(lang, `/categories/${category.slug}`),
      languages: {
        en: localePath("en", `/categories/${category.slug}`),
        bn: localePath("bn", `/categories/${category.slug}`),
      },
    },
  };
}

export default async function CategoryPage(
  props: PageProps<"/[lang]/categories/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const category = await getCategory(slug);
  if (!category) notFound();

  const books = await getBooksByCategory(category.id);
  const name = categoryName(category, lang);
  const href = (path: string) => localePath(lang, path);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    inLanguage: lang,
    description: categoryDescription(category, lang),
    url: `${site.url}${href(`/categories/${category.slug}`)}`,
    hasPart: books.map((b) => ({
      "@type": "Book",
      name: bookTitle(b, lang),
      url: `${site.url}${href(`/books/${b.slug}`)}`,
    })),
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
            <Link href={href("/categories")} className="hover:text-ink">
              {dict.common.categories}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-mute">{name}</li>
        </ol>
      </nav>

      <header className="reveal-3d mt-10 max-w-2xl">
        <h1
          className={cn(
            "text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
            lang === "bn" && "bn leading-[1.3]",
          )}
        >
          {name}
        </h1>
        {/* The other language's name, as a subtitle: a Bengali shelf is still
            worth naming in English on an English page and vice versa. */}
        <p className={cn("mt-1 text-2xl text-ink-mute", lang === "bn" || "bn")}>
          {lang === "bn" ? category.name : category.nameBn}
        </p>
        <p className={cn("mt-4 text-lg text-ink-mute", textClass(lang))}>
          {categoryDescription(category, lang)}
        </p>
        <p className={cn("mt-3 text-sm text-ink-faint", textClass(lang))}>
          {titlesCount(dict, lang, books.length)}
        </p>
      </header>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
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
