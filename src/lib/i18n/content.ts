import type { Locale } from "@/lib/i18n/config";
import type { Author, Book, Category, Subject } from "@/types";

/**
 * Choosing which language a *catalogue record* renders in.
 *
 * The interface strings come from the dictionaries; these are for the data,
 * where the two languages are not symmetrical. Every book has an English title,
 * but only Bengali books have a Bengali one, so a Bengali page naming a book
 * "Cosmos" is correct, not a gap. The rule is simply: prefer the reader's
 * language, fall back to what exists, never show an empty field.
 *
 * One helper per field rather than a generic `pick(record, field)` so the call
 * sites read as English and TypeScript can check them.
 */

function prefer(lang: Locale, bengali: string | undefined, english: string) {
  return lang === "bn" ? (bengali?.trim() || english) : english;
}

type BookLike = Pick<Book, "title" | "titleBn">;

export function bookTitle(book: BookLike, lang: Locale): string {
  return prefer(lang, book.titleBn, book.title);
}

/** The other title, when there is one worth showing as a subtitle. */
export function bookSubtitle(
  book: BookLike,
  lang: Locale,
): string | undefined {
  const primary = bookTitle(book, lang);
  const other = lang === "bn" ? book.title : book.titleBn;
  return other && other !== primary ? other : undefined;
}

export function bookDescription(
  book: Pick<Book, "description" | "descriptionBn">,
  lang: Locale,
): string {
  return prefer(lang, book.descriptionBn, book.description);
}

export function authorName(
  author: Pick<Author, "name" | "nameBn">,
  lang: Locale,
): string {
  return prefer(lang, author.nameBn, author.name);
}

/**
 * Books carry a denormalised author name, so the card and the grid can render
 * without a join. Both spellings ride along for exactly this reason.
 */
export function bookAuthorName(
  book: Pick<Book, "authorName" | "authorNameBn">,
  lang: Locale,
): string {
  return prefer(lang, book.authorNameBn, book.authorName);
}

export function authorBio(
  author: Pick<Author, "bio" | "bioBn">,
  lang: Locale,
): string {
  return prefer(lang, author.bioBn, author.bio);
}

export function categoryName(
  category: Pick<Category, "name" | "nameBn">,
  lang: Locale,
): string {
  return prefer(lang, category.nameBn, category.name);
}

export function categoryDescription(
  category: Pick<Category, "description" | "descriptionBn">,
  lang: Locale,
): string {
  return prefer(lang, category.descriptionBn, category.description);
}

export function subjectName(
  subject: Pick<Subject, "name" | "nameBn">,
  lang: Locale,
): string {
  return prefer(lang, subject.nameBn, subject.name);
}

export function subjectDescription(
  subject: Pick<Subject, "description" | "descriptionBn">,
  lang: Locale,
): string {
  return prefer(lang, subject.descriptionBn, subject.description);
}

/**
 * Bengali needs its own face and more leading than Latin (`.bn` in
 * globals.css). Returning the class from here keeps the decision in one place
 * instead of `lang === "bn" && "bn"` scattered through every component.
 */
export function textClass(lang: Locale): string | undefined {
  return lang === "bn" ? "bn" : undefined;
}

/**
 * Bengali uses its own digits, and a catalogue full of Latin numerals in an
 * otherwise Bengali page reads as untranslated. Intl does the conversion, so
 * this stays correct for grouping too (১,২৩৪).
 */
const numberFormatters: Record<Locale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US"),
  bn: new Intl.NumberFormat("bn-BD"),
};

export function formatNumberIn(n: number, lang: Locale): string {
  return numberFormatters[lang].format(n);
}

/**
 * Years are numbers that must never be grouped: `Intl` would render 1939 as
 * "1,939". Same digits as the rest of the page, no separator.
 */
const yearFormatters: Record<Locale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US", { useGrouping: false }),
  bn: new Intl.NumberFormat("bn-BD", { useGrouping: false }),
};

export function formatYearIn(year: number, lang: Locale): string {
  return yearFormatters[lang].format(year);
}

/** Compact form (4.8k / ৪.৮ হাজার) for download counts and shelf totals. */
export function formatCompactIn(n: number, lang: Locale): string {
  if (lang === "en") {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
    return `${(n / 1_000_000).toFixed(1)}M`;
  }

  // Bengali counts in thousands and lakhs, not thousands and millions.
  const bnDigits = (value: number, digits = 0) =>
    numberFormatters.bn.format(Number(value.toFixed(digits)));
  if (n < 1000) return bnDigits(n);
  if (n < 100_000) return `${bnDigits(n / 1000, n < 10_000 ? 1 : 0)} হাজার`;
  return `${bnDigits(n / 100_000, 1)} লাখ`;
}

/** Dates in the reader's own calendar formatting, fixed to UTC so SSR agrees. */
export function formatDateIn(iso: string, lang: Locale): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    lang === "bn" ? "bn-BD" : "en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );
}
