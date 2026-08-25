"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A silent looping film behind a plate.
 *
 * The still underneath it is the picture; this is the light moving across it.
 * So the component's whole job is to be *skippable*: there is a complete page
 * without it, and three kinds of reader should never pay for it.
 *
 * **Nobody who asked for less motion.** The query is asked here, in script,
 * not only in CSS, because `display: none` on a `<video autoplay>` does not
 * stop the browser fetching it. Nothing renders until the effect has run and
 * agreed, so a reader with the preference set never sees the request at all.
 * The stylesheet hides it too, which covers the reader who changes the setting
 * with the page already open before the listener below fires.
 *
 * **Nobody on a metered connection.** `saveData` is the browser telling us the
 * reader is paying by the megabyte, and a decorative film is exactly what that
 * flag exists to refuse. Same for `2g`.
 *
 * **Nobody who has scrolled past it.** An `IntersectionObserver` pauses the
 * element when it leaves the viewport, which is the difference between a
 * decode running for the length of the visit and one running while it is on
 * screen. There is no scroll listener here, in keeping with the rest of the
 * app: the observer is the whole mechanism.
 */
export function AmbientVideo({
  src,
  className,
}: {
  /** A self-hosted file. `next.config.ts` ships `media-src 'self'`. */
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [wanted, setWanted] = useState(false);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    // `connection` is Chromium-only and the shape is stable enough to read
    // defensively rather than to type.
    const link = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const metered =
      link?.saveData === true ||
      link?.effectiveType === "slow-2g" ||
      link?.effectiveType === "2g";

    const decide = () => setWanted(!calm.matches && !metered);
    decide();
    calm.addEventListener("change", decide);
    return () => calm.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // A rejected promise here is an autoplay policy saying no, which is
          // a still image instead of a film: nothing to report.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "10%" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [wanted]);

  if (!wanted) return null;

  return (
    <video
      ref={ref}
      className={cn("ambient-video", className)}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      /* Decoration. It carries no information the page does not already
         carry in text, so it is not in the accessibility tree and not in
         the tab order. */
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
