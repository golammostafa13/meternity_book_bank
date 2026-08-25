import { coverTheme, coverVariant } from "@/lib/cover-theme";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { bookAuthorName, bookTitle } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * Cover front.
 *
 * When the book has its own scanned cover (`book.coverImage`: a path in
 * `public/covers/`), that photo is painted on as the board. The generated art
 * below is the fallback for any title without a real scan, so a shelf never
 * goes blank for lack of a file; it was written that way from the start.
 *
 * The generated schemes live in `lib/cover-theme`: warm stone ground, near-black
 * ink, one hot-orange mark, the reference design's three colours, sampled so a
 * shelf of fallbacks stays in the same world. The five layouts below are all
 * cut from that vocabulary: a heavy grotesk title, hairline rules, a single
 * geometric field, and one hot-orange mark.
 */

interface CoverArtProps {
  book: Pick<
    Book,
    | "id"
    | "title"
    | "titleBn"
    | "authorName"
    | "authorNameBn"
    | "coverHue"
    | "coverImage"
  >;
  /** The cover is typeset in the reader's language, like a translated edition. */
  lang?: Locale;
  className?: string;
  /** Larger surfaces get more detail; small grid thumbs stay simple. */
  size?: "sm" | "md" | "lg";
}

export function CoverArt({
  book,
  lang = defaultLocale,
  className,
  size = "md",
}: CoverArtProps) {
  // A book's own cover wins. The scan carries the real type and colour, so it
  // is painted on as the face and the generated art beneath it is dropped; the
  // generated path stays as the fallback when no scan exists.
  if (book.coverImage) {
    return (
      <div
        className={cn(
          "relative isolate h-full w-full overflow-hidden [container-type:inline-size]",
          className,
        )}
        aria-hidden="true"
      >
        {/* Local, already-optimised WebP scans from /public: a plain <img>
            keeps these SSR-safe and works inside the 3D-transformed boards,
            where next/image's layout assumptions would fight the geometry. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={book.coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  const t = coverTheme(book);
  const variant = coverVariant(book);

  const displayTitle = bookTitle(book, lang);
  // Whether the *rendered* string is Bengali, not whether the reader is:
  // "Cosmos" on a Bengali page still needs the Latin face.
  const isBn = displayTitle === book.titleBn;

  // Type scales in container units, so one component serves a 90px grid thumb
  // and a 320px detail-page cover without a second set of styles.
  const titleSize =
    size === "lg"
      ? "text-[clamp(1.1rem,8.4cqw,2.6rem)]"
      : size === "sm"
        ? "text-[clamp(0.6rem,8cqw,0.95rem)]"
        : "text-[clamp(0.72rem,8.6cqw,1.4rem)]";

  const metaSize =
    size === "lg"
      ? "text-[clamp(0.55rem,1.9cqw,0.8rem)]"
      : "text-[clamp(0.4rem,2.9cqw,0.62rem)]";

  // On a dark cover the accent has to lift off the stock, not sink into it.
  const accent = t.light ? t.mid : "#ff7a3d";

  return (
    <div
      className={cn(
        "relative isolate h-full w-full overflow-hidden [container-type:inline-size]",
        className,
      )}
      style={{ background: t.paper }}
      aria-hidden="true"
    >
      {/* --- Layout variants -------------------------------------------- */}
      {variant === 0 && (
        <>
          {/* Head panel with an orange hairline under it. */}
          <div
            className="absolute inset-x-0 top-0 h-[34%]"
            style={{ background: t.deep }}
          />
          <div
            className="absolute inset-x-0 top-[34%] h-[1.5cqw]"
            style={{ background: accent }}
          />
        </>
      )}

      {variant === 1 && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(148deg, ${t.deep} 0%, ${t.deep} 46%, ${t.mid} 46.1%, ${t.mid} 52%, ${t.paper} 52.1%)`,
          }}
        />
      )}

      {variant === 2 && (
        <>
          <div
            className="absolute left-1/2 top-[26%] aspect-square w-[58%] -translate-x-1/2 rounded-full"
            style={{ background: t.mid }}
          />
          <div
            className="absolute left-1/2 top-[26%] aspect-square w-[58%] -translate-x-1/2 translate-y-[13%] rounded-full border-[0.9cqw]"
            style={{ borderColor: t.deep, opacity: 0.65 }}
          />
        </>
      )}

      {variant === 3 && (
        <div className="absolute inset-x-0 bottom-0 top-[46%]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute inset-x-[9%]"
              style={{
                top: `${i * 15}%`,
                height: "5.5%",
                background: i === 4 ? accent : t.mid,
                opacity: i === 4 ? 1 : 0.2 + i * 0.15,
              }}
            />
          ))}
        </div>
      )}

      {variant === 4 && (
        <>
          <div
            className="absolute inset-[5.5%] border-[0.7cqw]"
            style={{ borderColor: t.deep, opacity: 0.55 }}
          />
          {/* Single orange block, bottom-right, like the reference's bookmark. */}
          <div
            className="absolute bottom-[5.5%] right-[5.5%] h-[9%] w-[22%]"
            style={{ background: accent }}
          />
        </>
      )}

      {/* --- Type ------------------------------------------------------- */}
      {/* No imprint line: the library's own name on the face of every cover in
          the catalogue read as a watermark on the artwork rather than as a
          publisher's mark, and it is already on the page twice over. */}
      <div className="absolute inset-0 flex flex-col justify-between p-[7.5%]">
        <div className="flex flex-1 flex-col justify-center">
          <div
            className={cn(
              "text-balance font-bold leading-[1.06]",
              isBn && "leading-[1.32]",
              titleSize,
            )}
            style={{
              color: t.ink,
              fontFamily: isBn ? "var(--font-bengali)" : "var(--font-display)",
              // Optical sizing: the reference's headline is tightly tracked.
              letterSpacing: isBn ? "0" : "-0.02em",
            }}
          >
            {displayTitle}
          </div>
          {variant !== 3 && (
            <div
              className="mt-[6%] h-[0.9cqw] w-[26%]"
              style={{ background: accent }}
            />
          )}
        </div>

        <div
          className={cn("font-medium uppercase tracking-[0.14em]", metaSize)}
          style={{ color: t.ink, opacity: 0.72 }}
        >
          {bookAuthorName(book, lang)}
        </div>
      </div>

      {/* Printed-paper tooth: stops flat fills reading as CSS rectangles. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.55) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}
