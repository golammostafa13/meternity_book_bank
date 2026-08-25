import Link from "next/link";
import { Book3D } from "@/components/book-3d";
import { localePath, type Locale } from "@/lib/i18n/config";
import { bookAuthorName, bookTitle, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * A grid of standing 3D books.
 *
 * Each cell is: a 3D volume that turns toward the reader on hover, a title
 * below it, and an author line. The whole cell is a link to the detail page.
 * No card chrome, no buttons: the book is the primary object and the name
 * below it is the caption, exactly like a physical shelf label.
 */

type BookLike = Pick<
  Book,
  | "id"
  | "slug"
  | "title"
  | "titleBn"
  | "authorName"
  | "authorNameBn"
  | "coverHue"
  | "coverImage"
  | "pages"
  | "featured"
>;

export function BookGrid3D({
  books,
  lang,
  sectionLabel,
  className,
}: {
  books: BookLike[];
  lang: Locale;
  /** Optional heading above the grid, e.g. "Featured Books". */
  sectionLabel?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {sectionLabel && (
        <p
          className={cn(
            "mb-8 text-sm font-semibold uppercase tracking-[0.22em] text-accent",
            textClass(lang),
          )}
        >
          {sectionLabel}
        </p>
      )}

      <div className="book-grid-3d">
        {books.map((book, i) => {
          const title = bookTitle(book, lang);
          const href = localePath(lang, `/books/${book.slug}`);

          return (
            <Link
              key={book.id}
              href={href}
              className="book-grid-3d__cell"
              style={{ "--lag": Math.min(i, 11) * 3 } as React.CSSProperties}
              aria-label={title}
            >
              {/* The 3D volume: hover effect comes from .book3d CSS */}
              <div className="book-grid-3d__vol">
                <Book3D
                  book={book}
                  lang={lang}
                  size="md"
                  angle={-20}
                  hoverAngle={-4}
                  className="w-full"
                />
              </div>

              {/* Label below the book */}
              <div className="book-grid-3d__label">
                <span
                  className={cn(
                    "book-grid-3d__title",
                    textClass(lang),
                  )}
                >
                  {title}
                </span>
                <span
                  className={cn(
                    "book-grid-3d__author",
                    textClass(lang),
                  )}
                >
                  {bookAuthorName(book, lang)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
