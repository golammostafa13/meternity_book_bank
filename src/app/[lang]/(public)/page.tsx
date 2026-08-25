import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Download, Globe, Zap } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import {
  CollectionScroll,
  type CollectionChapter,
} from "@/components/collection-scroll";
import { HeroCinematic, type HeroPlate } from "@/components/hero-cinematic";
import { ArrivalsScroll, type Arrival } from "@/components/arrivals-scroll";
import { Button } from "@/components/ui/button";
import {
  getCategoryShelves,
  getFeatured,
  getRecent,
  getStats,
} from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { localeNames } from "@/lib/i18n/config";
import { artFor } from "@/lib/data/chapter-art";
import {
  bookAuthorName,
  bookDescription,
  bookTitle,
  categoryDescription,
  categoryName,
  formatCompactIn,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { fill, titlesCount } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export default async function HomePage(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const href = (path: string) => localePath(lang, path);

  const [featured, recent, categories, stats] = await Promise.all([
    getFeatured(6),
    getRecent(16),
    getCategoryShelves(4),
    getStats(),
  ]);

  /**
   * The newest arrivals, as records.
   *
   * Four, not sixteen. Each one gets a full screen of the pinned section with
   * its own volume standing in it, so this is a curated front page rather than
   * a list: the catalogue, sorted newest first, is one link away for the rest.
   * The number is the only thing that has to change to show five.
   *
   * Everything the component draws with is resolved here, in the reader's own
   * language and numerals, because the server is the only place that knows
   * which language that is. `cover` is the exception and stays structured:
   * `Book3D` draws the spine type and the fallback art itself, and needs the
   * fields rather than a string.
   */
  const shelfOf = new Map(
    categories.map((cat) => [cat.id, categoryName(cat, lang)] as const),
  );

  const arrivals: Arrival[] = recent.slice(0, 4).map((book, i) => {
    const format = book.format.toUpperCase();
    const megabytes = formatNumberIn(book.fileSizeMb, lang);
    const title = bookTitle(book, lang);

    return {
      id: book.id,
      number: formatNumberIn(i + 1, lang).padStart(2, formatNumberIn(0, lang)),
      code: book.code,
      title,
      author: bookAuthorName(book, lang),
      description: bookDescription(book, lang),
      category: shelfOf.get(book.categoryId) ?? book.categoryName,
      file: `${format} · ${megabytes} MB`,
      /* A figure, its unit, and what it counts: the shape the reference site
         sets a dose in, which suits a book without any translating. */
      spec: [
        { value: formatYearIn(book.year, lang), label: dict.book.published },
        { value: formatNumberIn(book.pages, lang), label: dict.book.pages },
        { value: megabytes, unit: "MB", label: format },
        {
          /* The endonym, never translated: an English page says বাংলা and a
             Bengali page says English, which is what a reader scanning for a
             language they can read is actually looking for. */
          value: localeNames[book.language].full,
          label: dict.book.language,
        },
      ],
      total: {
        label: dict.home.statDownloads,
        value: formatCompactIn(book.downloads, lang),
      },
      href: href(`/books/${book.slug}`),
      fileUrl: book.fileUrl,
      downloadLabel: fill(lang, dict.common.downloadOf, {
        title,
        format,
        mb: book.fileSizeMb,
      }),
      cover: {
        id: book.id,
        title: book.title,
        titleBn: book.titleBn,
        authorName: book.authorName,
        authorNameBn: book.authorNameBn,
        coverHue: book.coverHue,
        coverImage: book.coverImage,
        pages: book.pages,
      },
    };
  });

  /**
   * The hero footage: four plates, in the order they play.
   *
   * Hard-coded rather than derived from the categories, because this is a
   * sequence with an arc (carrying, the birth, the newborn, mother and child),
   * and a `map` over six categories would give six pictures in alphabetical
   * order. `scripts/build-hero-art.mjs` writes them, and names them with their
   * position so the order is visible on disk too.
   */
  const heroPlates: HeroPlate[] = [
    { src: "/hero/1-pregnancy-antenatal.webp" },
    { src: "/hero/2-labour-birth.webp" },
    { src: "/hero/3-newborn-care.webp" },
    { src: "/hero/4-postnatal-quality.webp" },
  ];

  /**
   * The six chapters of the pinned collection scroll.
   *
   * Assembled here rather than in the component for the reason every other
   * section on this page does it: the server is the only place that knows the
   * reader's language, so names, descriptions, counts and even the chapter
   * numbers arrive already in it (Bengali numerals included), and the client
   * never receives a string it will not display.
   *
   * `artFor` is the join to the treated photographs. A chapter with no
   * photograph is not an error; it keeps the page's own ground and its type is
   * if anything easier to read, so this asks rather than assumes.
   */
  const collectionChapters: CollectionChapter[] = categories.map((cat, i) => ({
    slug: cat.slug,
    href: href(`/categories/${cat.slug}`),
    name: categoryName(cat, lang),
    description: categoryDescription(cat, lang),
    number: formatNumberIn(i + 1, lang).padStart(2, lang === "bn" ? "০" : "0"),
    count: titlesCount(dict, lang, cat.bookCount),
    background: artFor(cat.slug) ? `/bg/${cat.slug}.webp` : undefined,
    books: cat.shelf.slice(0, 4).map((book) => ({
      id: book.id,
      href: href(`/books/${book.slug}`),
      title: book.title,
      titleBn: book.titleBn,
      authorName: book.authorName,
      authorNameBn: book.authorNameBn,
      coverHue: book.coverHue,
      coverImage: book.coverImage,
      pages: book.pages,
    })),
  }));

  const propIcons = [BookOpen, Download, Globe];

  /**
   * The volumes drifting behind the closing call to action.
   *
   * Hand-placed, never generated: this is a composition, and the two things
   * it has to get right (that no volume lands under the heading or the one
   * button, and that the four of them read as being at different distances
   * rather than as a row) are both judgements about *this* layout that no
   * loop can make. Percentages rather than pixels so the arrangement holds
   * from 1024px up.
   *
   * The far pair are wider, dimmer, and slightly out of focus; the near pair
   * are smaller, sharper, and tilted harder. That inversion is deliberate:
   * dimming alone reads as a faded book, not a distant one. Every duration is
   * a different prime-ish number of seconds so the four never fall into step,
   * which is the tell that turns a drift into a carousel.
   */
  const ctaFloaters = [
    { book: featured[0], x: "-2%", y: "12%", w: "184px", tilt: "-9deg", angle: -30, dur: "15s", delay: "0s", dim: "0.5", soft: "1.1px" },
    { book: featured[1], x: "9%", y: "58%", w: "126px", tilt: "7deg", angle: -16, dur: "11s", delay: "-3.5s", dim: "0.9", soft: "0px" },
    { book: featured[2], x: "80%", y: "8%", w: "170px", tilt: "11deg", angle: 26, dur: "17s", delay: "-7s", dim: "0.46", soft: "1.3px" },
    { book: featured[3], x: "87%", y: "62%", w: "122px", tilt: "-6deg", angle: 18, dur: "13s", delay: "-1.5s", dim: "0.9", soft: "0px" },
  ].filter((f) => f.book);

  return (
    <>
      {/* ---------------------------------------------------------------
          Hero: the cinema band

          Four plates cross-dissolving behind the name. No script and no
          video file; see hero-cinematic.tsx for why a `<video>` would be
          the heavier answer rather than the richer one. The band is dark
          in both themes, which is the one place on the site where that is
          true: the exception is written up in globals.css.
      ---------------------------------------------------------------- */}
      <HeroCinematic
        plates={heroPlates}
        lang={lang}
        copy={{
          ...dict.home.cinema,
          /* Three facts, set small at the foot of the frame. Numbers are
             formatted here so they arrive in the reader's own numerals
             (৮১ হাজার, not 81k), and the labels come from the dictionary. */
          meta: [
            titlesCount(dict, lang, stats.totalBooks),
            `${formatCompactIn(stats.totalAuthors, lang)} ${dict.home.statAuthors}`,
            `${formatCompactIn(stats.totalDownloads, lang)} ${dict.home.statDownloads}`,
          ],
        }}
        hrefs={{ books: href("/books"), categories: href("/categories") }}
      />

      {/* ---------------------------------------------------------------
          The collection, chapter by chapter

          The page stops here and the collection moves through it: six
          full-screen chapters panned sideways under a sticky viewport,
          each with its own photograph, its name and its books. This
          replaces both the featured coverflow and the flat category grid
          that used to stand below the hero: they said the same thing
          twice, at two different qualities.

          The catalogue at /books keeps its plain filterable grid. A
          narrative scroll is for arriving; a grid is for looking
          something up, and conflating them makes the catalogue slow.
      ---------------------------------------------------------------- */}
      <CollectionScroll
        chapters={collectionChapters}
        lang={lang}
        copy={dict.home.collection}
      />


      {/* ---------------------------------------------------------------
          Recently added: the arrivals, one at a time

          The section pins and the newest four step through it, each with
          the volume itself turning beside its record. The list that used
          to stand here said the same four titles in one screen and gave
          none of them any presence, which is the one thing a front page
          owes a new arrival. Zero JavaScript: see arrivals-scroll.tsx.
      ---------------------------------------------------------------- */}
      <ArrivalsScroll
        arrivals={arrivals}
        lang={lang}
        copy={{
          eyebrow: dict.home.recentTitle,
          lead: dict.home.recentLead,
          seeEverything: dict.common.seeEverything,
          ...dict.home.arrivals,
        }}
        href={href("/books?sort=recent")}
      />

      {/* ---------------------------------------------------------------
          Value props
      ---------------------------------------------------------------- */}
      <section className="border-y border-line/60 bg-surface/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 lg:px-8">
          {dict.home.props.map((prop, i) => {
            const Icon = propIcons[i];
            return (
              <div
                key={prop.title}
                className="reveal-3d flex gap-4"
                style={{ "--lag": i * 5 } as React.CSSProperties}
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className={cn("font-semibold text-ink", textClass(lang))}>
                    {prop.title}
                  </h2>
                  <p
                    className={cn(
                      "mt-1.5 text-[0.95rem] leading-relaxed text-ink-mute",
                      textClass(lang),
                    )}
                  >
                    {prop.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Closing CTA

          The recently-added shelf used to stand here. It is now the last
          beat of the hero: the scene assembles those exact books, and the
          list the scroll resolves to is them, clickable.
      ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:pb-8">
        <div className="ctafloat reveal-3d rounded-3xl px-8 py-16 text-center shadow-e3 lg:px-16 lg:py-28">
          {/* The drifting volumes. Hidden below `lg`, where the copy already
              fills the panel edge to edge and a book behind it would be
              reading material laid over reading material. */}
          <div aria-hidden="true" className="hidden lg:block">
            {ctaFloaters.map((f) => (
              <div
                key={f.book.id}
                className="ctafloat__drift"
                style={
                  {
                    "--x": f.x,
                    "--y": f.y,
                    "--w": f.w,
                    "--tilt": f.tilt,
                    "--dur": f.dur,
                    "--delay": f.delay,
                    "--dim": f.dim,
                    "--soft": f.soft,
                  } as React.CSSProperties
                }
              >
                <Book3D
                  book={f.book}
                  lang={lang}
                  size="sm"
                  angle={f.angle}
                  hoverAngle={f.angle}
                />
              </div>
            ))}
          </div>

          <div className="ctafloat__body">
            <Zap className="mx-auto size-8 text-accent" aria-hidden="true" />
            <h2
              className={cn(
                "mx-auto mt-6 max-w-2xl text-[clamp(1.8rem,4vw,3rem)] font-bold leading-tight tracking-tight text-ink",
                lang === "bn" && "bn leading-[1.35]",
              )}
            >
              {dict.home.ctaTitle}
            </h2>
            <p
              className={cn(
                "mx-auto mt-4 max-w-lg text-lg text-ink-mute",
                textClass(lang),
              )}
            >
              {dict.home.ctaLead}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href={href("/books")}>
                  {dict.home.ctaButton}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
