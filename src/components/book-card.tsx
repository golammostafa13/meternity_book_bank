import { ViewTransition } from "react";
import Link from "next/link";
import { BookOpen, Download, Star } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import type { Dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import {
  bookAuthorName,
  bookTitle,
  formatCompactIn,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/format";
import type { Book } from "@/types";

/**
 * Catalogue grid tile.
 *
 * Read top to bottom, the way the reference card does: what the thing is
 * first, then the object itself, then the one thing to do with it.
 *
 *   · the record (title, author, the three figures worth showing) sits at the
 *     top on pale stock, where type belongs;
 *   · the volume stands below it and runs off the bottom of the card, so the
 *     card frames a real object rather than containing a picture of one;
 *   · the foot is a block of saturated colour carrying a single full-width
 *     control. One button, unmissable, and the same one on every card.
 *
 * Downloading keeps its own small control in the head rather than a second
 * button competing with Read: it is the minority action, and it is still a
 * first-class one, no visitor has to open the detail page to get the file.
 *
 * Not one big link, for that reason: the tile is an <article> with several
 * links in it, since nesting them inside one anchor would be invalid and
 * unusable by keyboard.
 *
 * The cover is wrapped in a named `ViewTransition`, paired with the one on the
 * detail page, so opening a book morphs this exact object into the big one
 * instead of cutting between two pages.
 *
 * Three elements, each load-bearing: the outer <article> owns the scroll reveal
 * (a filled scroll animation owns `transform` for good, so it cannot also be
 * the element that lifts on hover), the inner div is the card surface and the
 * hover group, and the well clips the volume at the card's edge.
 */
export function BookCard({
  book,
  lang,
  dict,
  className,
  index = 0,
  showActions = true,
}: {
  book: Book;
  lang: Locale;
  dict: Dictionary;
  className?: string;
  index?: number;
  /** Off on dense rails where a second row of controls would crowd the grid. */
  showActions?: boolean;
}) {
  const title = bookTitle(book, lang);
  const detail = localePath(lang, `/books/${book.slug}`);

  return (
    <article
      className={cn("reveal-3d h-full", className)}
      style={
        {
          // Cards cascade across a row instead of arriving as a block. Capped
          // at eight so the tail of a long grid never lags off the screen.
          "--lag": Math.min(index, 8) * 3,
          "--span": "58%",
        } as React.CSSProperties
      }
    >
      <div className="book-card group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-line/60">
        {book.featured && <span className="book-card__rail" aria-hidden="true" />}

        {/* --- The record ---------------------------------------------- */}
        <div className="relative z-20 flex items-start gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0 flex-1">
            {book.featured && (
              <span
                className={cn(
                  "mb-1.5 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-accent",
                  textClass(lang),
                )}
              >
                <Star className="size-2.5 fill-current" aria-hidden="true" />
                {dict.book.featured}
              </span>
            )}

            <h3
              className={cn(
                "line-clamp-2 text-[1.05rem] font-semibold leading-tight tracking-[-0.015em] text-ink",
                textClass(lang),
              )}
            >
              <Link
                href={detail}
                className="transition-colors group-hover:text-accent"
              >
                {title}
              </Link>
            </h3>
            {/* Two lines, not one: at grid width a single clamped line cuts
                names like Bibhutibhushan Bandyopadhyay mid-word, and the well
                below is pinned with mt-auto so the extra line costs nothing in
                alignment. */}
            <p
              className={cn(
                "mt-1 line-clamp-2 text-[0.8rem] text-ink-mute",
                textClass(lang),
              )}
            >
              {bookAuthorName(book, lang)}
            </p>

            {/* Wrapping is per item, never inside one: Bengali compact counts
                are two words ("৪.৮ হাজার") and would otherwise break across
                lines in the middle of a figure. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-ink-faint">
              <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-ink-mute">
                <Star
                  className="size-3 fill-accent text-accent"
                  aria-hidden="true"
                />
                {formatNumberIn(book.rating, lang)}
              </span>
              <Dot />
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Download className="size-3" aria-hidden="true" />
                {formatCompactIn(book.downloads, lang)}
              </span>
              <Dot />
              <span className="whitespace-nowrap">
                {formatYearIn(book.year, lang)}
              </span>
            </div>
          </div>

          {showActions && (
            <a
              href={book.fileUrl}
              download
              aria-label={fill(lang, dict.common.downloadOf, {
                title,
                format: book.format.toUpperCase(),
                mb: book.fileSizeMb,
              })}
              title={fill(lang, dict.common.downloadFormat, {
                format: book.format.toUpperCase(),
              })}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line/70 bg-surface/80 text-ink-mute shadow-e1 transition-all hover:border-accent hover:bg-accent hover:text-accent-ink hover:shadow-e2"
            >
              <Download className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* --- The volume ---------------------------------------------- */}
        {/* The whole volume is drawn and the control is then pulled up over its
            tail (see the negative margin below), so the object runs behind the
            button rather than being sliced by a crop line. mt-auto pins the
            well to the bottom, so a two-line title on one card never shortens
            the cover next to a one-line title in the same row. */}
        {/* The well is inset well past the type's own margin: the volume is an
            object sitting in the card, and it needs air on both sides to read
            as one. Edge-to-edge it competes with the card itself. */}
        <div className="book-card__well relative mt-auto px-9 pt-2 sm:px-11 sm:pt-3">
          <Link
            href={detail}
            tabIndex={-1}
            aria-hidden="true"
            className="relative block"
          >
            <ViewTransition name={`cover-${book.id}`} share="morph" default="none">
              <Book3D book={book} lang={lang} size="md" className="w-full" />
            </ViewTransition>
          </Link>
        </div>

        {/* --- The control ---------------------------------------------
            The negative margin is just enough overlap to take the volume's
            tail and its contact shadow, and no more: any deeper and the book
            looks docked to the button instead of standing behind it. */}
        {showActions && (
          <div className="relative z-20 -mt-5 px-4 pb-4 sm:px-5 sm:pb-5">
            <Link
              href={localePath(lang, `/read/${book.slug}`)}
              className={cn(
                // White on the coloured foot: the highest contrast available
                // in this palette, which is what a single primary control on a
                // card of this size should be.
                "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-2 text-[0.85rem] font-semibold text-ink shadow-e2 transition-all hover:-translate-y-px hover:shadow-e3",
                textClass(lang),
              )}
            >
              <BookOpen className="size-4" aria-hidden="true" />
              {dict.common.read}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

/** Separator between meta items. A glyph would be read out by screen readers. */
function Dot() {
  return (
    <span
      className="size-0.75 shrink-0 rounded-full bg-current opacity-40"
      aria-hidden="true"
    />
  );
}
