import type Lenis from "lenis";

/**
 * One inertial scroller for the whole page, reference-counted.
 *
 * Lenis works by taking over the window's scroll position and easing it toward
 * where the wheel says it should be. That is a page-wide side effect, and two
 * instances doing it at once fight over `scrollTo` every frame: the symptom is
 * a scroll that judders or refuses to settle, and it is very hard to trace back
 * to "a second component mounted". So acquisition goes through here: the first
 * caller creates it, the rest get the same object, and it is destroyed when the
 * last one lets go.
 *
 * Why it is worth having at all: this is the single largest reason the reference
 * site feels expensive. Native wheel scrolling advances in discrete jumps, and a
 * pinned horizontal track driven by discrete jumps looks like a slideshow. Lenis
 * interpolates the scroll position itself, so the pan is continuous.
 *
 * It drives the *native* scroll position rather than transforming a wrapper,
 * which is the whole reason it can be used here: `animation-timeline` and
 * `IntersectionObserver` both keep working under it. A wrapper-transforming
 * smooth-scroll library (Locomotive v4 and its imitators) would silently break
 * every scroll-driven animation in `globals.css`.
 *
 * The module is imported dynamically by the caller's effect, so neither Lenis
 * nor this file's cost lands in the initial bundle: the same rule three.js
 * follows in `lib/exium-scene.ts`.
 */

let instance: Lenis | null = null;
let pending: Promise<Lenis | null> | null = null;
let holders = 0;

/**
 * Take a reference to the page's scroller, creating it if nobody holds one.
 *
 * Returns `null` when the caller released its reference before the import
 * finished: a real case in React, whose effects mount, unmount and remount.
 */
export async function acquireSmoothScroll(): Promise<Lenis | null> {
  holders += 1;
  if (instance) return instance;

  pending ??= (async () => {
    const { default: Lenis } = await import("lenis");
    const lenis = new Lenis({
      // A touch over a second, with an exponential settle. Long enough that a
      // single wheel notch reads as a glide rather than a step; short enough
      // that a reader who wants to get to the footer is not held back.
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      // Touch is left alone deliberately. A phone's own scroll is already
      // inertial, and intercepting it is how smooth-scroll libraries earn
      // their reputation for feeling broken on mobile.
      syncTouch: false,
      // Lenis runs its own rAF loop, so there is not a second one here to
      // get out of step with it.
      autoRaf: true,
      // In-page anchors go through the scroller rather than jumping, so the
      // chapter rail and a `#hash` link behave the same way.
      anchors: true,
    });
    return lenis;
  })();

  const lenis = await pending;

  // The caller may have unmounted while the import was in flight. Nobody is
  // holding this, so it must not be left driving the page.
  if (holders === 0) {
    lenis?.destroy();
    pending = null;
    return null;
  }

  instance = lenis;
  return instance;
}

/** Give up a reference. The scroller is destroyed when the last one goes. */
export function releaseSmoothScroll(): void {
  holders = Math.max(0, holders - 1);
  if (holders > 0) return;
  instance?.destroy();
  instance = null;
  pending = null;
}

/**
 * Scroll to an absolute document offset, through the scroller when there is
 * one.
 *
 * `window.scrollTo({ behavior: "smooth" })` must not be used while Lenis is
 * running: the browser's own smooth scroll and Lenis's easing both write the
 * scroll position, and the two of them arrive at a standstill somewhere neither
 * intended. Without Lenis (reduced motion, or a narrow viewport) the native
 * call is exactly right.
 */
export function scrollToOffset(top: number): void {
  if (instance) {
    instance.scrollTo(top, { duration: 1.2 });
    return;
  }
  window.scrollTo({ top, behavior: "smooth" });
}
