import { CoverArt } from "@/components/cover-art";
import { coverTheme } from "@/lib/cover-theme";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { bookTitle } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * A book rendered as a physical object: front board, spine, fore-edge page
 * block, head and tail, assembled with CSS 3D transforms (see `.book3d` in
 * globals.css for the geometry).
 *
 * Deliberately zero-JS and library-free. A WebGL equivalent would look
 * marginally richer but costs ~600KB and would blow the INP/LCP budget the
 * SEO goal depends on. All the transform work here is GPU-composited and
 * fully disabled under `prefers-reduced-motion`.
 */

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

interface Book3DProps {
  book: BookLike;
  /** Which language the cover and spine are set in. */
  lang?: Locale;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Resting rotation, degrees. Less rotation reads as more "on-shelf". */
  angle?: number;
  /** Rotation on hover/focus: the book turns to face the reader. */
  hoverAngle?: number;
  /** Scales the physical thickness. Small thumbs need a chunkier ratio to read. */
  depthScale?: number;
  /**
   * The product-shot grade: a travelling specular, a deeper contact shadow
   * and a floor reflection. For the two places one volume is the subject of
   * the screen, and deliberately not for a grid of twelve.
   */
  showcase?: boolean;
}

export function Book3D({
  book,
  lang = defaultLocale,
  className,
  size = "md",
  angle = -22,
  hoverAngle = -6,
  depthScale = 1,
  showcase = false,
}: Book3DProps) {
  /**
   * How thick the volume is, as a share of its own rendered width rather than
   * in pixels.
   *
   * In pixels it could only ever be right at one size. The same 26px of depth
   * is a chunky paperback on a 140px thumbnail and a pamphlet on a 330px
   * spotlight, which is exactly what went wrong: the showcase volumes read as
   * flat covers with an edge rather than as books. A share of the width holds
   * whatever size the book is drawn at, and `100cqw` in the stylesheet is what
   * resolves it (see `--depth` under `.book3d`).
   *
   * The range is drawn from real books and then pushed, deliberately. A
   * 200-page A4 handbook is about 6% of its own width across the fore-edge
   * and that is what was here first; the trouble is that only a fraction of
   * the thickness is ever on screen, because the block is a face seen almost
   * edge on. At 6% the fore-edge of a 245px volume is five pixels of paper,
   * which reads as a printed cover with a line down one side rather than as a
   * book with a body. These numbers put nine to sixteen pixels of block on
   * screen at the sizes this is actually drawn at, which is the difference
   * between an object and a picture of one, and the page count still decides
   * where in the range each book sits.
   */
  const thickness =
    Math.min(0.24, Math.max(0.1, book.pages / 1500)) * depthScale;
  const theme = coverTheme(book);

  return (
    <div
      className={cn("book3d", showcase && "book3d--showcase", className)}
      style={
        {
          "--thick": thickness.toFixed(4),
          "--ry": `${angle}deg`,
          "--ry-hover": `${hoverAngle}deg`,
          "--spine-color": theme.spine,
        } as React.CSSProperties
      }
    >
      <div className="book3d__inner">
        <div className="book3d__head" />
        <div className="book3d__tail" />

        <div className="book3d__spine">
          {/* Vertical spine type, like the real thing. Titles longer than the
              spine are clipped rather than shrunk, same as a real binding. */}
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ writingMode: "vertical-rl" }}
          >
            <span
              className="truncate px-1 text-[8px] font-semibold uppercase tracking-widest"
              style={{ maxHeight: "82%", color: theme.spineInk, opacity: 0.9 }}
            >
              {bookTitle(book, lang)}
            </span>
          </div>
        </div>

        <div className="book3d__pages" />

        <div className="book3d__face">
          <CoverArt book={book} lang={lang} size={size} />
          <div className="book3d__glare" />
          <div className="book3d__hinge" />
          <div className="book3d__lip" />
        </div>

        <div className="book3d__shadow" />
      </div>
    </div>
  );
}
