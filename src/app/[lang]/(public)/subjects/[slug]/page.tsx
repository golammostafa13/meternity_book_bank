import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { getBooksBySubject, getSubject, getSubjects } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath, locales } from "@/lib/i18n";
import {
  bookTitle,
  subjectDescription,
  subjectName,
  textClass,
} from "@/lib/i18n/content";
import { titlesCount } from "@/lib/i18n/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  const subjects = await getSubjects();
  return locales.flatMap((lang) =>
    subjects.map((s) => ({ lang, slug: s.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[lang]/subjects/[slug]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const subject = await getSubject(slug);
  if (!subject) return { title: dict.subjects.notFound };

  return {
    title: subjectName(subject, lang),
    description: subjectDescription(subject, lang),
    /* The plate is the page's share image too. It is the only picture on the
       page, so anything else here would be a second one nobody has seen. */
    openGraph: { images: [{ url: subject.image }] },
    alternates: {
      canonical: localePath(lang, `/subjects/${subject.slug}`),
      languages: {
        en: localePath("en", `/subjects/${subject.slug}`),
        bn: localePath("bn", `/subjects/${subject.slug}`),
      },
    },
  };
}

export default async function SubjectPage(
  props: PageProps<"/[lang]/subjects/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const subject = await getSubject(slug);
  if (!subject) notFound();

  const books = await getBooksBySubject(subject.id);
  const name = subjectName(subject, lang);
  const href = (path: string) => localePath(lang, path);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    inLanguage: lang,
    description: subjectDescription(subject, lang),
    url: `${site.url}${href(`/subjects/${subject.slug}`)}`,
    image: `${site.url}${subject.image}`,
    hasPart: books.map((b) => ({
      "@type": "Book",
      name: bookTitle(b, lang),
      url: `${site.url}${href(`/books/${b.slug}`)}`,
    })),
  };

  return (
    <div>
      {/* ------------------------------------------------------------------
          The plate

          One image, full-bleed, and the page opens on it. This is the whole
          of what a subject looks like — there is no gallery and no second
          picture further down, because a subject is one idea and a reader
          who has seen the plate has seen it.

          The heading sits *on* the image rather than under it. That is what
          makes the picture part of the page instead of a banner stuck above
          one, and it is why the plate is drawn mid-tone (see
          `scripts/build-subject-art.mjs`): the type has to stay legible over
          every part of it in both themes, which a photograph could not
          promise and a controlled duotone can.
      ------------------------------------------------------------------ */}
      <header className="relative isolate overflow-hidden border-b border-line">
        <Image
          src={subject.image}
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-10 object-cover"
        />
        {/* The scrim, not the image, is what guarantees contrast. Two stops
            from the page's own ground: heavier at the foot, where the type
            and the breadcrumb are, and clearing towards the top so the motif
            is still visible rather than washed flat. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/85 to-bg/35"
        />

        <div className="mx-auto max-w-7xl px-5 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-14">
          <nav
            aria-label={dict.common.breadcrumb}
            className={cn("text-sm text-ink-mute", textClass(lang))}
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={href("/")} className="hover:text-ink">
                  {dict.common.home}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={href("/subjects")} className="hover:text-ink">
                  {dict.common.subjects}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink">{name}</li>
            </ol>
          </nav>

          <div className="reveal-3d mt-16 max-w-2xl lg:mt-28">
            <h1
              className={cn(
                "text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
                lang === "bn" && "bn leading-[1.3]",
              )}
            >
              {name}
            </h1>
            <p
              className={cn(
                "mt-1 text-2xl text-ink-mute",
                lang === "bn" || "bn",
              )}
            >
              {lang === "bn" ? subject.name : subject.nameBn}
            </p>
            <p className={cn("mt-4 text-lg text-ink-mute", textClass(lang))}>
              {subjectDescription(subject, lang)}
            </p>
            <p className={cn("mt-3 text-sm text-ink-faint", textClass(lang))}>
              {titlesCount(dict, lang, books.length)}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <h2
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
            textClass(lang),
          )}
        >
          {dict.subjects.onThisShelf}
        </h2>

        {/* A subject with nothing under it says so. It cannot happen with the
            seven that ship — every one has at least one title — but a subject
            emptied by an admin moving its last book should read as an empty
            shelf rather than as a page that failed to load. */}
        {books.length === 0 ? (
          <p className={cn("mt-6 text-lg text-ink-mute", textClass(lang))}>
            {dict.subjects.empty}
          </p>
        ) : (
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
        )}

        <Link
          href={href("/subjects")}
          className={cn(
            "mt-14 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover",
            textClass(lang),
          )}
        >
          {dict.subjects.title}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
