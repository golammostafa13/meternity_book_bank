import { BookGrid3D } from "@/components/book-grid-3d";
import {
  BookPanels,
  BookPlate,
  BookRecord,
  BookSponsor,
  BookStatement,
  type BookPanel,
  type BookSpecRow,
} from "@/components/book-cinema";
import { CourtesyBy } from "@/components/courtesy-by";
import { ExiumAd } from "@/components/exium-ad";
import { artFor } from "@/lib/data/chapter-art";
import {
  getAllBooks,
  getAuthorById,
  getBook,
  getCategories,
  getRelated,
  getSubjects,
} from "@/lib/data/books";
import { getDictionary, hasLocale, localePath, locales } from "@/lib/i18n";
import {
  bookAuthorName,
  bookDescription,
  bookSubtitle,
  bookTitle,
  categoryName,
  subjectName,
  formatCompactIn,
  formatDateIn,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Prerender every book in both languages. Two locales × thirty-three books is
 * sixty-six static documents: nothing next to what a rebuild would cost, and
 * it means a Bengali book page is as cacheable as an English one.
 */
export async function generateStaticParams() {
  const books = await getAllBooks();
  return locales.flatMap((lang) => books.map((b) => ({ lang, slug: b.slug })));
}

export async function generateMetadata(
  props: PageProps<"/[lang]/books/[slug]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const book = await getBook(slug);
  if (!book) return { title: dict.book.notFound };

  const primary = bookTitle(book, lang);
  const secondary = bookSubtitle(book, lang);
  const title = secondary ? `${primary} (${secondary})` : primary;
  const description = `${bookDescription(book, lang)} ${lang === "bn"
    ? `${bookAuthorName(book, lang)}-এর ${primary} অনলাইনে বিনামূল্যে পড়ুন বা ${book.format.toUpperCase()} ডাউনলোড করুন।`
    : `Read ${primary} by ${bookAuthorName(book, lang)} online free, or download the ${book.format.toUpperCase()}.`
    }`;

  return {
    title,
    description,
    alternates: {
      canonical: localePath(lang, `/books/${book.slug}`),
      languages: {
        en: localePath("en", `/books/${book.slug}`),
        bn: localePath("bn", `/books/${book.slug}`),
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      locale: lang === "bn" ? "bn_BD" : "en_US",
      url: `${site.url}${localePath(lang, `/books/${book.slug}`)}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BookDetailPage(
  props: PageProps<"/[lang]/books/[slug]">,
) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const room = dict.book.room;

  const book = await getBook(slug);
  if (!book) notFound();

  const [related, author, categories, subjects, all] = await Promise.all([
    getRelated(book, 4),
    getAuthorById(book.authorId),
    getCategories(),
    getSubjects(),
    getAllBooks(),
  ]);

  const title = bookTitle(book, lang);
  const subtitle = bookSubtitle(book, lang);
  const href = (path: string) => localePath(lang, path);

  /* The shelf this book stands on. Its slug is the join to the chapter
     photograph in `public/bg/`, and to the category page: the id is what the
     book record carries, and the two are not the same string. */
  const category = categories.find((c) => c.id === book.categoryId);
  const shelfName = category
    ? categoryName(category, lang)
    : book.categoryName;
  const art = category ? artFor(category.slug) : undefined;

  // Same fallback as `shelfName`: prefer the live record so a renamed subject
  // shows its new name, fall back to the copy denormalised onto the book.
  const subject = subjects.find((s) => s.id === book.subjectId);
  const subjectShelf = subject
    ? subjectName(subject, lang)
    : book.subjectName;

  /* The scales the two measured figures are read against. Both are the whole
     collection, so a 528-page manual draws a full bar and a 24-page leaflet
     draws a stub, which is the point: a figure with no scale beside it is a
     number nobody can place. */
  const longest = Math.max(...all.map((b) => b.pages));
  const mostDownloaded = Math.max(...all.map((b) => b.downloads));

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    alternateName: book.titleBn,
    author: { "@type": "Person", name: book.authorName },
    publisher: { "@type": "Organization", name: book.publisher },
    datePublished: String(book.year),
    isbn: book.isbn,
    numberOfPages: book.pages,
    inLanguage: book.language === "bn" ? "bn" : "en",
    bookFormat: "https://schema.org/EBook",
    description: book.description,
    url: `${site.url}${href(`/books/${book.slug}`)}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: book.rating,
      bestRating: 5,
      ratingCount: Math.max(12, Math.round(book.downloads / 40)),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.common.home,
        item: `${site.url}${href("/")}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.common.books,
        item: `${site.url}${href("/books")}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${site.url}${href(`/books/${book.slug}`)}`,
      },
    ],
  };

  /* --- Act II: the three plates ---------------------------------------
     The cover, the subject and the imprint. The imprint panel is where the
     licence and the source finally get shown: every title here is somebody
     else's publication redistributed under a licence that *requires* the
     attribution, so it belongs on the book's own page rather than only in a
     credits list somewhere else. --------------------------------------- */
  const panels: BookPanel[] = [];

  if (book.coverImage) {
    panels.push({
      key: "cover",
      caption: room.coverPlate,
      image: { src: book.coverImage, alt: title },
    });
  }

  if (art) {
    panels.push({
      key: "subject",
      caption: shelfName,
      image: { src: `/bg/${art.slug}.webp`, alt: art.title },
      credit: fill(lang, room.photographBy, { artist: art.artist }),
    });
  }

  panels.push({
    key: "imprint",
    caption: room.imprintPlate,
    rows: [
      { label: dict.book.publisher, value: book.publisher },
      /* The clinical subject, named on the record. Plain text rather than a
         link: an imprint row's href opens in a new tab, which is right for the
         source URL beside it and wrong for a shelf on this same site. */
      { label: dict.book.subject, value: subjectShelf },
      { label: dict.book.published, value: formatYearIn(book.year, lang) },
      ...(book.edition
        ? [{ label: dict.book.edition, value: book.edition }]
        : []),
      ...(book.isbn ? [{ label: dict.book.isbn, value: book.isbn }] : []),
      ...(book.license
        ? [{ label: room.licenceLabel, value: book.license }]
        : []),
      ...(book.sourceUrl
        ? [
            {
              label: room.sourceLabel,
              value: book.sourceUrl,
              href: book.sourceUrl,
              hrefLabel: room.viewOriginal,
            },
          ]
        : []),
    ],
  });

  /* --- Act IV: the record ---------------------------------------------
     Deliberately not the same facts as the imprint panel above. That one is
     the publication; this is the copy in this library: how long it is, what
     the file is, where the printed one stands, how often it is taken.
     -------------------------------------------------------------------- */
  const specRows: BookSpecRow[] = [
    {
      label: dict.book.pages,
      value: formatNumberIn(book.pages, lang),
      unit: fill(lang, dict.catalogue.ofN, {
        n: formatNumberIn(longest, lang),
      }),
      share: book.pages / longest,
    },
    {
      label: dict.book.format,
      value: book.format.toUpperCase(),
      unit: `${formatNumberIn(book.fileSizeMb, lang)} MB`,
    },
    {
      label: dict.book.language,
      value: book.language === "bn" ? dict.book.bengali : dict.book.english,
    },
    {
      label: room.downloadsLabel,
      value: formatCompactIn(book.downloads, lang),
      unit: fill(lang, dict.catalogue.ofN, {
        n: formatCompactIn(mostDownloaded, lang),
      }),
      share: book.downloads / mostDownloaded,
    },
    { label: dict.book.shelf, value: book.shelf },
    { label: dict.book.accession, value: book.code },
  ];

  return (
    <article className="tome">
      <BookPlate
        lang={lang}
        crumbLabel={dict.common.breadcrumb}
        crumbs={[
          { label: dict.common.home, href: href("/") },
          { label: dict.common.books, href: href("/books") },
          { label: title },
        ]}
        eyebrow={[book.code, shelfName].filter(Boolean).join(" · ")}
        title={title}
        subtitle={subtitle}
        byLabel={dict.book.by}
        author={{
          name: bookAuthorName(book, lang),
          href: href(author ? `/authors/${author.slug}` : "/authors"),
        }}
        figures={[
          {
            key: "rating",
            glyph: "rating",
            text: `${formatNumberIn(book.rating, lang)} ${dict.book.ratingOutOf}`,
          },
          {
            key: "downloads",
            glyph: "downloads",
            text: fill(lang, dict.book.downloads, {
              n: formatCompactIn(book.downloads, lang),
            }),
          },
          {
            key: "added",
            text: fill(lang, dict.book.added, {
              date: formatDateIn(book.addedAt, lang),
            }),
          },
        ]}
        read={{ href: href(`/read/${book.slug}`), label: dict.common.readOnline }}
        take={{
          href: book.fileUrl,
          label: fill(lang, dict.common.downloadFormat, {
            format: book.format.toUpperCase(),
          }),
        }}
        fileNote={fill(lang, dict.book.fileSizeLine, { mb: book.fileSizeMb })}
        scrollHint={room.scrollHint}
        cueHref="#about"
        backdrop={
          art ? { src: `/bg/${art.slug}.webp`, alt: art.title } : undefined
        }
        film="/atmosphere.webm"
        cover={book}
      />

      <BookPanels
        lang={lang}
        panels={panels}
        note={{
          eyebrow: dict.book.aboutThisBook,
          text: bookDescription(book, lang),
          cta: {
            href: href(`/read/${book.slug}`),
            label: dict.common.readOnline,
          },
        }}
      />

      <BookStatement
        lang={lang}
        lead={room.statementLead}
        word={room.statementWord}
      />

      <BookRecord
        lang={lang}
        eyebrow={room.recordEyebrow}
        title={dict.book.details}
        rows={specRows}
        copies={{
          title: dict.book.physicalCopies,
          line: fill(lang, dict.book.copiesLine, {
            available: book.copiesAvailable,
            total: book.copiesTotal,
            shelf: book.shelf,
          }),
          label: fill(lang, dict.book.copiesLabel, {
            available: book.copiesAvailable,
            total: book.copiesTotal,
          }),
          share: book.copiesAvailable / book.copiesTotal,
        }}
      />

      <BookSponsor
        lang={lang}
        eyebrow={room.sponsorEyebrow}
        title={dict.sponsor.aboutTitle}
        lead={dict.sponsor.aboutLead}
      >
        <ExiumAd
          copy={dict.sponsor}
          className="tome__ad"
          bnClass={textClass(lang)}
        />
      </BookSponsor>

      <CourtesyBy
        label={dict.sponsor.courtesy}
        company={dict.sponsor.company}
        align="center"
        className="tome__courtesy"
        bnClass={textClass(lang)}
      />

      {related.length > 0 && (
        <section className="tome__related">
          <p className={cn("tome__band-eyebrow", textClass(lang))}>
            {room.readNext}
          </p>
          <h2 className={cn("tome__band-title", textClass(lang))}>
            {dict.book.alsoOpened}
          </h2>
          {/* The books as objects with their names under them, the same way
              the catalogue's grid shows them. The card component would work
              here too, and it is the wrong finish for this page: a row of
              filled pink tiles under a page that has spent five acts being
              quiet. */}
          <BookGrid3D
            books={related}
            lang={lang}
            className="tome__related-grid"
          />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </article>
  );
}
