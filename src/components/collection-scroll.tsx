"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { acquireSmoothScroll, releaseSmoothScroll, scrollToOffset } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * The collection, explored one chapter at a time.
 *
 * Vertical scrolling pans a horizontal row of six full-screen chapters, held
 * still under a sticky viewport: the page stops, the collection moves through
 * it, and each chapter arrives with its own photograph, its name and its books.
 *
 * **All of the motion is CSS.** One named view timeline is declared on the track
 * (`view-timeline-name: --collection` in globals.css) and every animation in the
 * section (the pan, each background's parallax, each title's masked lines, each
 * cover's entrance) is a `@keyframes` hung off that one timeline with its own
 * `animation-range`. So progress is scroll position rather than elapsed time:
 * scrub back up and the whole section runs backwards, exactly, for free. There
 * is no rAF loop and no scroll listener here, which is the rule the rest of the
 * app follows without exception.
 *
 * What each chapter's slice of that timeline is gets computed in this component
 * rather than in CSS, and handed down as `--from` / `--to` custom properties.
 * The arithmetic (chapter `i` is centred when the pan is `i / (n - 1)` through)
 * depends on how many chapters there are, which CSS cannot know; and doing it
 * here means `animation-range` receives plain percentages instead of a `calc()`
 * chain, which is both easier to read in devtools and less to get wrong.
 *
 * Two things do need JavaScript, and only two. The rail's current-chapter
 * marker comes from an `IntersectionObserver`, not a scroll handler, and it
 * works despite the panning because intersection is computed on the transformed
 * box. And clicking a rail dot has to convert "chapter 4" into a scroll offset,
 * which means measuring the track.
 *
 * It degrades in CSS, not in script. Below `md`, and under
 * `prefers-reduced-motion`, the enhanced rules simply do not apply: the track is
 * a plain vertical stack of six sections, the rail is hidden, and the inertial
 * scroller is never even downloaded. One markup path: the reference site does
 * the same, and a separate mobile component would be two things to keep in step.
 */

/**
 * Only the fields a cover actually draws with cross to the client, plus the
 * link, already built. Passing the server's `localePath` helper down instead
 * would read better and is not allowed: a function cannot cross the
 * server/client boundary, and React says so at runtime rather than at build
 * time. So the hrefs are data here, like every other localised string.
 */
export type ChapterBook = Pick<
  Book,
  | "id"
  | "title"
  | "titleBn"
  | "authorName"
  | "authorNameBn"
  | "coverHue"
  | "coverImage"
  | "pages"
> & { href: string };

export interface CollectionChapter {
  /** Category slug: the React key, and the join to `public/bg/<slug>.webp`. */
  slug: string;
  /** Localised link to this chapter's shelf. */
  href: string;
  /** Already in the reader's language; the server knows which one. */
  name: string;
  description: string;
  /** "01", "02" … in the reader's own numerals, formatted by the server. */
  number: string;
  /** "3 titles", already pluralised and localised. */
  count: string;
  /** Path under `public/`. Absent is survivable: the chapter keeps its ground. */
  background?: string;
  books: ChapterBook[];
}

export interface CollectionScrollCopy {
  eyebrow: string;
  title: string;
  lead: string;
  /** On the chapter's link through to its shelf. */
  viewShelf: string;
  /** Label above each chapter's number. */
  chapterLabel: string;
  /** Accessible name for the chapter rail. */
  railLabel: string;
}

interface CollectionScrollProps {
  chapters: CollectionChapter[];
  lang?: Locale;
  copy: CollectionScrollCopy;
  className?: string;
}

/**
 * Where each part of a chapter sits on the one timeline.
 *
 * The track translates from 0 to `-(n - 1) × 100vw`, so chapter `i` is squarely
 * in the viewport at `i / (n - 1)` of the pan. Its content is revealed over the
 * stretch *approaching* that, so the type has finished arriving by the time the
 * chapter is centred rather than starting then.
 *
 * The first chapter is a genuine special case, not a fudge. It is already on
 * screen at the instant the track pins, so a reveal placed anywhere inside the
 * pan would still be running while the chapter panned away: it would never be
 * seen composed. It is therefore given the `entry` phase instead, which for a
 * subject taller than the scrollport runs from the track appearing at the bottom
 * of the viewport to its top reaching the top: ending exactly where `contain`
 * begins. So chapter one assembles itself on the approach and is complete on the
 * frame the pin engages.
 *
 * Everything downstream is a fraction of the chapter's own slice rather than a
 * fixed percentage, which is what guarantees a staggered cascade always finishes
 * inside its slice however many words or covers there are. That arithmetic is
 * here rather than in `calc()` in the stylesheet for two reasons: it depends on
 * counts CSS cannot see, and `animation-range` built out of nested `calc()` and
 * custom properties is unreadable in devtools at exactly the moment you need to
 * read it.
 */
function chapterTiming(i: number, n: number) {
  const step = n > 1 ? 1 / (n - 1) : 1;
  const centre = i * step;
  const first = i === 0;
  const phase = first ? "entry" : "contain";
  const from = first ? 0.55 : centre - step * 0.62;
  const to = first ? 1 : centre - step * 0.06;
  const span = Math.max(0.01, to - from);

  /** An `animation-range` for a window given as fractions of the slice. */
  const at = (a: number, b: number): React.CSSProperties => {
    const pct = (v: number) => `${(Math.max(0, from + span * v) * 100).toFixed(3)}%`;
    return { animationRange: `${phase} ${pct(a)} ${phase} ${pct(b)}` };
  };

  return {
    /** The photograph drifts across the chapter's whole time on screen,
     *  passing through its resting offset as the chapter is centred, which is
     *  what makes it read as being behind the chapter rather than fixed to it.
     *  Applied to the `<img>`, which is where `next/image` puts `style`. */
    background: {
      animationRange:
        `contain ${(Math.max(0, centre - step) * 100).toFixed(3)}% ` +
        `contain ${(Math.min(1, centre + step) * 100).toFixed(3)}%`,
    } as React.CSSProperties,
    eyebrow: at(0, 0.5),
    /** Word `w` of `count`, cascading and landing well inside the slice. */
    word: (w: number, count: number) =>
      at(0.08 * w, Math.min(1, 0.08 * (count - 1) + 0.55)),
    lead: at(0.12, 0.62),
    count: at(0.2, 0.7),
    cta: at(0.24, 0.78),
    /** Cover `b`, arriving after the type it belongs to. */
    book: (b: number) => at(0.2 + 0.1 * b, 0.65 + 0.1 * b),
  };
}

export function CollectionScroll({
  chapters,
  lang = defaultLocale,
  copy,
  className,
}: CollectionScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  /** Whether the pinned horizontal presentation is the one in force. */
  const pinned = useRef(false);

  const total = chapters.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || total === 0) return;

    // The media queries in globals.css are the source of truth for which
    // presentation is running; these ask the same two questions from script so
    // that the scroller is not downloaded for a reader who will not see it.
    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    let released = false;
    let observer: IntersectionObserver | null = null;
    let holding = false;

    function apply() {
      pinned.current = wide.matches && !calm.matches;

      if (pinned.current && !holding) {
        holding = true;
        void acquireSmoothScroll();
      } else if (!pinned.current && holding) {
        holding = false;
        releaseSmoothScroll();
      }
    }

    apply();
    wide.addEventListener("change", apply);
    calm.addEventListener("change", apply);

    /* --- Which chapter is current -------------------------------------
       A chapter is 100vw wide, so at most one can be more than half in
       view; whichever that is, is the one the rail points at. Reported by
       the observer rather than measured on scroll, so nothing here runs
       on the main thread while the reader is scrolling. --------------- */
    observer = new IntersectionObserver(
      (entries) => {
        if (released) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isInteger(index)) setActive(index);
        }
      },
      { threshold: 0.55 },
    );
    for (const node of chapterRefs.current) if (node) observer.observe(node);

    return () => {
      released = true;
      observer?.disconnect();
      wide.removeEventListener("change", apply);
      calm.removeEventListener("change", apply);
      if (holding) releaseSmoothScroll();
    };
  }, [total]);

  /**
   * Jump the pan to a chapter.
   *
   * Pinned, the chapter's position is a fraction of the *track's* scrollable
   * length rather than a place in the document: chapter 4 of 6 is two thirds of
   * the way through the pin, and there is no element at that scroll offset to
   * scroll to. Stacked, there is: the chapter itself.
   */
  const goTo = useCallback(
    (index: number) => {
      const node = chapterRefs.current[index];
      const track = trackRef.current;
      const pin = pinRef.current;

      if (!pinned.current || !track || !pin) {
        if (node) scrollToOffset(node.getBoundingClientRect().top + window.scrollY);
        return;
      }

      const rect = track.getBoundingClientRect();
      const span = Math.max(1, rect.height - pin.clientHeight);
      const progress = total > 1 ? index / (total - 1) : 0;
      scrollToOffset(rect.top + window.scrollY + progress * span);
    },
    [total],
  );

  if (total === 0) return null;

  return (
    <section className={cn("collection", className)} aria-labelledby="collection-title">
      {/* The section's own introduction, in ordinary flow above the track. It
          is the page's heading for this material, so it is real type at a real
          heading level and not something the pinned panel owns. */}
      <div className="collection__intro">
        <p className={cn("collection__eyebrow", textClass(lang))}>{copy.eyebrow}</p>
        <h2
          id="collection-title"
          className={cn("collection__heading", textClass(lang))}
        >
          {copy.title}
        </h2>
        <p className={cn("collection__lead", textClass(lang))}>{copy.lead}</p>
      </div>

      {/* The track. Its height is what the pan is scrubbed against, and the
          view timeline every animation in here hangs off is declared on it. */}
      <div
        ref={trackRef}
        className="collection__track"
        style={{ "--chapters": total } as React.CSSProperties}
      >
        <div ref={pinRef} className="collection__pin">
          <div className="collection__row">
            {chapters.map((chapter, i) => {
              const timing = chapterTiming(i, total);
              const words = chapter.name.split(/\s+/);
              return (
              <article
                key={chapter.slug}
                ref={(node) => {
                  chapterRefs.current[i] = node;
                }}
                data-index={i}
                className="chapter"
              >
                {chapter.background ? (
                  <div className="chapter__bg" aria-hidden="true">
                    <Image
                      src={chapter.background}
                      style={timing.background}
                      alt=""
                      fill
                      sizes="100vw"
                      /* The first chapter is on screen the moment the section
                         pins, so it is worth having early; the other five are
                         a scroll away and must not compete for bandwidth with
                         the hero. */
                      priority={i === 0}
                      className="chapter__img"
                    />
                  </div>
                ) : null}
                {/* Type over a photograph needs a ground of its own, or its
                    contrast is whatever the photograph happens to be. */}
                <div className="chapter__veil" aria-hidden="true" />

                <div className="chapter__body">
                  <p
                    className={cn("chapter__eyebrow", textClass(lang))}
                    style={timing.eyebrow}
                  >
                    <span className="chapter__n">{chapter.number}</span>
                    {copy.chapterLabel}
                  </p>

                  {/* Masked-line reveal, one mask per word. The word is clipped
                      by its wrapper while the inner span slides up out of it,
                      which is why the wrapper carries a negative margin and an
                      equal positive padding: the two cancel out so the type sits
                      exactly where it would have, but the clip box is inflated
                      enough that a descender is not sheared off. */}
                  <h3 className={cn("chapter__title", textClass(lang))}>
                    {words.map((word, w) => (
                      <Fragment key={`${word}-${w}`}>
                        {/* The space between two words is a text node in the
                            heading, not padding on the mask: a mask with
                            padding would show the gap as a gap in the clip
                            box, and the words would slide over each other's
                            whitespace on the way up. */}
                        {w > 0 ? " " : null}
                        <span className="chapter__word">
                          <span style={timing.word(w, words.length)}>{word}</span>
                        </span>
                      </Fragment>
                    ))}
                  </h3>

                  <p
                    className={cn("chapter__lead", textClass(lang))}
                    style={timing.lead}
                  >
                    {chapter.description}
                  </p>

                  <p
                    className={cn("chapter__count", textClass(lang))}
                    style={timing.count}
                  >
                    {chapter.count}
                  </p>

                  <Link
                    href={chapter.href}
                    className="chapter__cta"
                    style={timing.cta}
                  >
                    <span className={textClass(lang)}>{copy.viewShelf}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>

                {/* The books themselves: the point of the chapter. Four at
                    most: this is an invitation to a shelf, and the shelf is
                    one click away. */}
                <ul className="chapter__books">
                  {chapter.books.slice(0, 4).map((book, b) => (
                    <li
                      key={book.id}
                      className="chapter__book"
                      style={timing.book(b)}
                    >
                      <Link
                        href={book.href}
                        className="chapter__book-link"
                      >
                        <Book3D
                          book={book}
                          lang={lang}
                          size="md"
                          angle={-24}
                          hoverAngle={-8}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
              );
            })}
          </div>

          {/* The rail. Hidden whenever the track is stacked rather than
              pinned: a fixed side nav over six ordinary sections is clutter
              pointing at things already in view. */}
          <nav className="collection__rail" aria-label={copy.railLabel}>
            <p className="collection__counter" aria-hidden="true">
              <span className="collection__counter-now">{chapters[active]?.number}</span>
              <span className="collection__counter-rule" />
              <span className="collection__counter-all">{chapters[total - 1]?.number}</span>
            </p>
            <ol className="collection__dots">
              {chapters.map((chapter, i) => (
                <li key={chapter.slug}>
                  <button
                    type="button"
                    className="collection__dot"
                    data-current={i === active}
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="sr-only">{chapter.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}
