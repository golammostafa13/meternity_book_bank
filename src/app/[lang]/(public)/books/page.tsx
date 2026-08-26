import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookGrid3D } from "@/components/book-grid-3d";
import {
  CatalogueCinema,
  type CatalogueChip,
  type CatalogueFilter,
  type CatalogueSpotlight,
} from "@/components/catalogue-cinema";
import { Pagination } from "@/components/pagination";
import { getBooks, getCategories, getSubjects } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  bookAuthorName,
  bookDescription,
  bookTitle,
  categoryName,
  subjectName,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { fill, resultsCount, titlesCount } from "@/lib/i18n/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { BookLanguage, CatalogueQuery } from "@/types";

export async function generateMetadata(
  props: PageProps<"/[lang]/books">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.catalogue.metaTitle,
    description: dict.catalogue.metaDescription,
    alternates: {
      canonical: localePath(lang, "/books"),
      languages: {
        en: localePath("en", "/books"),
        bn: localePath("bn", "/books"),
      },
    },
  };
}

/**
 * The catalogue.
 *
 * Two halves, and the split is the point. The room at the top is where a reader
 * arrives: it names the shelf, puts the four filters within reach of one
 * click each, and stands one book up properly so the shelf has a face. The grid below is where
 * the same reader looks something up. Running the two together (a title, a form
 * and a grid stacked down one page) is what this replaces, and it did neither
 * job especially well.
 *
 * Every control in the room is a link or a plain GET form, so the whole of the
 * top half is static HTML: filters stay in the URL, which is what makes a
 * filtered view linkable, crawlable and cacheable, and this page needs no
 * client bundle at all now that the signed-in state has moved to the header.
 */
export default async function BooksPage(props: PageProps<"/[lang]/books">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const sp = await props.searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const query: CatalogueQuery = {
    q: first(sp.q),
    category: first(sp.category),
    subject: first(sp.subject),
    language: first(sp.language) as BookLanguage | undefined,
    sort: first(sp.sort) as CatalogueQuery["sort"],
    page: Number(first(sp.page) ?? 1) || 1,
    perPage: 12,
  };

  const [result, categories, subjects] = await Promise.all([
    getBooks(query),
    getCategories(),
    getSubjects(),
  ]);

  const base = localePath(lang, "/books");

  /**
   * A link to this same page with one thing changed.
   *
   * Any filter change drops `page`, because page 3 of an old filter is not a
   * place in the new one. Absent and empty are the same thing, so an unset
   * parameter never appears in the URL and the unfiltered view is the bare
   * path rather than a path with four empty parameters on it.
   */
  const hrefWith = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      q: query.q,
      category: query.category,
      subject: query.subject,
      language: query.language,
      sort: query.sort,
      ...changes,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const search = params.toString();
    return search ? `${base}?${search}` : base;
  };

  /* --- The filters ------------------------------------------------------
     Four axes, one row of menus, and the first two combine: a reader can ask
     for labour and birth *and* obstetrics, and the URL carries both. They are
     not nested — see the note on `Subject` in `types` — so neither filters the
     other's options, and a combination that matches nothing says so rather
     than quietly hiding the option that produced it.

     Sort and book language are in the same row and in the same shape. They
     were a separate style of control underneath, on the theory that they are
     quieter; but a reader looking for a Bengali book does not experience
     "which language" as a quieter question than "which shelf", and two
     grammars for one job is the thing that made this band hard to read.
     --------------------------------------------------------------------- */
  const sorts: CatalogueQuery["sort"][] = ["recent", "popular", "title", "year"];
  const sortLabel: Record<string, string> = {
    recent: dict.catalogue.sortRecent,
    popular: dict.catalogue.sortPopular,
    title: dict.catalogue.sortTitle,
    year: dict.catalogue.sortYear,
  };
  const sort = query.sort ?? "recent";

  /* The *book's* language, which is a different question from the interface
     language: a Bengali reader may well want an English title. Both are named
     in their own script, never translated. */
  const languageLabel: Record<string, string> = { bn: "বাংলা", en: "English" };

  const activeCategory = categories.find((c) => c.id === query.category);
  const activeSubject = subjects.find((s) => s.id === query.subject);

  const filters: CatalogueFilter[] = [
    {
      key: "category",
      label: dict.catalogue.byCategory,
      value: activeCategory
        ? categoryName(activeCategory, lang)
        : dict.catalogue.all,
      active: Boolean(activeCategory),
      options: [
        {
          key: "all",
          label: dict.catalogue.all,
          href: hrefWith({ category: undefined }),
          active: !query.category,
        },
        ...categories.map((category) => ({
          key: category.id,
          label: categoryName(category, lang),
          count: formatNumberIn(category.bookCount, lang),
          href: hrefWith({ category: category.id }),
          active: query.category === category.id,
        })),
      ],
    },
    {
      key: "subject",
      label: dict.catalogue.bySubject,
      value: activeSubject
        ? subjectName(activeSubject, lang)
        : dict.catalogue.all,
      active: Boolean(activeSubject),
      options: [
        {
          key: "all",
          label: dict.catalogue.all,
          href: hrefWith({ subject: undefined }),
          active: !query.subject,
        },
        ...subjects.map((subject) => ({
          key: subject.id,
          label: subjectName(subject, lang),
          count: formatNumberIn(subject.bookCount, lang),
          href: hrefWith({ subject: subject.id }),
          active: query.subject === subject.id,
        })),
      ],
    },
    {
      key: "language",
      label: dict.catalogue.language,
      value: query.language
        ? languageLabel[query.language]
        : dict.catalogue.allLanguages,
      active: Boolean(query.language),
      options: [
        {
          key: "any",
          label: dict.catalogue.allLanguages,
          href: hrefWith({ language: undefined }),
          active: !query.language,
        },
        ...(["bn", "en"] as const).map((code) => ({
          key: code,
          label: languageLabel[code],
          href: hrefWith({ language: code }),
          active: query.language === code,
        })),
      ],
    },
    {
      /* Never `active`, however it is set, and never chipped below: sorting
         changes what comes first, not what is there. The menu stating its own
         answer is the whole of the signal a reader needs that they changed
         it, and calling it a filter would tell them the shelf is short when
         it is not. */
      key: "sort",
      label: dict.catalogue.sortBy,
      value: sortLabel[String(sort)],
      active: false,
      options: sorts.map((option) => ({
        key: String(option),
        label: sortLabel[String(option)],
        href: hrefWith({ sort: option }),
        active: sort === option,
      })),
    },
  ];

  /* --- What is in force, spelled out ------------------------------------
     One chip per filter, each of them the way out of itself, and the whole
     row absent when nothing is set. This is what the menus above cannot do:
     a menu hides its options by design, so without this a reader four clicks
     in has no single place that says what they are looking at.
     --------------------------------------------------------------------- */
  const applied: CatalogueChip[] = [];
  const chip = (key: string, axis: string, value: string, href: string) => {
    applied.push({
      key,
      axis,
      value,
      href,
      /* The link's text is "Subject Gynecology ×", which says what it is and
         not what pressing it does. The accessible name says both. */
      removeLabel: fill(lang, dict.catalogue.remove, {
        label: `${axis} ${value}`,
      }),
    });
  };

  if (query.q)
    chip("q", dict.common.search, `\u201c${query.q}\u201d`, hrefWith({ q: undefined }));
  if (activeCategory)
    chip(
      "category",
      dict.catalogue.byCategory,
      categoryName(activeCategory, lang),
      hrefWith({ category: undefined }),
    );
  if (activeSubject)
    chip(
      "subject",
      dict.catalogue.bySubject,
      subjectName(activeSubject, lang),
      hrefWith({ subject: undefined }),
    );
  if (query.language)
    chip(
      "language",
      dict.catalogue.language,
      languageLabel[query.language],
      hrefWith({ language: undefined }),
    );

  /* --- The book standing in the middle ---------------------------------- */
  const lead = result.items[0];
  const position = (result.page - 1) * result.perPage + 1;
  /* The scale the page count is read against: the longest book in view. A
     figure with a scale reads as a measurement and a figure without one reads
     as trivia, which is the whole reason the reference's dose row has a
     "of 1,150" on it. */
  const longest = Math.max(...result.items.map((book) => book.pages), 1);

  const spotlight: CatalogueSpotlight | undefined = lead && {
    id: lead.id,
    code: lead.code,
    title: bookTitle(lead, lang),
    author: bookAuthorName(lead, lang),
    description: bookDescription(lead, lang),
    counter: `${formatNumberIn(position, lang).padStart(
      2,
      formatNumberIn(0, lang),
    )} / ${formatNumberIn(result.total, lang)}`,
    counterLabel: fill(lang, dict.carousel.position, {
      title: bookTitle(lead, lang),
      n: position,
      total: result.total,
    }),
    spec: [
      { label: dict.book.publisher, value: lead.publisher },
      { label: dict.book.published, value: formatYearIn(lead.year, lang) },
      {
        label: dict.book.pages,
        value: formatNumberIn(lead.pages, lang),
        unit: fill(lang, dict.catalogue.ofN, { n: longest }),
        share: lead.pages / longest,
      },
    ],
    href: localePath(lang, `/books/${lead.slug}`),
    cover: {
      id: lead.id,
      title: lead.title,
      titleBn: lead.titleBn,
      authorName: lead.authorName,
      authorNameBn: lead.authorNameBn,
      coverHue: lead.coverHue,
      coverImage: lead.coverImage,
      pages: lead.pages,
    },
  };

  // ItemList tells search engines this is a browsable collection rather
  // than a single document.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} · ${dict.catalogue.title}`,
    inLanguage: lang,
    numberOfItems: result.total,
    itemListElement: result.items.map((b, i) => ({
      "@type": "ListItem",
      position: (result.page - 1) * result.perPage + i + 1,
      url: `${site.url}${localePath(lang, `/books/${b.slug}`)}`,
      name: bookTitle(b, lang),
    })),
  };

  return (
    <>
      <CatalogueCinema
        lang={lang}
        copy={{
          eyebrow: `${dict.catalogue.eyebrow} · ${titlesCount(dict, lang, result.total)}`,
          title: dict.catalogue.title,
          strapline: dict.catalogue.strapline,
          searchPlaceholder: dict.catalogue.searchPlaceholder,
          searchLabel: dict.common.search,
          filterLabel: dict.catalogue.filter,
          appliedLabel: dict.catalogue.applied,
          openRecord: dict.catalogue.openRecord,
          seeAll: dict.catalogue.seeAll,
          empty: dict.catalogue.empty,
        }}
        filters={filters}
        applied={applied}
        reset={
          /* Two or more chips is where unpicking them one at a time starts to
             cost more than starting again. At one chip the chip *is* the
             clear-all, and a second control saying so is noise. */
          applied.length > 1
            ? { label: dict.catalogue.clearAll, href: base }
            : undefined
        }
        spotlight={spotlight}
        search={{
          action: base,
          keep: {
            category: query.category,
            subject: query.subject,
            language: query.language,
            sort: query.sort,
          },
          q: query.q,
        }}
        gridHref="#catalogue"
      />

      {/* The grid. Its own ground, its own heading, and a scroll target so
          the room above can send a reader straight here. */}
      <section id="catalogue" className="scroll-mt-[var(--topbar-h)]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.22em] text-ink-faint",
              textClass(lang),
            )}
          >
            {resultsCount(dict, lang, result.total)}
          </p>

          {result.items.length === 0 ? (
            <p
              className={cn(
                "py-24 text-center text-lg text-ink-mute",
                textClass(lang),
              )}
            >
              {dict.catalogue.empty}
            </p>
          ) : (
            /* No heading of its own: the room above has just said the
               collection's name in 4rem of italic serif, and the count on
               the line above this is the only thing left to say. */
            <BookGrid3D books={result.items} lang={lang} className="mt-8" />
          )}

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={base}
            dict={dict}
            searchParams={{
              q: query.q,
              category: query.category,
              subject: query.subject,
              language: query.language,
              sort: query.sort,
            }}
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
