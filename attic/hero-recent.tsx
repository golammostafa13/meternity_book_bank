"use client";

import Link from "next/link";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import { coverTheme } from "@/lib/cover-theme";
import { localePath, type Locale } from "@/lib/i18n/config";
import {
  bookAuthorName,
  bookTitle,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";
import { useRouter } from "next/navigation";

/**
 * The newest arrivals, as a list.
 *
 * This is the last beat of the hero: the scene has finished assembling its
 * shelf, and this is that shelf written out, the same books, in the same
 * order, with the two things a reader actually wants from them.
 *
 * A list rather than a grid of cards. The catalogue already has the grid, and
 * a grid over a WebGL scene would hide the scene it is meant to be reading
 * out. Rows are quicker to scan for "what is new", which is the only question
 * this block answers.
 *
 * Two controls per row, no more: the title opens the record, the disc beside
 * it takes the file. The row navigates as a whole via onClick+router.push;
 * only the download button stops propagation to act independently.
 */

/**
 * What the list draws with. Trimmed from `Book` because this crosses to the
 * client: a description and a shelf code cost payload on every row and are
 * never rendered here.
 */
export type HeroListBook = Pick<
  Book,
  | "id"
  | "slug"
  | "title"
  | "titleBn"
  | "authorName"
  | "authorNameBn"
  | "coverHue"
  | "year"
  | "format"
  | "fileSizeMb"
  | "fileUrl"
>;

export interface HeroRecentCopy {
  /** Section heading: "Recently added". */
  title: string;
  lead: string;
  /** Link to the catalogue, sorted newest first. */
  seeEverything: string;
  /** Row link to the book's record. */
  details: string;
  /** "Download {title} ({format}, {mb} MB)": the download control's label. */
  downloadOf: string;
}

export function HeroRecent({
  books,
  lang,
  copy,
  href,
  className,
}: {
  books: HeroListBook[];
  lang: Locale;
  copy: HeroRecentCopy;
  /** Catalogue URL for the heading's "see everything" link. */
  href: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={cn("hero-recent", className)}>
      <div className="hero-recent__head">
        <div>
          <h2
            className={cn(
              "text-[clamp(1.5rem,3.2vw,2.3rem)] font-bold tracking-tight text-ink",
              lang === "bn" && "bn leading-[1.35] tracking-normal",
            )}
          >
            {copy.title}
          </h2>
          <p
            className={cn(
              "mt-1.5 max-w-md text-[0.95rem] leading-relaxed text-ink-mute",
              textClass(lang),
            )}
          >
            {copy.lead}
          </p>
        </div>
        <Link
          href={href}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface/70 px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent",
            textClass(lang),
          )}
        >
          {copy.seeEverything}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="hero-recent__list">
        {books.map((book, i) => {
          const theme = coverTheme(book);
          const title = bookTitle(book, lang);
          const format = book.format.toUpperCase();
          const detailHref = localePath(lang, `/books/${book.slug}`);

          return (
            <li
              key={book.id}
              className="hero-recent__row cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={title}
              onClick={() => router.push(detailHref)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(detailHref);
                }
              }}
            >
              {/* The arrival's place in the queue: 01 is the newest. Padded
                  with the reader's own zero, so a Bengali list does not count
                  "0১". Tabular, so the column stays a column down the list. */}
              <span
                className="hero-recent__n tabular-nums"
                aria-hidden="true"
              >
                {formatNumberIn(i + 1, lang).padStart(2, formatNumberIn(0, lang))}
              </span>

              {/* A spine, not an icon: the same object the scene above just
                  finished shelving, in the same colours. */}
              <span
                className="hero-recent__spine"
                aria-hidden="true"
                style={{
                  background: `linear-gradient(to right, color-mix(in srgb, ${theme.spine} 60%, #000), color-mix(in srgb, ${theme.spine} 86%, #fff) 48%, ${theme.spine})`,
                }}
              />

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[0.95rem] font-semibold text-ink hero-recent__title",
                    textClass(lang),
                  )}
                >
                  {title}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.75rem] text-ink-faint",
                    textClass(lang),
                  )}
                >
                  <span className="truncate text-ink-mute">
                    {bookAuthorName(book, lang)}
                  </span>
                  <Dot />
                  <span className="whitespace-nowrap">
                    {formatYearIn(book.year, lang)}
                  </span>
                  <Dot />
                  <span className="whitespace-nowrap">
                    {format} · {formatNumberIn(book.fileSizeMb, lang)} MB
                  </span>
                </span>
              </span>

              <span className="hero-recent__actions">
                {/* Details badge: reveals on row hover */}
                <span
                  className={cn("hero-recent__details", textClass(lang))}
                  aria-hidden="true"
                >
                  {copy.details}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </span>

                {/* Download stops the row's onClick so it acts independently */}
                <a
                  href={book.fileUrl}
                  download
                  onClick={(e) => e.stopPropagation()}
                  aria-label={fill(lang, copy.downloadOf, {
                    title,
                    format,
                    mb: book.fileSizeMb,
                  })}
                  className="hero-recent__download"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                </a>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
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
