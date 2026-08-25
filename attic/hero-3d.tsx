"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
// Type-only. The module itself is imported inside the effect below: see the
// note there; a value import here would put three.js in the initial bundle.
import type { HeroScene, SceneBook } from "@/lib/hero-scene";

/**
 * The scrolling hero.
 *
 * The DOM here is a tall empty track with one screen-height panel stuck to the
 * top of it. Scrolling the track does not move the panel; it moves a number,
 * 0 to 1, which is handed to `lib/hero-scene` and drives everything the reader
 * sees: the volume opening, the collection arriving, the shelf squaring up.
 *
 * Three things are deliberate about how this is put together.
 *
 * The copy is not in WebGL. The headline, the lead, the buttons and the stats
 * are ordinary server-rendered DOM sitting over the canvas, so the page's most
 * important text is still text: indexable, selectable, translatable, and
 * readable by a screen reader that will never see the canvas at all.
 *
 * Nothing here waits for three.js. The panel renders complete on the server;
 * the scene is imported inside an effect and fades in over the top when it is
 * ready. A reader on a slow connection gets the hero immediately and the
 * animation late, rather than a loading bar.
 *
 * And it degrades in CSS, not in JavaScript. `prefers-reduced-motion` collapses
 * the track to a single screen and swaps in the static composition through a
 * media query in globals.css, so a reader who asked for less motion never sees
 * a tall page flash before script decides to shorten it.
 */

export type HeroBook = SceneBook & { slug: string };

export interface Hero3DCopy {
  titleStart: string;
  titleMiddle: string;
  titleOpens: string;
  titleEnd: string;
  lead: string;
  getStarted: string;
  browseCategories: string;
  statBooks: string;
  statAuthors: string;
  statDownloads: string;
  openTitle: string;
  openLead: string;
  scrollHint: string;
  featuredTitle: string;
}

interface Hero3DProps {
  /** The volume that opens, followed by the collection that arrives. */
  books: HeroBook[];
  lang: Locale;
  copy: Hero3DCopy;
  /** Already formatted in the reader's numerals by the server. */
  stats: { books: string; authors: string; downloads: string };
  /** The wordmark, in the reader's language. */
  brand: string;
  hrefs: { books: string; categories: string };
  /** The static composition shown instead of the canvas when motion is off. */
  fallback: React.ReactNode;
}

/** Opacity ramp for one block of copy: in over `a→b`, out over `c→d`. */
function window_(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p > c) return 1 - (p - c) / (d - c);
  return 1;
}

export function Hero3D({
  books,
  lang = defaultLocale,
  copy,
  stats,
  brand,
  hrefs,
  fallback,
}: Hero3DProps) {
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    if (!track || !pin || !canvas) return;

    // The media query is the source of truth for reduced motion; this is the
    // same question asked from script, so the scene is never even downloaded.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let scene: HeroScene | null = null;

    /* --- Scroll → progress -------------------------------------------
       Measured once and on resize, so the scroll handler itself only
       reads `scrollY` and never forces a layout. --------------------- */
    let start = 0;
    let span = 1;

    function measure() {
      const rect = track!.getBoundingClientRect();
      start = rect.top + window.scrollY;
      span = Math.max(1, rect.height - pin!.clientHeight);
    }

    let frame = 0;
    function update() {
      frame = 0;
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / span));
      sceneRef.current?.setProgress(p);

      // The copy blocks are moved by custom properties rather than by React
      // state: this runs on every scroll frame, and a re-render per frame to
      // change two opacities would be the most expensive thing on the page.
      pin!.style.setProperty("--b0", String(window_(p, -1, 0, 0.15, 0.24)));
      pin!.style.setProperty("--b1", String(window_(p, 0.28, 0.37, 0.46, 0.53)));
      pin!.style.setProperty("--b2", String(window_(p, 0.72, 0.82, 1, 2)));
      // Only the block the reader can actually see may take focus.
      pin!.dataset.beat = p < 0.26 ? "0" : p < 0.55 ? "1" : "2";
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function onResize() {
      measure();
      onScroll();
    }

    measure();
    update();

    /* --- Bringing up the scene -----------------------------------------
       Nothing above this point needed three.js, and the page should not
       have waited for it: it is by far the largest thing this route can
       load, and until it has parsed, the browser is not hydrating the
       header, the nav or anything else either. Imported here instead, it
       is off the initial bundle entirely: the hero is interactive as
       soon as the document is, and the scene fades in whenever it lands.

       This is also why the book stack is hidden while we wait rather than
       shown: it is the *substitute* hero, and flashing it up for a second
       before replacing it is worse than the small gap.
       ------------------------------------------------------------------ */
    let ready = false;

    // If the scene never arrives (a blocked chunk, a driver that hangs
    // rather than throws) the hero must not stay empty. Falling back to
    // the static composition is the recovery; an indefinite gap is not.
    const giveUp = window.setTimeout(() => {
      if (!cancelled && !ready) track!.dataset.static = "true";
    }, 8000);

    (async () => {
      try {
        const [{ createHeroScene }] = await Promise.all([
          import("@/lib/hero-scene"),
          // Cover art is typeset, so the textures have to be drawn with the
          // real faces loaded: otherwise every board bakes in the fallback
          // font. Fetched alongside the module rather than before it, since
          // neither waits on the other.
          document.fonts?.ready,
        ]);
        if (cancelled) return;

        scene = createHeroScene({
          canvas: canvas!,
          container: pin!,
          hero: books[0],
          field: books.slice(1),
          lang,
          onReady: () => {
            if (cancelled) return;
            ready = true;
            window.clearTimeout(giveUp);
            // Cleared in case the timeout above fired first and put the
            // static hero up while the scene was still coming.
            delete track!.dataset.static;
            setLive(true);
          },
          onBookClick: (book) => {
            const slug = (book as HeroBook).slug ?? String(book.id);
            window.location.href = `/${lang}/books/${slug}`;
          },
        });
        sceneRef.current = scene;
        update();
      } catch {
        // No WebGL, a lost context, or a blocked chunk. The static hero is
        // what the reader keeps; leaving `live` false is the whole recovery.
        if (!cancelled) track!.dataset.static = "true";
      }
    })();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // next-themes swaps a class on <html>; the scene's fog, rim light and
    // motes are all read from tokens, so they have to be read again.
    const themeWatch = new MutationObserver(() => sceneRef.current?.refreshTheme());
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      themeWatch.disconnect();
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [books, lang]);

  const bn = lang === "bn";

  return (
    <section ref={trackRef} className="hero3d paper-grain" data-live={live}>
      <div ref={pinRef} className="hero3d__pin" data-beat="0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 size-[38rem] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              // `--accent-lit`, not `--accent`: a blurred blob of a colour dark
              // enough for white button text reads as a smudge of shadow on the
              // warm ground rather than as light coming through a window.
              "radial-gradient(circle, var(--accent-lit) 0%, transparent 65%)",
          }}
        />

        {/* The scene. Decorative by definition: everything it says is said
            again in the copy layered over it. */}
        <canvas ref={canvasRef} className="hero3d__canvas" aria-hidden="true" />

        <div className="hero3d__stage">
          <div className="hero3d__copy">
            {/* --- Beat 0: the hero proper ------------------------------- */}
            <div className="hero3d__beat hero3d__beat--lead" data-b="0">
              {/* Every step below is smaller on a phone than it was. The
                  panel is one screen tall whatever the screen, and this block
                  used to want more than all 780px of a phone's, which left
                  the volume underneath it nowhere to stand and put it back
                  behind the type the stacked layout exists to keep it out of.
                  The clamp minimums are the mobile sizes; nothing changes from
                  the width at which the old minimum was already in force. */}
              <h1
                className={cn(
                  "font-bold text-ink",
                  bn
                    ? "bn text-[clamp(1.55rem,3.9vw,3.1rem)] leading-[1.3]"
                    : "text-[clamp(1.85rem,5.4vw,4.3rem)] leading-[1.06] tracking-[-0.03em]",
                )}
              >
                {copy.titleStart}{" "}
                <span className="brand-grad whitespace-nowrap">{brand}</span>{" "}
                {copy.titleMiddle}{" "}
                <span className="relative whitespace-nowrap">
                  {copy.titleOpens}
                  <ArrowRight
                    className="ml-3 inline size-[0.85em] align-baseline text-accent"
                    aria-hidden="true"
                  />
                </span>{" "}
                {copy.titleEnd}
              </h1>

              <p
                className={cn(
                  "mt-4 max-w-lg text-[0.95rem] leading-relaxed text-ink-mute sm:mt-6 sm:text-lg",
                  textClass(lang),
                )}
              >
                {copy.lead}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
                <Button asChild variant="primary" size="lg">
                  <Link href={hrefs.books}>
                    {copy.getStarted}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={hrefs.categories}>{copy.browseCategories}</Link>
                </Button>
              </div>

              <dl className="mt-6 grid max-w-md grid-cols-3 gap-4 sm:mt-10 sm:gap-6">
                {[
                  { label: copy.statBooks, value: stats.books },
                  { label: copy.statAuthors, value: stats.authors },
                  { label: copy.statDownloads, value: stats.downloads },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt
                      className={cn(
                        "text-[0.8rem] text-ink-faint sm:text-sm",
                        textClass(lang),
                      )}
                    >
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* --- Beat 1: the volume opens ------------------------------ */}
            <div className="hero3d__beat hero3d__beat--centre" data-b="1">
              <h2
                className={cn(
                  "text-[clamp(1.9rem,4.4vw,3.4rem)] font-bold tracking-tight text-ink",
                  bn && "bn leading-[1.35] tracking-normal",
                )}
              >
                {copy.openTitle}
              </h2>
              <p
                className={cn(
                  "mx-auto mt-4 max-w-md text-lg text-ink-mute",
                  textClass(lang),
                )}
              >
                {copy.openLead}
              </p>
            </div>

          </div>

          {/* Final Featured Books title */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[8%] z-20 flex justify-center"
            style={{ opacity: "var(--b2)" }}
          >
            <h2
              className={cn(
                "text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-ink",
                textClass(lang)
              )}
            >
              {copy.featuredTitle}
            </h2>
          </div>

          {/* The hero the page has before three.js arrives, and the hero it
              keeps for a reader who has asked for less motion. */}
          {/* <div className="hero3d__fallback" aria-hidden="true">
            {fallback}
          </div> */}
        </div>
        {/* The one instruction the scene needs: a hero this tall has to say
            that scrolling is what it is for. */}
        <div className={cn("hero3d__hint", textClass(lang))} aria-hidden="true">
          <span>{copy.scrollHint}</span>
          <span className="hero3d__hint-rail" />
        </div>
      </div>
    </section>
  );
}
