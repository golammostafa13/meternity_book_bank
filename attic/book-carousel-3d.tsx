"use client";

import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/cover-art";
import { coverTheme } from "@/lib/cover-theme";
import type { Dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { bookAuthorName, bookTitle, textClass } from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * The featured carousel: a ring of covers turning in front of the reader, the
 * middle one face-on and the rest angled away to either side.
 *
 * It moves on its own (that is the point of it), which puts the whole design
 * under WCAG 2.2.2, so every one of these is deliberate:
 *
 *   · a real pause control, not just hover-to-stop, because a keyboard or
 *     touch reader has no hover;
 *   · it stops while the pointer is over it or anything inside it has focus,
 *     so it never moves out from under someone who is reading or tabbing;
 *   · `prefers-reduced-motion` turns the rotation off entirely and leaves the
 *     carousel as a plain, fully usable stepper;
 *   · arrow keys, drag, the dots and the side covers themselves all steer it.
 *
 * Only the middle cover is reachable: the others are `inert`, so tabbing goes
 * from the pause button to the featured book and out again rather than through
 * six covers the reader cannot see the front of. Each side cover carries one
 * button whose whole job is to bring that book to the middle.
 *
 * Geometry lives in `.coverflow*` in globals.css; this component only decides
 * which cover is where. Placement is handed over as four custom properties so
 * that advancing the ring is a compositor-only transform, never a re-layout.
 */

/**
 * Covers drawn either side of the middle one: five on stage. A third ring adds
 * nothing but slivers at the edges, and each one is a full cover to lay out.
 */
const WINGS = 2;
/**
 * How long a book holds the front. Short enough that the ring reads as alive,
 * long enough to take in a cover and its name, and the active dot spends
 * exactly this long filling, so the reader can see the change coming.
 */
const INTERVAL_MS = 3600;
/** Pointer travel that counts as a swipe rather than a tap, in px. */
const SWIPE_PX = 44;

export function BookCarousel3D({
  books,
  lang,
  dict,
  className,
}: {
  books: Book[];
  lang: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const count = books.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [engaged, setEngaged] = useState(false);
  const [reduced, setReduced] = useState(false);

  const step = useCallback(
    (dir: number) => setActive((a) => (a + dir + count) % count),
    [count],
  );

  // Read the motion preference on the client and keep watching it: a reader can
  // change it mid-session, and this is the one component that must obey at once.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const rotating = playing && !engaged && !reduced && count > 1;

  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => step(1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [rotating, step]);

  // Drag to spin. A drag that ends up moving the ring must not also open the
  // book it started on, so the distance is remembered until the click fires.
  const dragFrom = useRef<number | null>(null);
  const dragged = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    // Middle/right buttons and mouse-wheel clicks are not drags.
    if (e.button !== 0) return;
    dragFrom.current = e.clientX;
    dragged.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null) return;
    const dx = e.clientX - from;
    if (Math.abs(dx) < 10) return;
    dragged.current = true;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  /** Signed distance to the middle, by the short way round the ring. */
  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  /**
   * Where a cover sits, given its distance from the middle. The first step out
   * is the big one: it has to clear a cover that is both full-size and
   * unturned, so anything evenly spaced leaves it hiding behind the front.
   *
   * The second ring steps further than the first *and* turns harder. Turning
   * harder is what earns the room: a cover at 66° is barely a third of its own
   * width on screen, so ring two lands shoulder-to-shoulder with ring one
   * instead of peering out from behind it as a sliver.
   */
  const placeOf = (o: number) => {
    const a = Math.abs(o);
    const dir = Math.sign(o);
    return {
      "--x": o === 0 ? 0 : dir * (78 + (a - 1) * 58),
      "--ry": -dir * (52 + (a - 1) * 14),
      "--a": a,
      // The front cover stands up out of the row; the turned ones settle back
      // into it, further each ring out.
      "--y": a === 0 ? -8 : 4 + (a - 1) * 9,
      "--s": a === 0 ? 1 : Math.max(0.7, 0.86 - (a - 1) * 0.16),
      // Full opacity for every cover on stage. A partly transparent cover
      // reads as half-loaded rather than further back, and, more concretely,
      // any opacity below 1 flattens `preserve-3d`, which would collapse the
      // board edge these panels are built around. Depth is carried by scale,
      // shade and distance instead.
      "--op": a > WINGS ? 0 : 1,
      zIndex: 30 - a,
    } as React.CSSProperties;
  };

  const activeBook = books[active];

  return (
    <div className={cn("relative", className)}>
      {/* The stage. Overflow is clipped rather than fitted: the ring is meant
          to run off both edges on a narrow screen, not to shrink. */}
      <div
        className="coverflow relative overflow-hidden"
        role="group"
        aria-roledescription="carousel"
        aria-label={dict.carousel.label}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragFrom.current = null)}
        onMouseEnter={() => setEngaged(true)}
        onMouseLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={() => setEngaged(false)}
      >
        <div className="coverflow__stage">
          <div className="coverflow__spot" aria-hidden="true" />

          {books.map((book, i) => {
            const o = offsetOf(i);
            const a = Math.abs(o);
            const isActive = o === 0;
            const detail = localePath(lang, `/books/${book.slug}`);

            const cover = (
              <div
                className={cn(
                  "coverflow__board aspect-2/3 w-full",
                  isActive && "coverflow__board--front",
                )}
              >
                <CoverArt book={book} lang={lang} size="lg" />
                <span className="coverflow__shade" aria-hidden="true" />
                <span className="coverflow__gloss" aria-hidden="true" />
              </div>
            );

            /* The board's own edge, in the binding's colour so it reads as the
               same object as the books everywhere else on the site. Only on the
               turned covers: the middle one is face-on and has no edge to show. */
            const edge = isActive ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "coverflow__edge",
                  o < 0 ? "coverflow__edge--l" : "coverflow__edge--r",
                )}
                style={{ "--edge": coverTheme(book).spine } as React.CSSProperties}
              />
            );

            return (
              <div
                key={book.id}
                className="coverflow__panel"
                style={{
                  ...placeOf(o),
                  // Past the wings a cover is invisible; take it out of
                  // hit-testing too so it cannot swallow a click.
                  pointerEvents: a > WINGS ? "none" : undefined,
                }}
                // Everything off-centre is out of the tab order and out of the
                // accessibility tree; the button below is its only handle.
                {...(isActive ? {} : { inert: true, "aria-hidden": true })}
              >
                {isActive ? (
                  <Link
                    href={detail}
                    className="coverflow__link block rounded-[1.15rem]"
                    onClick={(e) => {
                      if (dragged.current) e.preventDefault();
                    }}
                  >
                    <ViewTransition
                      name={`cover-${book.id}`}
                      share="morph"
                      default="none"
                    >
                      {cover}
                    </ViewTransition>
                    {/* Appears under the pointer, on the object it acts on. */}
                    <span className="coverflow__open" aria-hidden="true">
                      <span className={textClass(lang)}>
                        {dict.common.readOnline}
                      </span>
                    </span>
                  </Link>
                ) : (
                  cover
                )}
                {edge}
              </div>
            );
          })}

          {/* Side covers are inert, so their handle sits outside them: one
              button per cover, in the same place, doing the obvious thing. */}
          {books.map((book, i) => {
            const o = offsetOf(i);
            const a = Math.abs(o);
            if (o === 0 || a > WINGS) return null;
            return (
              <button
                key={`pick-${book.id}`}
                type="button"
                onClick={() => setActive(i)}
                className="coverflow__panel coverflow__pick cursor-pointer rounded-[1.15rem]"
                style={placeOf(o)}
              >
                {/* Matches the cover it sits on, so the hit area is the cover. */}
                <span className="block aspect-2/3 w-full" />
                <span className="sr-only">
                  {fill(lang, dict.carousel.show, {
                    title: bookTitle(book, lang),
                  })}
                </span>
              </button>
            );
          })}
        </div>

        <div className="coverflow__floor" aria-hidden="true" />
      </div>

      {/* --- The featured book, named ----------------------------------- */}
      {activeBook && (
        <div
          // Remounted per book, which is what replays the entry animation:
          // the name arriving with the cover rather than swapping under it.
          key={activeBook.id}
          // The floor is set so a two-line title cannot shove the controls
          // down as the ring turns.
          className="coverflow__caption mx-auto mt-7 flex min-h-17 max-w-lg flex-col items-center justify-start px-5 text-center"
        >
          <Link
            href={localePath(lang, `/books/${activeBook.slug}`)}
            className={cn(
              "text-[clamp(1.05rem,2vw,1.35rem)] font-semibold leading-tight tracking-tight text-ink transition-colors hover:text-accent",
              textClass(lang),
            )}
          >
            {bookTitle(activeBook, lang)}
          </Link>
          <p
            className={cn(
              "mt-1.5 text-[0.85rem] text-ink-mute",
              textClass(lang),
            )}
          >
            {bookAuthorName(activeBook, lang)}
          </p>
        </div>
      )}

      {/* --- Controls -------------------------------------------------- */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <RingButton
          label={dict.carousel.previous}
          onClick={() => step(-1)}
          icon={<ChevronLeft className="size-4" aria-hidden="true" />}
        />

        <div className="flex items-center gap-2">
          {books.map((book, i) => (
            <button
              key={`dot-${book.id}`}
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active}
              data-current={i === active}
              className="coverflow__dot"
            >
              {/* The clock. Keyed by the active index so each turn restarts
                  it, and only timed while the ring is actually turning: a bar
                  draining on a paused carousel is a lie. */}
              {i === active && (
                <span
                  key={`clock-${active}-${String(rotating)}`}
                  aria-hidden="true"
                  className={cn(
                    "coverflow__dot-fill",
                    rotating && "coverflow__dot-fill--timed",
                  )}
                  style={{ animationDuration: `${INTERVAL_MS}ms` }}
                />
              )}
              <span className="sr-only">
                {fill(lang, dict.carousel.show, {
                  title: bookTitle(book, lang),
                })}
              </span>
            </button>
          ))}
        </div>

        <RingButton
          label={dict.carousel.next}
          onClick={() => step(1)}
          icon={<ChevronRight className="size-4" aria-hidden="true" />}
        />

        {/* Hidden when the reader has asked for less motion: there is nothing
            left to pause, and a dead control is worse than none. */}
        {!reduced && (
          <RingButton
            label={playing ? dict.carousel.pause : dict.carousel.play}
            onClick={() => setPlaying((p) => !p)}
            icon={
              playing ? (
                <Pause className="size-3.5" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )
            }
            className="ml-2"
          />
        )}
      </div>

      {/* Steering a ring of covers is not obvious from looking at it. Said
          once, quietly, under the controls that prove it. */}
      <p
        className={cn(
          "mt-4 text-center text-[0.72rem] text-ink-faint",
          textClass(lang),
        )}
      >
        {dict.carousel.hint}
      </p>

      {/* Announced, not shown: sighted readers can see which cover is in front,
          screen-reader users are told when it changes. */}
      <p className="sr-only" aria-live="polite">
        {fill(lang, dict.carousel.position, { n: active + 1, total: count })}
        {activeBook ? `; ${bookTitle(activeBook, lang)}` : ""}
      </p>
    </div>
  );
}

function RingButton({
  label,
  onClick,
  icon,
  className,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-mute shadow-e1 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent-soft hover:text-accent hover:shadow-e2 active:translate-y-0",
        className,
      )}
    >
      {icon}
    </button>
  );
}
