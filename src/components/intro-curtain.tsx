"use client";

import { useEffect, useRef, useState } from "react";
import { BrandArt } from "@/components/brand";
import { cn } from "@/lib/utils";

/**
 * The entrance.
 *
 * A blush curtain over the whole viewport with the mark and the name on it. A
 * hairline rule fills as the page becomes ready; then the curtain zooms into the
 * counter of the mark (the small disc cradled in the arc), and that hole opens
 * into the page behind it.
 *
 * Three things make this an entrance rather than a loading screen:
 *
 * **The progress is real.** It is bound to `document.fonts.ready` and to the
 * page's own load event, not to a timer. A bar that fills on a `setInterval` is
 * a spinner wearing a costume, and readers can tell: it is the animation that
 * always takes exactly as long no matter how fast your connection is. There is
 * a trickle term so it never appears frozen, but the trickle is asymptotic: it
 * approaches 92% and cannot reach the end on its own.
 *
 * **It cannot outstay its welcome.** A floor of 700ms, so it does not flash on a
 * warm cache; a ceiling of 4500ms, so a hung font request cannot hold the door
 * shut. Click or press anything and it goes immediately.
 *
 * **It plays once per tab.** `sessionStorage`, not `localStorage`: someone who
 * opens the site again tomorrow gets the entrance again, which is the point of
 * having one, but someone who reloads twice while typing a password does not.
 *
 * Under `prefers-reduced-motion` this renders nothing at all, not a faded
 * version, nothing. The page is the content; the curtain is decoration, and the
 * honest response to "less motion" is to skip decoration rather than to slow it
 * down.
 */

/** Below this, the curtain would flash rather than play. */
const MIN_MS = 700;
/** Above this, something is wrong and the reader should not be paying for it. */
const MAX_MS = 4500;
/** How long the zoom-through takes once progress reaches the end. */
const ZOOM_MS = 1500;

const SEEN_KEY = "mbb:intro-seen";

export function IntroCurtain({
  name,
  tagline,
  bnClass,
}: {
  name: string;
  tagline: string;
  bnClass?: string;
}) {
  /**
   * `null` until we have decided. Rendering the curtain on the server and then
   * removing it on the client would flash it at every reader who had already
   * seen it, and rendering nothing on the server and adding it on the client
   * would flash the *page* first. So: nothing is rendered until the effect
   * below has read `sessionStorage`, and the effect runs before paint.
   */
  const [phase, setPhase] = useState<"unknown" | "playing" | "leaving" | "gone">(
    "unknown",
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private browsing throws on access rather than returning null. An
      // unreadable store means "not seen", which shows the curtain once more
      // than strictly necessary and is the harmless direction to fail in.
    }
    if (seen) {
      setPhase("gone");
      return;
    }
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const root = rootRef.current;
    if (!root) return;

    // The document must not scroll behind the curtain: a reader who scrolls
    // during the intro lands somewhere arbitrary when it lifts.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const started = performance.now();
    let raf = 0;
    let shown = 0;
    /** Real readiness, 0-1. Weighted: fonts matter more than the load event. */
    let target = 0.06;
    let finishing = false;

    const bump = (amount: number) => {
      target = Math.min(1, target + amount);
    };

    document.fonts?.ready.then(() => bump(0.44));
    if (document.readyState === "complete") {
      bump(0.5);
    } else {
      window.addEventListener("load", () => bump(0.5), { once: true });
    }

    function leave() {
      if (finishing) return;
      finishing = true;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // See above. Not being able to remember means the next reload plays it
        // again, which is a smaller problem than throwing here.
      }
      setPhase("leaving");
      window.setTimeout(() => {
        document.body.style.overflow = previousOverflow;
        setPhase("gone");
      }, ZOOM_MS);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = now - started;

      // Asymptotic trickle so the rule always looks alive, capped below the end
      // so it can never claim to be finished on its own.
      const trickle = 0.92 * (1 - Math.exp(-elapsed / 1400));
      const want = Math.max(Math.min(target, 1), Math.min(trickle, 0.92));
      shown += (want - shown) * 0.09;

      root!.style.setProperty("--fill", `${(shown * 100).toFixed(2)}%`);

      const ready = shown > 0.985 && target >= 1 && elapsed > MIN_MS;
      if (ready || elapsed > MAX_MS) {
        cancelAnimationFrame(raf);
        root!.style.setProperty("--fill", "100%");
        leave();
      }
    }
    raf = requestAnimationFrame(frame);

    // Any deliberate input skips it. Someone who has decided to get on with it
    // should not have to watch the rest.
    const skip = () => leave();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  if (phase === "unknown" || phase === "gone") return null;

  return (
    <div
      ref={rootRef}
      className="intro"
      data-leaving={phase === "leaving" ? "true" : "false"}
      // The page underneath is the real content and is already in the
      // accessibility tree. A screen reader has no use for a curtain.
      aria-hidden="true"
    >
      <div className="intro__stage">
        <BrandArt className="intro__mark" />

        {/* The name, masked by the same fill that drives the rule, so one
            number moves both and they cannot disagree. */}
        <p className={cn("intro__name", bnClass)}>{name}</p>
        <p className={cn("intro__tagline", bnClass)}>{tagline}</p>
        <div className="intro__rule" />
      </div>
    </div>
  );
}
