import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The wordmark: the mark in a gradient tile, then the name in two tones.
 *
 * One component for every place the name appears (header, footer, the door,
 * the admin rail, the intro curtain), because a mark that is re-typed at each
 * call site drifts. The gradients live in globals.css (`.brand-mark`,
 * `.brand-grad`) so both halves of the lockup pull from the same three tokens
 * and stay in step through the light/dark swap.
 */

/**
 * `md` (the header lockup) sets its name fluidly rather than at a fixed size.
 * The wordmark is `whitespace-nowrap` and sits in a bar that also has to hold
 * the language switch and three round controls. "Maternity Book Bank" is three
 * long words: at a flat 1.2rem it overruns a 360px phone and pushes the menu
 * button off the screen, which is what the clamp is for. Already at full size
 * by ~440px, so every viewport with the room is unchanged.
 */
const sizes = {
  sm: { tile: "size-8 rounded-[9px]", text: "text-[1.05rem]" },
  md: {
    tile: "size-9 rounded-[10px]",
    text: "text-[clamp(1rem,4.4vw,1.2rem)]",
  },
  lg: { tile: "size-11 rounded-xl", text: "text-[1.5rem]" },
} as const;

/**
 * The mark, as geometry rather than as an image: an open book with a newborn
 * cradled in the gutter.
 *
 * Not the ancestor's mark recoloured. That one was an open book with **three**
 * page-leaves fanning out of the fold, and the three leaves *were* the "3" of
 * Cef 3: carried across to a maternity library they would be three leaves that
 * mean nothing, which is the most common way a rebrand goes visibly wrong.
 *
 * So: the two page boards stay, because they are what makes the tile say
 * "library" at 16px without help from the wordmark beside it, and they are
 * re-cut with a rounder outer corner so the silhouette reads soft rather than
 * technical. In the gutter, where the leaves were, a single thick arc opens
 * upward with a small disc resting inside it. An arm around a baby; equally a
 * page curling out of the fold. Two shapes instead of five, which is also why
 * this one survives the favicon: the outer leaves of the old mark dropped below
 * a pixel at 16px and needed a whole separate cut to stay legible.
 *
 * That disc is load-bearing beyond the logo. `components/intro-curtain.tsx`
 * zooms the page through it (the counter of the mark becomes the aperture the
 * site opens behind), so its centre is at (24, 25.5) in this 48-unit box and
 * moving it means moving the intro's `transform-origin` to match.
 *
 * Every path is white on the tile's own gradient, so this one drawing serves
 * light mode, dark mode, the favicon and the touch icon without a second copy.
 * The art carries its own padding inside the 48-unit box, which is why it can
 * be dropped in at any size without a wrapper doing the insetting.
 */
export function BrandArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* The two page blocks. Both the top and the bottom edge fall from the
          outer corner into the gutter, which is the whole reason a filled shape
          reads as a board seen slightly from above rather than as a rectangle.
          The channel down the middle is left unpainted: the tile shows through
          it as the gutter. */}
      <path
        d="M22.6 24.6c-1.9-2.7-5-4.3-8.5-4.3H9.2A2.2 2.2 0 0 0 7 22.5v12.2c0 1.2 1 2.2 2.2 2.2h5c3.4 0 6.5 1.6 8.4 4.3z"
        fill="#fff"
        fillOpacity="0.96"
      />
      <path
        d="M25.4 24.6c1.9-2.7 5-4.3 8.5-4.3h4.9a2.2 2.2 0 0 1 2.2 2.2v12.2c0 1.2-1 2.2-2.2 2.2h-5c-3.4 0-6.5 1.6-8.4 4.3z"
        fill="#fff"
        fillOpacity="0.96"
      />

      {/* The cradle. An open arc rather than a closed bowl: a ring would read
          as a letter O at small sizes, and the gap at the top is what makes the
          disc look held rather than enclosed. Round caps because the whole
          point of this shape is that it is not sharp.

          The arc bottom sits at y≈18.4 and the boards begin at y≈20.3. That
          1.9-unit channel is deliberate and it is the tightest measurement in
          the drawing: any less and the arms fuse with the book at 24px. It
          still closes at 16px, where 48 units are three to the pixel, which is
          what `markSmall` in `scripts/build-icons.mjs` is for. */}
      <path
        d="M16.5 10.9c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* The counter. The intro curtain flies the page through this. */}
      <circle cx="24" cy="11.4" r="3.3" fill="#fff" />
    </svg>
  );
}

export function BrandMark({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "brand-mark relative inline-flex shrink-0 items-center justify-center",
        s.tile,
        className,
      )}
    >
      {/* Full-bleed: the art carries its own margin inside the 48-unit box, so
          the tile needs no padding of its own to sit it correctly. */}
      <BrandArt className="size-full" />
    </span>
  );
}

/**
 * The full lockup. `as` lets a footer render it as a heading and a header
 * render it inside its own link without nesting interactive elements.
 */
export function Brand({
  size = "md",
  className,
  markOnly = false,
}: {
  size?: keyof typeof sizes;
  className?: string;
  /** For the admin rail, where there is only room for the tile. */
  markOnly?: boolean;
}) {
  const s = sizes[size];

  if (markOnly) return <BrandMark size={size} className={className} />;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {/* One gradient across the whole name, not just the first word: over
          three syllables it actually travels, which is the point of it.
          Latin-only: the mark is the name, and a name is not translated. */}
      <span
        className={cn(
          "brand-grad font-extrabold leading-none tracking-[-0.025em] whitespace-nowrap",
          s.text,
        )}
      >
        {site.name}
      </span>
    </span>
  );
}
