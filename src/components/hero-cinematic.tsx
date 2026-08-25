import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

/**
 * The hero: four plates, one after another, behind the name.
 *
 * This replaces a scroll-scrubbed WebGL scene of a book opening. The scene was
 * a fine piece of work and the wrong thing to open with: it asked the reader to
 * scroll before the page would say anything, and what it eventually said was
 * "here is a book", which the shelves below say better. What a library for
 * mothers should open with is mothers.
 *
 * **There is no JavaScript in here, and no video file either.** The dissolve and
 * the slow push are CSS animations on four stills; the component is a Server
 * Component and ships nothing to the client but markup. That is not a
 * compromise against a real video: it is the better build. A hero video that
 * reads as premium is several megabytes before it has said anything, has to be
 * licensed for the purpose, and cannot come from a CDN under a
 * `default-src 'self'` policy, so it would have to live in the repository. Four
 * plates at ~70 KB each, cross-dissolving with a Ken Burns push, is what these
 * sequences look like frame to frame at a fraction of the weight, and it
 * degrades to a single still under `prefers-reduced-motion` with one media
 * query rather than a `pause()` call.
 *
 * The band is dark in both themes. That is a deliberate exception to the rule
 * stated at the top of `globals.css` (that dark mode is a token swap and no
 * component overrides colour per theme), and it is the only one: a cinema frame
 * is dark because the picture is the light source, and a light-mode variant of
 * this section would be a different design rather than the same design in
 * another palette. It is written as its own scoped palette in the stylesheet so
 * the exception is visible rather than smuggled in as a hundred overrides.
 */

export interface HeroPlate {
  /** Path under `public/`. */
  src: string;
  /**
   * Empty by design. These are the page's ground, not its content: the name
   * and the lead beside them say everything a screen reader needs, and four
   * descriptions of photographs would be four interruptions before it.
   */
  alt?: "";
}

export interface HeroCinematicCopy {
  eyebrow: string;
  /** The name, broken across two lines by the translator rather than by CSS. */
  titleTop: string;
  titleBottom: string;
  lead: string;
  enter: string;
  browse: string;
  scrollHint: string;
  /** "16 titles", "6 publishers": already formatted and localised. */
  meta: string[];
}

interface HeroCinematicProps {
  plates: HeroPlate[];
  lang?: Locale;
  copy: HeroCinematicCopy;
  hrefs: { books: string; categories: string };
  /** Anchor the scroll cue points at: the section immediately below. */
  cueHref?: string;
}

export function HeroCinematic({
  plates,
  lang = defaultLocale,
  copy,
  hrefs,
  cueHref = "#collection-title",
}: HeroCinematicProps) {
  const count = plates.length;

  return (
    <section className="cinema" aria-labelledby="cinema-title">
      {/* The footage. `--n` and `--i` are all the cycle needs: each plate runs
          the same keyframes, offset by its share of the loop. */}
      <div
        className="cinema__plates"
        aria-hidden="true"
        style={{ "--n": count } as React.CSSProperties}
      >
        {plates.map((plate, i) => (
          <div
            key={plate.src}
            className="cinema__plate"
            style={{ "--i": i } as React.CSSProperties}
          >
            <Image
              src={plate.src}
              alt=""
              fill
              sizes="100vw"
              /* Only the first plate is wanted early: it is the LCP element.
                 The other three are needed six seconds later at the soonest,
                 and fetching all four at once would be four large images
                 competing for the connection that has to deliver the first. */
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              quality={82}
              className="cinema__img"
            />
          </div>
        ))}
      </div>

      {/* Two scrims, doing two different jobs. See the stylesheet. */}
      <div className="cinema__scrim" aria-hidden="true" />
      <div className="cinema__grain" aria-hidden="true" />

      <div className="cinema__stage">
        <p className={cn("cinema__eyebrow", textClass(lang))}>{copy.eyebrow}</p>

        <h1 id="cinema-title" className={cn("cinema__title", textClass(lang))}>
          {/* Two lines, each masked, rising in turn. The break is in the
              dictionary because where a name divides is a question about the
              language: "Maternity / Book Bank" and "মাতৃত্ব / বুক ব্যাংক" do not
              break in the same place, and neither would survive CSS choosing. */}
          <span className="cinema__line">
            <span>{copy.titleTop}</span>
          </span>
          <span className="cinema__line">
            <span>{copy.titleBottom}</span>
          </span>
        </h1>

        <span className="cinema__rule" aria-hidden="true" />

        <p className={cn("cinema__lead", textClass(lang))}>{copy.lead}</p>

        <div className="cinema__actions">
          <Link href={hrefs.books} className="cinema__cta">
            <span className={textClass(lang)}>{copy.enter}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href={hrefs.categories} className="cinema__cta cinema__cta--ghost">
            <span className={textClass(lang)}>{copy.browse}</span>
          </Link>
        </div>
      </div>

      <div className="cinema__foot">
        <ul className={cn("cinema__meta", textClass(lang))}>
          {copy.meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {/* Not a decoration: it is the only thing on the screen that says the
            page continues, and on a full-bleed hero that is worth saying. */}
        <a href={cueHref} className={cn("cinema__cue", textClass(lang))}>
          {copy.scrollHint}
          <span className="cinema__cue-line" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
