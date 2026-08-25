"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
// Type-only. The module itself is imported inside the effect below: see the
// note there; a value import here would put three.js in the initial bundle.
import type { ExiumScene } from "@/lib/exium-scene";

/**
 * The sponsor's advertisement.
 *
 * This library exists because a pharmaceutical company paid for a print run, and
 * the deal is that its product is on the page. Two things follow.
 *
 * The first is that it should be *good*. A flat JPEG of a box in a sidebar is
 * the visual language of a banner ad, which readers have spent twenty years
 * learning to ignore; a carton you can pick up and turn over is the visual
 * language of a shop. So the pack is real geometry with its own artwork drawn
 * onto it (`lib/exium-scene`, `lib/exium-canvas`) and it accepts a drag.
 *
 * The second is that it should be *honest*, and that is mostly about what is
 * DOM and what is canvas. The product name, the strength, the generic name and
 * the company are ordinary server-rendered text sitting beside the canvas, so
 * they are selectable, translatable, searchable and readable by a screen reader
 * that will never see the WebGL at all. Nothing about the medicine is only
 * available as pixels.
 *
 * How it loads follows the rule every WebGL surface here follows:
 *
 *   • the card renders complete from the server, with the flat pack shot in it;
 *   • three.js is imported inside the effect, so it is off the initial bundle;
 *   • the canvas fades in over the still when the first frame lands;
 *   • `prefers-reduced-motion` is asked from script *and* enforced in CSS, so a
 *     reader who wants less motion never downloads the scene at all and keeps
 *     the still image, which is a complete advert on its own.
 */

export interface ExiumAdCopy {
  /** "Courtesy by" / "সৌজন্যে": the label above the company. */
  courtesy: string;
  product: string;
  generic: string;
  company: string;
  /** Alt text for the still. */
  alt: string;
  /** "Drag to turn the pack": only shown once the canvas is live. */
  hint: string;
  /** Legal line: this is an advert, not medical advice. */
  note: string;
}

export function ExiumAd({
  copy,
  variant = "panel",
  className,
  bnClass,
}: {
  copy: ExiumAdCopy;
  /**
   * `panel`: the tall card for a sidebar or the sign-in aside.
   * `strip`: the wide, short version for the footer, still image only.
   */
  variant?: "panel" | "strip";
  className?: string;
  bnClass?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ExiumScene | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // The strip is deliberately flat everywhere: it sits in the footer of every
    // page, and a WebGL context per page-view for a 4rem-tall slot is a cost
    // with no reader on the other end of it.
    if (variant === "strip") return;

    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    // The media query is the source of truth for reduced motion; this is the
    // same question asked from script, so the scene is never even downloaded.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let scene: ExiumScene | null = null;

    (async () => {
      try {
        const [{ createExiumScene }] = await Promise.all([
          import("@/lib/exium-scene"),
          // The pack's wordmark is typeset onto the texture, so the faces have
          // to be drawn with real fonts loaded or the label bakes in the
          // fallback face. Fetched alongside the module; neither waits on the
          // other.
          document.fonts?.ready,
        ]);
        if (cancelled) return;

        scene = createExiumScene({
          canvas,
          container: stage,
          onReady: () => !cancelled && setLive(true),
        });
        sceneRef.current = scene;
      } catch {
        // A blocked chunk or a driver that will not give up a context leaves
        // the still image in place, which is the whole advert. There is
        // nothing to report and nothing to retry.
      }
    })();

    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [variant]);

  // Re-read `--accent-lit` when the theme switches: the rim light is the one
  // part of the scene that follows the site's palette rather than the pack's.
  useEffect(() => {
    if (!live) return;
    const root = document.documentElement;
    const observer = new MutationObserver(() =>
      sceneRef.current?.refreshTheme(),
    );
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [live]);

  if (variant === "strip") {
    return (
      <aside
        aria-label={copy.courtesy}
        className={cn("exium-strip", className)}
      >
        <Image
          src="/exium-mups-20.png"
          alt={copy.alt}
          width={508}
          height={239}
          className="exium-strip__pack"
        />
        <div className="min-w-0">
          <p
            className={cn(
              "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-faint",
              bnClass,
            )}
          >
            {copy.courtesy}
          </p>
          <p className={cn("mt-1 font-semibold text-ink", bnClass)}>
            {copy.product}
          </p>
          <p className={cn("text-sm text-ink-mute", bnClass)}>{copy.company}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label={copy.courtesy}
      data-live={live ? "true" : "false"}
      className={cn("exium-ad", className)}
    >
      <p
        className={cn(
          "exium-ad__eyebrow text-[0.68rem] font-semibold uppercase tracking-[0.2em]",
          bnClass,
        )}
      >
        {copy.courtesy}
      </p>

      <div ref={stageRef} className="exium-ad__stage">
        {/* The still is the advert. The canvas is an improvement on it, laid
            over the top, and the still stays in the DOM underneath rather than
            being swapped out, so there is no reflow when the scene lands and
            no empty box if it never does. */}
        <Image
          src="/exium-mups-20.png"
          alt={copy.alt}
          width={508}
          height={239}
          priority={false}
          className="exium-ad__still"
        />
        <canvas ref={canvasRef} className="exium-ad__canvas" aria-hidden="true" />
      </div>

      <p className={cn("exium-ad__product", bnClass)}>{copy.product}</p>
      <p className={cn("exium-ad__generic", bnClass)}>{copy.generic}</p>

      {/* Only claimed once the canvas is actually running. Telling a reader to
          drag something that is a static image is worse than saying nothing. */}
      <p className={cn("exium-ad__hint", bnClass)} aria-hidden={!live}>
        {live ? copy.hint : ""}
      </p>

      <p className={cn("exium-ad__company", bnClass)}>{copy.company}</p>
      <p className={cn("exium-ad__note", bnClass)}>{copy.note}</p>
    </aside>
  );
}
