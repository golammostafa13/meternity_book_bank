import Link from "next/link";
import { coverTheme } from "@/lib/cover-theme";
import { defaultLocale, localePath, type Locale } from "@/lib/i18n/config";
import { bookTitle } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

type BookLike = Pick<
  Book,
  "id" | "slug" | "title" | "titleBn" | "coverHue" | "pages"
>;

/**
 * A row of spines standing on a plank.
 *
 * The catalogue's second physical form: where `Book3D` shows one volume face
 * on, this shows a collection as a collection, which is what a category, an
 * author's body of work, or "recently shelved" in the admin actually is.
 *
 * Spine width tracks page count, so a shelf has real rhythm rather than
 * evenly spaced bars. Geometry lives in `.shelf3d` in globals.css.
 */

export function Shelf3D({
  books,
  lang = defaultLocale,
  className,
  height = 78,
  linked = true,
}: {
  books: BookLike[];
  lang?: Locale;
  className?: string;
  /** Height of the tallest spine, px. Shorter shelves drop the spine type. */
  height?: number;
  /** Whether each spine links to its book. Off inside another link. */
  linked?: boolean;
}) {
  const showType = height >= 66;

  return (
    <div className={cn("shelf3d", className)}>
      <div className="shelf3d__row">
        {books.map((book, i) => {
          const theme = coverTheme(book);
          const thickness = Math.min(
            22,
            Math.max(9, Math.round(book.pages / 26)),
          );
          // Volumes in a real row are not trimmed to the same height.
          const h = height - ((i * 7) % 3) * 5;

          const label = showType && thickness >= 13 && (
            <span
              className="flex h-full w-full items-center justify-center overflow-hidden"
              style={{ writingMode: "vertical-rl" }}
            >
              <span
                className="truncate text-[7px] font-semibold uppercase tracking-wider"
                style={{
                  color: theme.spineInk,
                  opacity: 0.85,
                  maxHeight: "84%",
                }}
              >
                {bookTitle(book, lang)}
              </span>
            </span>
          );

          // Barrel shading across the spine: shadowed at the gutter side, a
          // lit band where the round of the spine catches the light, then back
          // to stock. Percentages stay ≤ 100: color-mix rejects anything
          // above and silently drops the whole gradient.
          const style = {
            width: `${thickness}px`,
            height: `${h}px`,
            background: `linear-gradient(to right, color-mix(in srgb, ${theme.spine} 62%, #000), color-mix(in srgb, ${theme.spine} 84%, #fff) 46%, ${theme.spine})`,
          };

          // The spine element itself is the link when there is one, so the
          // focus ring lands on the object rather than on a zero-size box.
          return linked ? (
            <Link
              key={book.id}
              href={localePath(lang, `/books/${book.slug}`)}
              aria-label={bookTitle(book, lang)}
              className="shelf3d__spine block"
              style={style}
            >
              {label}
            </Link>
          ) : (
            <span
              key={book.id}
              className="shelf3d__spine block"
              style={style}
            >
              {label}
            </span>
          );
        })}
      </div>
      <div className="shelf3d__plank" aria-hidden="true" />
    </div>
  );
}
