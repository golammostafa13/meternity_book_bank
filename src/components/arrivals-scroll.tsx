import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * The newest arrivals, one record at a time.
 *
 * The section pins and the arrivals step through it: the record on the left,
 * the volume itself turning on the right, a number counting up in the corner.
 * Where the collection scroll above pans sideways through six shelves, this
 * holds one place and changes what is standing in it, which is the difference
 * between browsing a collection and being handed a book.
 *
 * **There is no JavaScript in this file at all**, and that is the whole design
 * rather than a boast. Everything moves on one named view timeline declared on
 * the track (`view-timeline-name: --arrivals` in globals.css); every part takes
 * the slice of it that it wants through `animation-range`, computed below in
 * `arrivalTiming` because it depends on how many arrivals there are and CSS
 * cannot count them. Three things that usually force a client component are
 * done without one:
 *
 *   - **Which arrival is current.** The corner tally and the rail are `n`
 *     stacked spans, one per arrival, each shown only across its own slice of
 *     the timeline by an animation with `animation-fill-mode: none`. Outside its
 *     range the effect simply does not apply, which is a discrete on and off
 *     without a script observing anything.
 *   - **Clicking the rail.** Each rail item is an ordinary `<a href="#…">`
 *     pointing at a zero-height marker positioned partway down the track, so
 *     the browser's own scrolling puts the timeline exactly where that arrival
 *     is composed. Lenis, held by the collection scroll above, makes it glide.
 *   - **Keeping the invisible records out of the way.** The stack is `n`
 *     absolutely positioned records in one cell, so the ones at zero opacity
 *     would otherwise sit over the visible one and swallow its clicks. The same
 *     keyframes that fade a record also raise its `z-index` and turn its
 *     `pointer-events` back on, so only the current record is hit-testable.
 *
 * A record at zero opacity is still in the accessibility tree, deliberately:
 * this is the only place these six titles appear, and a screen reader should be
 * able to read all of them rather than only the one the scroll happens to be
 * showing. `visibility: hidden` would have been the tidier way to solve the
 * click problem and would have hidden five records from anyone not scrolling.
 * Tabbing into one brings it to the front (see `:focus-within` in globals.css),
 * so a keyboard reader is never working inside something they cannot see.
 *
 * It degrades in CSS, not in script. Below `md`, and under
 * `prefers-reduced-motion`, none of the enhanced rules apply: the track is a
 * plain stack of records in document order, the rail and the tally are hidden,
 * and an inline `animation-range` with no `animation-name` to attach to is
 * inert. One markup path, and the fallback is the default.
 */

/** What the volume is drawn from. The rest of the record arrives as strings. */
export type ArrivalCover = Pick<
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

/** One row of the spec table: a figure, its unit, and what it counts. */
export interface ArrivalSpec {
  value: string;
  unit?: string;
  label: string;
}

export interface Arrival {
  id: string;
  /** "01", "০১": the reader's own numerals, formatted by the server. */
  number: string;
  /** The accession code, printed as the record's own mark. */
  code: string;
  /** Already in the reader's language, like every other string here. */
  title: string;
  author: string;
  description: string;
  /** Shelf this arrival belongs to, set small beside the volume. */
  category: string;
  /** "PDF · 7.3 MB", under the volume. */
  file: string;
  spec: ArrivalSpec[];
  /** The rule-off row at the foot of the spec: one label, one figure. */
  total: { label: string; value: string };
  href: string;
  fileUrl: string;
  /** Accessible name for the download control, already interpolated. */
  downloadLabel: string;
  cover: ArrivalCover;
}

export interface ArrivalsScrollCopy {
  eyebrow: string;
  title: string;
  lead: string;
  /** On the link through to the record. */
  openRecord: string;
  /** On the download control. */
  takeFile: string;
  /** Link to the whole catalogue, beside the tally. */
  seeEverything: string;
  /** Accessible name for the rail of arrival numbers. */
  railLabel: string;
}

interface ArrivalsScrollProps {
  arrivals: Arrival[];
  lang?: Locale;
  copy: ArrivalsScrollCopy;
  /** Catalogue URL, newest first. */
  href: string;
  className?: string;
}

/**
 * Where one arrival sits on the one timeline.
 *
 * The pin lasts for `contain 0%` to `contain 100%`, which for a track taller
 * than the scrollport is exactly the sticky period rather than an approximation
 * of it (the argument is written out in globals.css). Arrival `i` of `n` owns
 * the `i/n` to `(i+1)/n` slice of that, and everything it does happens inside
 * its own slice: the record fades up and away, the volume turns through its
 * whole quarter-turn, the ghost numeral drifts.
 *
 * The first and last arrivals are genuine special cases rather than fudges, and
 * they are handled by giving them different keyframes (`data-pos` in the markup,
 * matched in the stylesheet) rather than by moving their ranges around:
 *
 *   - The **first** does not fade in. Its slice begins the instant the pin
 *     engages, so a fade-in there would run while the section was already
 *     stationary and full screen, and before that (all the way up the approach)
 *     the fill would hold it at zero and the stage would be visibly empty.
 *     Holding it at full opacity means it is simply there, the way the top of a
 *     page is there.
 *   - The **last** does not fade out, for the same reason read backwards: its
 *     slice ends where the pin releases, and fading out into that would leave
 *     an empty screen for the last of the scroll. The track's extra tail then
 *     holds the last record composed as the section leaves.
 */
function arrivalTiming(i: number, n: number) {
  const step = 1 / Math.max(1, n);
  /**
   * How far each arrival's window reaches past its own slice, as a fraction of
   * the slice, so that one record is fading up over exactly the stretch the one
   * before it is fading down. Without it the two happen back to back and the
   * stage passes through empty between every pair, which reads as a cut rather
   * than as a change. The keyframe stops in globals.css are worked out from
   * this number; move it and they move.
   */
  const OVERLAP = 0.14;
  const start = i * step;
  const pct = (v: number) => `${(Math.min(1, Math.max(0, v)) * 100).toFixed(3)}%`;

  /** A range covering fractions `a` to `b` of this arrival's own slice. */
  const at = (a: number, b: number): React.CSSProperties => ({
    animationRange: `contain ${pct(start + step * a)} contain ${pct(start + step * b)}`,
  });

  return {
    /**
     * The window the record, its volume, that volume's turn and the ghost
     * numeral all share, handed down as two custom properties rather than as
     * an `animation-range` because one of the four is `.book3d__inner`, three
     * levels inside a component this section does not own: a range does not
     * inherit and a custom property does.
     */
    window: {
      "--win-a": pct(start - step * OVERLAP),
      "--win-b": pct(start + step * (1 + OVERLAP)),
    } as React.CSSProperties,
    /**
     * The rail item and the corner tally are on or off rather than fading, so
     * they take the slice itself, edge to edge and not the widened window: two
     * arrivals are half faded at a boundary, but only one of them can be the
     * one the corner says. Contiguous rather than inset, so the corner is never
     * briefly blank, and it cannot double up either: at the boundary the
     * outgoing animation is in its after phase, which with no fill applies
     * nothing at all.
     */
    mark:
      i === 0
        ? /* The first arrival's number has to be lit before the pin engages,
             because the first record is already showing on the way in: it is
             the one that does not fade up. `contain 0%` would not do it. A
             range is not applied in its before phase, and at progress exactly
             zero that is the phase it is in, so the corner would be blank for
             the whole approach and light up only once the section had stopped
             moving. Starting in `entry` instead is the same instant the record
             becomes visible. */
          ({
            animationRange: `entry 0% contain ${pct(step)}`,
          } as React.CSSProperties)
        : at(0, 1),
    /** Where the marker this arrival's rail link points at sits in the track. */
    anchor: (start + step / 2).toFixed(5),
    pos: n === 1 ? "solo" : i === 0 ? "first" : i === n - 1 ? "last" : "mid",
  };
}

export function ArrivalsScroll({
  arrivals,
  lang = defaultLocale,
  copy,
  href,
  className,
}: ArrivalsScrollProps) {
  const total = arrivals.length;
  if (total === 0) return null;

  const timings = arrivals.map((_, i) => arrivalTiming(i, total));

  return (
    <section className={cn("arrivals", className)} aria-labelledby="arrivals-title">
      <div
        className="arrivals__track"
        style={{ "--steps": total } as React.CSSProperties}
      >
        {/* The rail's targets. Zero-height, one per arrival, placed at the
            scroll offset where that arrival is composed: the fraction of the
            track's own scrollable length, which is the same fraction the
            timeline is at. Nothing renders; they exist to be scrolled to. */}
        {arrivals.map((arrival, i) => (
          <span
            key={`mark-${arrival.id}`}
            id={`arrival-${i + 1}`}
            className="arrivals__marker"
            style={{ "--at": timings[i].anchor } as React.CSSProperties}
            aria-hidden="true"
          />
        ))}

        <div className="arrivals__pin">
          <div className="arrivals__frame">
            {/* The section's frame: heading on the left, the count and the way
                out of the section on the right. None of it moves. */}
            <div className="arrivals__head">
              <div>
                <p className={cn("arrivals__eyebrow", textClass(lang))}>
                  {copy.eyebrow}
                </p>
                <h2
                  id="arrivals-title"
                  className={cn("arrivals__heading", textClass(lang))}
                >
                  {copy.title}
                </h2>
                <p className={cn("arrivals__lead", textClass(lang))}>{copy.lead}</p>
              </div>

              <div className="arrivals__aside">
                <p className="arrivals__tally" aria-hidden="true">
                  {/* Every number, stacked in one box; each shown only across
                      its own slice. The width is held by the last one, which
                      is also the widest, so the row never shifts. */}
                  <span className="arrivals__tally-now">
                    {arrivals.map((arrival, i) => (
                      <span
                        key={`tally-${arrival.id}`}
                        className="arrivals__tally-n"
                        style={timings[i].mark}
                      >
                        {arrival.number}
                      </span>
                    ))}
                    <span className="arrivals__tally-ghost">
                      {arrivals[total - 1].number}
                    </span>
                  </span>
                  <span className="arrivals__tally-sep">/</span>
                  <span>{arrivals[total - 1].number}</span>
                </p>

                <Link
                  href={href}
                  className={cn("arrivals__all", textClass(lang))}
                >
                  {copy.seeEverything}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* The stage. Pinned, every arrival is in this one cell and the
                timeline decides which is on top; stacked, they are ordinary
                blocks one after another. */}
            <div className="arrivals__stage">
              {arrivals.map((arrival, i) => (
                <article
                  key={arrival.id}
                  className="arrivals__step"
                  data-pos={timings[i].pos}
                  style={timings[i].window}
                >
                  <div className="arrivals__record">
                    <p className="arrivals__code" aria-hidden="true">
                      {arrival.code}
                    </p>

                    <h3 className={cn("arrivals__title", textClass(lang))}>
                      {arrival.title}
                      {/* The full stop is the reference's, and it is the one
                          place the accent colour appears in this section. Not
                          on a Bengali title: the script's own stop is the danda
                          and it ends a sentence, not a name, so a Latin period
                          hanging off a Bengali title is simply a mistake in
                          another alphabet. */}
                      {lang === "bn" ? null : (
                        <span className="arrivals__stop" aria-hidden="true">
                          .
                        </span>
                      )}
                    </h3>

                    <p className={cn("arrivals__by", textClass(lang))}>
                      {arrival.author}
                    </p>
                    <p className={cn("arrivals__note", textClass(lang))}>
                      {arrival.description}
                    </p>

                    {/* The spec sheet. A figure, its unit, and what it counts,
                        which is the shape the reference uses for a dose. */}
                    <dl className={cn("arrivals__spec", textClass(lang))}>
                      {arrival.spec.map((row) => (
                        <div key={row.label} className="arrivals__spec-row">
                          <dd className="arrivals__spec-value">
                            <span className="arrivals__spec-figure tabular-nums">
                              {row.value}
                            </span>
                            {row.unit ? (
                              <span className="arrivals__spec-unit">{row.unit}</span>
                            ) : null}
                          </dd>
                          <dt className="arrivals__spec-label">{row.label}</dt>
                        </div>
                      ))}
                    </dl>

                    <p className={cn("arrivals__total", textClass(lang))}>
                      <span className="arrivals__total-label">
                        {arrival.total.label}
                      </span>
                      <span className="arrivals__total-value tabular-nums">
                        {arrival.total.value}
                      </span>
                    </p>

                    <div className="arrivals__foot">
                      <Link
                        href={arrival.href}
                        className={cn("arrivals__open", textClass(lang))}
                      >
                        {copy.openRecord}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                      <a
                        href={arrival.fileUrl}
                        download
                        aria-label={arrival.downloadLabel}
                        className={cn("arrivals__take", textClass(lang))}
                      >
                        <Download className="size-3.5" aria-hidden="true" />
                        <span>{copy.takeFile}</span>
                      </a>
                    </div>
                  </div>

                  {/* The object. Decorative in the strict sense: the title,
                      the author and the file are all in the record beside it,
                      so there is nothing here for a screen reader to lose. */}
                  <div className="arrivals__object" aria-hidden="true">
                    <span className="arrivals__ghost">{arrival.number}</span>
                    <span className="arrivals__bloom" />
                    <span className="arrivals__ring arrivals__ring--wide" />
                    <span className="arrivals__ring arrivals__ring--tight" />
                    <p className={cn("arrivals__tag arrivals__tag--shelf", textClass(lang))}>
                      {arrival.category}
                    </p>
                    <p className="arrivals__tag arrivals__tag--file">{arrival.file}</p>
                    <div className="arrivals__vol">
                      <Book3D book={arrival.cover} lang={lang} size="lg" showcase />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* The rail. Ordinary anchors: the current one is marked by the
                timeline, not by a click, so it stays right when the reader
                scrolls past it by hand. */}
            <nav className="arrivals__rail" aria-label={copy.railLabel}>
              <ol>
                {arrivals.map((arrival, i) => (
                  <li key={`rail-${arrival.id}`}>
                    <a
                      href={`#arrival-${i + 1}`}
                      className="arrivals__step-link"
                      style={timings[i].mark}
                    >
                      <span aria-hidden="true">{arrival.number}</span>
                      <span className="sr-only">{arrival.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
