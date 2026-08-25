import { CourtesyBy } from "@/components/courtesy-by";
import { ExiumAd } from "@/components/exium-ad";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The panel beside the card, on both doors.
 *
 * This is the first surface anyone sees, because `/` lands on sign-in and there
 * is no way past it, so it has to do three jobs at once: say what the library
 * is, say who paid for it, and not get in the way of a single password field.
 * Hence the order: the promise, then the sponsor.
 *
 * The advert is *here* rather than only inside the library on purpose. A reader
 * who never gets past this page has still seen the pack, which is the deal; and
 * putting it at the door means the catalogue pages can carry it once, quietly,
 * in a sidebar instead of everywhere.
 *
 * Desktop only. On a phone the form is the page, and nothing should stand
 * between the reader and it.
 *
 * The entry is the hero's, in miniature: the tagline rises out of its own clip
 * box and everything under it follows a beat later. `--lag` on each block is
 * the whole of the choreography — see `.door__rise` in the stylesheet. It is
 * the same sequence the catalogue and the book page open with, which is the
 * point: this page is where a reader learns what the site's motion means.
 */
export function AuthAside({
  lang,
  lead,
}: {
  lang: Locale;
  /** Each door says something different about why it is asking. */
  lead: string;
}) {
  const dict = getDictionary(lang);
  const bn = textClass(lang);

  return (
    <div className="hidden lg:block">
      <p
        className={cn(
          "door__rise inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink-mute",
          bn,
        )}
      >
        <span
          aria-hidden="true"
          className="brand-mark inline-block size-2 rounded-full"
        />
        {dict.auth.sideEyebrow}
      </p>

      {/* One clip box around the whole tagline rather than one per line: where
          this sentence wraps is the browser's decision at this width, and a
          per-line mask would need the break points, which only the hero has
          (its title is broken in the dictionary). Rising as a block still
          reads as type arriving rather than fading in. */}
      {/* The clip box owns its own margins (it inflates itself and cancels the
          inflation, see the stylesheet), so the spacing above it lives on a
          wrapper rather than fighting it. */}
      <div className="mt-3 max-w-xl">
        <p
          className={cn(
            "door__mask text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-[-0.02em] text-ink",
            lang === "bn" ? "bn leading-[1.35]" : "leading-[1.15]",
          )}
        >
          <span>{lang === "bn" ? site.taglineBn : site.tagline}</span>
        </p>
      </div>

      <span className="door__rule" aria-hidden="true" />

      <p
        className={cn("door__rise max-w-md text-[0.95rem] text-ink-mute", bn)}
        style={{ "--lag": "0.34s" } as React.CSSProperties}
      >
        {lead}
      </p>

      <div
        className="door__rise mt-9 flex max-w-lg items-end gap-8"
        style={{ "--lag": "0.48s" } as React.CSSProperties}
      >
        <ExiumAd
          copy={dict.sponsor}
          className="w-[17rem] shrink-0"
          bnClass={bn}
        />
        <CourtesyBy
          label={dict.sponsor.courtesy}
          company={dict.sponsor.company}
          className="pb-2"
          bnClass={bn}
        />
      </div>
    </div>
  );
}

/**
 * The card itself: heading, and whatever form the door needs. Shared so that
 * the password and the register are visibly the same object seen twice rather
 * than two pages that happen to look similar.
 *
 * Three boxes, and the shape of this is the record of two things that were
 * tried here and taken back out:
 *
 *   • `.door__card` runs the **entry** — the card tips upright out of the page,
 *     the same move `.reveal-3d` makes for a section. It is the only 3D move
 *     left on the object itself.
 *   • `.door__pane` is the **sheet** — square to the reader, with a lit top
 *     bevel and a specular band across it, standing above its own pool of pink
 *     light. Square, and it stays square: a resting tilt was the obvious way to
 *     make this page read as 3D and it does not survive contact with the form.
 *     The email field is `autoFocus` (deliberately — see `DoorForm`), so
 *     `:focus-within` is true before the first paint and a
 *     straighten-on-focus rule would fire before anyone saw it; and a login
 *     card left askew while you copy a word off a printed page is an obstacle,
 *     not a style. A stack of leaves behind the pane was the second attempt,
 *     and it went the same way for a plainer reason: three sets of rounded
 *     corners around one form is busier than the form, and the depth is not
 *     worth what it costs the thing a reader is trying to fill in. The depth on
 *     this page belongs to the light behind it — see `DoorFlow`.
 *   • `.door__pane-body` holds the **content** above the bevel and the sheen,
 *     which are absolutely positioned pseudo-elements and would otherwise paint
 *     over the heading.
 */
export function AuthCard({
  lang,
  title,
  lead,
  children,
  footer,
}: {
  lang: Locale;
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const bn = textClass(lang);

  return (
    <div className="door__card mx-auto w-full max-w-sm lg:mx-0">
      <div className="door__pane rounded-3xl border border-line bg-surface p-8 shadow-e4">
        <div className="door__pane-body">
          <h1
            className={cn(
              "door__mask text-[1.65rem] font-bold tracking-tight text-ink",
              bn,
            )}
          >
            <span>{title}</span>
          </h1>

          {lead ? (
            <p
              className={cn("door__rise mt-2.5 text-[0.92rem] text-ink-mute", bn)}
              style={{ "--lag": "0.26s" } as React.CSSProperties}
            >
              {lead}
            </p>
          ) : null}

          <div
            className="door__rise mt-7"
            style={{ "--lag": "0.36s" } as React.CSSProperties}
          >
            {children}
          </div>
        </div>
      </div>

      {footer ? (
        <div
          className="door__rise"
          style={{ "--lag": "0.5s" } as React.CSSProperties}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The shell both columns sit in, and the camera they share.
 *
 * The perspective is declared here rather than inside the card, so the card's
 * entry tips through the same vanishing point as the plumes drifting behind it.
 * A `perspective()` function in the card's own transform would give it a
 * private camera and the object would arrive into a slightly different room
 * from its own background.
 */
export function AuthLayoutGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="door__grid mx-auto grid w-full max-w-6xl items-center gap-16 px-5 pb-20 lg:grid-cols-[1fr_24rem] lg:gap-20 lg:px-8">
      {children}
    </div>
  );
}
