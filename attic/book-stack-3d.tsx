import { CoverArt } from "@/components/cover-art";
import { coverTheme } from "@/lib/cover-theme";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

type BookLike = Pick<
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

/**
 * A pile of books lying flat, seen from above at an angle: the composition
 * the reference design puts in its hero.
 *
 * Each volume is a real box (top board + the two page edges facing the
 * camera); the scene sets the single viewing angle they all share, so the
 * stack holds together as one object instead of as five stickers. Geometry
 * lives in `.stack3d` in globals.css.
 *
 * The ribbon marker is the composition's one hot-orange element, mirroring
 * the reference illustration.
 */

/**
 * Hand-piled offsets. Fixed, not random, so SSR and CSR always agree.
 * Widths taper upward: the biggest volume is always at the bottom, which is
 * what makes a pile look stable rather than stacked by a machine.
 */
const layout = [
  { x: 0, y: 0, w: 64, spin: -2 },
  { x: 4, y: -3, w: 61, spin: 3.5 },
  { x: -2, y: -6, w: 58, spin: -5 },
  { x: 5, y: -9, w: 53, spin: 2 },
  { x: 1, y: -12, w: 49, spin: -3 },
];

export function BookStack3D({
  books,
  lang = defaultLocale,
  className,
  yaw = -34,
}: {
  books: BookLike[];
  lang?: Locale;
  className?: string;
  /** Rotation of the whole pile in the tabletop plane. */
  yaw?: number;
}) {
  // Bottom of the pile first, so the largest volume carries the rest.
  const pile = books.slice(0, layout.length);

  // Thickness in px per volume, and the running height it sits at. Piles read
  // as paper unless the boards are generous, so this runs thicker than the
  // ratio Book3D uses for a standing volume.
  const thickness = pile.map((b) =>
    Math.min(38, Math.max(18, Math.round(b.pages / 14))),
  );
  const offsets = thickness.reduce<number[]>((acc, t, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + thickness[i - 1]);
    return acc;
  }, []);

  const topIndex = pile.length - 1;

  return (
    <div
      className={cn("stack3d", className)}
      style={{ "--yaw": `${yaw}deg` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="stack3d__scene">
        <div className="stack3d__ground" />

        {pile.map((book, i) => {
          const l = layout[i];
          const theme = coverTheme(book);
          return (
            <div
              key={book.id}
              className="stack3d__book"
              style={
                {
                  left: `${14 + l.x}%`,
                  top: `${20 + l.y}%`,
                  width: `${l.w}%`,
                  aspectRatio: "2 / 2.7",
                  "--t": `${thickness[i]}px`,
                  "--spine-color": theme.spine,
                  transform: `translateZ(${offsets[i]}px) rotate(${l.spin}deg)`,
                } as React.CSSProperties
              }
            >
              <div className="stack3d__edge-front" />
              <div className="stack3d__edge-side" />
              <div className="stack3d__top">
                {/* Only the top board of the top volume is fully in view, so
                    that is the only one that gets full cover detail. */}
                <CoverArt
                  book={book}
                  lang={lang}
                  size={i === topIndex ? "lg" : "md"}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(200deg, rgba(255,255,255,0.3), transparent 42%, rgba(0,0,0,0.14))",
                  }}
                />
              </div>

              {/* Ribbon marker: laid on this volume's board and therefore
                  trapped under the one above it, running out past the tail.
                  The V-notch is what reads as "ribbon" rather than "rectangle". */}
              {i === topIndex - 1 && (
                <div
                  className="absolute bg-accent"
                  style={{
                    left: "56%",
                    top: "62%",
                    width: "7.5%",
                    height: "56%",
                    transform: `translateZ(${thickness[i]}px)`,
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              )}
            </div>
          );
        })}

           
      </div>
    </div>
  );
}
