import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Download, Star } from "lucide-react";
import { ViewTransition } from "react";
import { AmbientVideo } from "@/components/ambient-video";
import { Book3D } from "@/components/book-3d";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * The book detail page, as five acts.
 *
 * This is the most visited page in the library: everything else on the site is
 * a way of arriving here. What was here before was a record card, which is the
 * right shape for a catalogue entry and the wrong shape for the page a reader
 * lands on from a printed leaflet. So it is staged.
 *
 *   I.   **The plate.** One screen: the volume standing in a lit room with a
 *        photograph of its subject behind it, the title, and the two things
 *        anyone came here to do.
 *   II.  **The plates and the paragraph.** The reference site's own layout,
 *        which is three tall panels in a row with an editorial column beside
 *        them. Ours are the cover, the subject and the imprint, and the column
 *        is what the book is about.
 *   III. **The statement.** A short italic line over a much larger tracked
 *        one, bleeding off the left margin. The reference sets a marketing
 *        phrase this way; we set the only claim this library makes.
 *   IV.  **The record.** The catalogue data, as a measured table.
 *   V.   **The sponsor.** Given a band of its own rather than squeezed beside
 *        the metadata, because a squeezed advert is a worse advert *and* a
 *        worse page: the reader who came for the chapter on haemorrhage scrolls
 *        past it, and the reader who is curious about the box gets it properly.
 *
 * ## What runs, and on what
 *
 * Almost nothing. Every reveal in here is a CSS scroll-driven animation on a
 * `view()` timeline, so progress is scroll position rather than elapsed time,
 * it scrubs backwards, and it is off the main thread. There is no scroll
 * listener on this page and no layout measured in script. The two exceptions
 * are both client components that were already here: the sponsor's canvas, and
 * `AmbientVideo`, which is an `IntersectionObserver` and a media query.
 *
 * ## The dark act, and the rule it is inside
 *
 * The plate is dark in both themes. That is the same exception the home hero
 * and the catalogue's room already declare: the palette is redefined once
 * against the same token names (`.cinema, .cine, .tome__plate` in globals.css),
 * so every rule inside still reads `var(--ink)` and nothing here knows it is in
 * the dark. Three bands share one exception rather than each inventing one.
 */

type CoverLike = Pick<
  Book,
  | "id"
  | "title"
  | "titleBn"
  | "authorName"
  | "authorNameBn"
  | "coverHue"
  | "coverImage"
  | "pages"
>;

/* ==================================================================
   Act I: the plate
   ================================================================== */

export interface BookPlateFigure {
  key: string;
  text: string;
  /** Which glyph sits beside it. */
  glyph?: "rating" | "downloads";
}

export interface BookPlateProps {
  lang?: Locale;
  /** Breadcrumb trail. The last entry is the current page and has no href. */
  crumbs: { label: string; href?: string }[];
  crumbLabel: string;
  /** Accession code and shelf, set small above the title. */
  eyebrow: string;
  title: string;
  subtitle?: string;
  byLabel: string;
  author: { name: string; href: string };
  figures: BookPlateFigure[];
  read: { href: string; label: string };
  take: { href: string; label: string };
  /** The file-size line under the two buttons. */
  fileNote: string;
  scrollHint: string;
  /** Where the cue scrolls to. */
  cueHref: string;
  /** The subject photograph behind everything. */
  backdrop?: { src: string; alt: string };
  /** The film over it, or nothing. */
  film?: string;
  cover: CoverLike;
}

export function BookPlate({
  lang = defaultLocale,
  crumbs,
  crumbLabel,
  eyebrow,
  title,
  subtitle,
  byLabel,
  author,
  figures,
  read,
  take,
  fileNote,
  scrollHint,
  cueHref,
  backdrop,
  film,
  cover,
}: BookPlateProps) {
  return (
    <section className="tome__plate">
      {/* The room. Three layers and none of them is content: the photograph,
          the film over it, and the two scrims that make type legible on
          whatever the photograph happens to be doing. */}
      <div className="tome__room" aria-hidden="true">
        {backdrop && (
          <Image
            src={backdrop.src}
            alt=""
            fill
            sizes="100vw"
            priority
            className="tome__still"
          />
        )}
        {film && <AmbientVideo src={film} className="tome__film" />}
        <span className="tome__veil" />
        <span className="tome__grain" />
      </div>

      <div className="tome__inner">
        <nav aria-label={crumbLabel} className={cn("tome__crumbs", textClass(lang))}>
          <ol>
            {crumbs.map((crumb, i) => (
              <li key={crumb.label}>
                {i > 0 && (
                  <span className="tome__crumb-sep" aria-hidden="true">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="tome__stage">
          <div className="tome__record">
            <p className={cn("tome__eyebrow", textClass(lang))}>{eyebrow}</p>

            <h1 className={cn("tome__title", textClass(lang))}>{title}</h1>

            {subtitle && (
              <p className={cn("tome__sub", textClass(lang))}>{subtitle}</p>
            )}

            <p className={cn("tome__by", textClass(lang))}>
              <span className="tome__by-rule" aria-hidden="true" />
              {byLabel}{" "}
              <Link href={author.href} className="tome__author">
                {author.name}
              </Link>
            </p>

            <ul className={cn("tome__figures", textClass(lang))}>
              {figures.map((figure) => (
                <li key={figure.key}>
                  {figure.glyph === "rating" && (
                    <Star className="tome__glyph" aria-hidden="true" />
                  )}
                  {figure.glyph === "downloads" && (
                    <Download className="tome__glyph" aria-hidden="true" />
                  )}
                  {figure.text}
                </li>
              ))}
            </ul>

            <div className="tome__actions">
              <Link href={read.href} className={cn("tome__go", textClass(lang))}>
                <BookOpen className="size-4" aria-hidden="true" />
                {read.label}
              </Link>
              {/* A real download, so a plain anchor: `Link` is for routes, and
                  this one has to carry the `download` attribute through. */}
              <a
                href={take.href}
                download
                className={cn("tome__take", textClass(lang))}
              >
                <Download className="size-4" aria-hidden="true" />
                {take.label}
              </a>
            </div>

            <p className={cn("tome__file", textClass(lang))}>{fileNote}</p>
          </div>

          <div className="tome__vol">
            <span className="tome__bloom" aria-hidden="true" />
            {/* Paired with the grid tile's cover, so the same object grows
                into place instead of the page cutting. */}
            <ViewTransition name={`cover-${cover.id}`} share="morph" default="none">
              <Book3D book={cover} lang={lang} size="lg" showcase />
            </ViewTransition>
          </div>
        </div>

        <a href={cueHref} className={cn("tome__cue", textClass(lang))}>
          <span className="tome__cue-rule" aria-hidden="true" />
          {scrollHint}
        </a>
      </div>
    </section>
  );
}

/* ==================================================================
   Act II: three plates and a paragraph
   ================================================================== */

export interface BookPanel {
  key: string;
  /** The small caption under the panel. */
  caption: string;
  image?: { src: string; alt: string };
  /** Licence credit for a photograph that is somebody else's. */
  credit?: string;
  /** The imprint panel is a list rather than a picture. */
  rows?: { label: string; value: string; href?: string; hrefLabel?: string }[];
}

export function BookPanels({
  lang = defaultLocale,
  panels,
  note,
}: {
  lang?: Locale;
  panels: BookPanel[];
  note: { eyebrow: string; text: string; cta: { href: string; label: string } };
}) {
  return (
    <section className="tome__panels" id="about">
      <div className="tome__panel-row">
        {panels.map((panel, i) => (
          <figure
            key={panel.key}
            className="tome__panel"
            /* Each panel a beat behind the one to its left. The reveal is a
               scroll timeline, so the lag is a range offset rather than a
               delay, and it scrubs. */
            style={{ "--lag": i } as React.CSSProperties}
          >
            <div className="tome__panel-frame">
              {panel.image ? (
                <Image
                  src={panel.image.src}
                  alt={panel.image.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, 90vw"
                  className="tome__panel-img"
                />
              ) : (
                <dl className={cn("tome__imprint", textClass(lang))}>
                  {panel.rows?.map((row) => (
                    <div key={row.label} className="tome__imprint-row">
                      <dt>{row.label}</dt>
                      <dd>
                        {row.href ? (
                          <a
                            href={row.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="tome__imprint-link"
                          >
                            {row.hrefLabel ?? row.value}
                            <ArrowUpRight className="size-3" aria-hidden="true" />
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <figcaption className={cn("tome__panel-cap", textClass(lang))}>
              {panel.caption}
              {panel.credit && (
                <span className="tome__panel-credit">{panel.credit}</span>
              )}
            </figcaption>
          </figure>
        ))}

        {/* The reference's fourth column: a single paragraph in small type,
            ranged left against the right edge of the last plate. It is the
            only running text in this act, which is why it can be this small
            and still be read. */}
        <div className="tome__note">
          <p className={cn("tome__note-eyebrow", textClass(lang))}>
            {note.eyebrow}
          </p>
          <p className={cn("tome__note-text", textClass(lang))}>{note.text}</p>
          <Link href={note.cta.href} className={cn("tome__note-cta", textClass(lang))}>
            {note.cta.label}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   Act III: the statement
   ================================================================== */

/**
 * The reference's display pairing: a short italic line, then the same sentence
 * finished at four times the size in tracked capitals, hanging off the left
 * margin.
 *
 * The two lines are one sentence and they are two elements only because they
 * are set differently, so the whole thing is one `<p>` with the halves marked
 * up inside it. A screen reader reads "Every page, free to read", which is the
 * sentence; two paragraphs would read as two fragments.
 *
 * Bengali gets the same composition without the capitals, because the script
 * has none: `text-transform` is a no-op there and the tracking is already off.
 */
export function BookStatement({
  lang = defaultLocale,
  lead,
  word,
}: {
  lang?: Locale;
  lead: string;
  word: string;
}) {
  return (
    <section className="tome__statement" aria-hidden={false}>
      <p className={cn("tome__statement-line", textClass(lang))}>
        <span className="tome__mask tome__mask--lead">
          <span className="tome__script">{lead}</span>
        </span>
        <span className="tome__mask tome__mask--word">
          <span className="tome__caps">{word}</span>
        </span>
      </p>
    </section>
  );
}

/* ==================================================================
   Act IV: the record
   ================================================================== */

export interface BookSpecRow {
  label: string;
  value: string;
  /** Small tracked suffix: the scale the figure is read against. */
  unit?: string;
  /** 0 to 1. Draws the rule under the row as a measure rather than a divider. */
  share?: number;
}

export function BookRecord({
  lang = defaultLocale,
  eyebrow,
  title,
  rows,
  copies,
}: {
  lang?: Locale;
  eyebrow: string;
  title: string;
  rows: BookSpecRow[];
  copies?: { title: string; line: string; label: string; share: number };
}) {
  return (
    <section className="tome__record-band" id="record">
      <div className="tome__record-head">
        <p className={cn("tome__band-eyebrow", textClass(lang))}>{eyebrow}</p>
        <h2 className={cn("tome__band-title", textClass(lang))}>{title}</h2>
      </div>

      <dl className={cn("tome__spec", textClass(lang))}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="tome__spec-row"
            style={
              row.share === undefined
                ? undefined
                : ({
                    "--share": `${Math.round(
                      Math.min(1, Math.max(0, row.share)) * 100,
                    )}%`,
                  } as React.CSSProperties)
            }
            data-measured={row.share === undefined ? undefined : true}
          >
            <dt className="tome__spec-label">{row.label}</dt>
            <dd className="tome__spec-value">
              <span className="tome__spec-figure tabular-nums">{row.value}</span>
              {row.unit && <span className="tome__spec-unit">{row.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {copies && (
        <div className="tome__copies">
          <p className={cn("tome__copies-title", textClass(lang))}>
            {copies.title}
          </p>
          <p className={cn("tome__copies-line", textClass(lang))}>{copies.line}</p>
          <div
            className="tome__copies-bar"
            role="img"
            aria-label={copies.label}
            style={
              {
                "--share": `${Math.round(
                  Math.min(1, Math.max(0, copies.share)) * 100,
                )}%`,
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </section>
  );
}

/* ==================================================================
   Act V: the sponsor
   ================================================================== */

export function BookSponsor({
  lang = defaultLocale,
  eyebrow,
  title,
  lead,
  children,
}: {
  lang?: Locale;
  eyebrow: string;
  title: string;
  lead: string;
  /** The advert itself, passed in so this stays a server component. */
  children: React.ReactNode;
}) {
  return (
    <section className="tome__sponsor" aria-labelledby="sponsor-title">
      <div className="tome__sponsor-copy">
        <p className={cn("tome__band-eyebrow", textClass(lang))}>{eyebrow}</p>
        <h2
          id="sponsor-title"
          className={cn("tome__band-title", textClass(lang))}
        >
          {title}
        </h2>
        <p className={cn("tome__sponsor-lead", textClass(lang))}>{lead}</p>
      </div>
      <div className="tome__sponsor-slot">{children}</div>
    </section>
  );
}
