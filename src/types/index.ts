/**
 * Domain types for the Maternity Book Bank catalogue.
 *
 * These shapes are the contract between the data layer and every page.
 * When the mock fixtures are swapped for Postgres, only `lib/data/*`
 * changes: these types and the components that consume them do not.
 */

export type BookStatus = "available" | "borrowed" | "damaged" | "lost";

export type BookLanguage = "bn" | "en";

export type BookFormat = "pdf" | "epub";

export interface Author {
  id: string;
  slug: string;
  name: string;
  nameBn?: string;
  bio: string;
  bioBn?: string;
  era?: string;
  bookCount: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  description: string;
  /** Bengali readers see this; falls back to `description` when absent. */
  descriptionBn?: string;
  icon: string;
  bookCount: number;
}

export interface Book {
  id: string;
  /** Human-facing accession code shown in the admin table, e.g. BK-08745. */
  code: string;
  slug: string;

  title: string;
  titleBn?: string;
  subtitle?: string;

  authorId: string;
  authorName: string;
  authorNameBn?: string;

  categoryId: string;
  categoryName: string;

  publisher: string;
  year: number;
  language: BookLanguage;
  /**
   * ISBN-13 or equivalent accession reference. Optional: four of the twenty
   * real titles have no readable ISBN; a fabricated one on a downloadable file
   * is worse than none. The detail page hides the row when absent.
   */
  isbn?: string;
  /** Edition label as printed, e.g. "Twenty-second edition" or "8th". */
  edition?: string;
  pages: number;

  description: string;
  descriptionBn?: string;

  /**
   * Where this file came from, and on what terms.
   *
   * Every title in this collection is somebody else's publication, redistributed
   * under an open licence: WHO's material is CC BY-NC-SA 3.0 IGO, the
   * government handbooks are Crown or provincial copyright with permission to
   * reproduce. Those licences allow this and *require* attribution, so the
   * attribution is a field on the record rather than a line in a footer: a book
   * that arrives without one is a book that cannot be shown, which is the
   * behaviour we want.
   *
   * Optional only because the admin form can catalogue a book before its
   * paperwork is known. The detail page hides the row when absent.
   */
  sourceUrl?: string;
  license?: string;

  /** Physical-inventory fields: these drive the admin table columns. */
  status: BookStatus;
  copiesTotal: number;
  copiesAvailable: number;
  shelf: string;

  /**
   * Base hue (degrees) for the generated cover art when no real cover exists.
   * The 3D spine and the search index both read this, so it is always present
   * even when `coverImage` is set.
   */
  coverHue: number;

  /**
   * Path to the real cover image served from `public/covers/`, e.g.
   * `/covers/nelson-textbook-of-pediatrics.webp`. When present, `CoverArt`
   * renders this instead of the generated art. When absent, the generated art
   * is used as before.
   */
  coverImage?: string;

  /** File metadata. `fileUrl` points at R2 in production. */
  format: BookFormat;
  fileSizeMb: number;
  fileUrl: string;

  downloads: number;
  rating: number;
  featured: boolean;

  /**
   * Standing order, low first. Absent on almost every book.
   *
   * The library has three cornerstone references — *Williams Obstetrics*,
   * *Williams Gynecology* and *Gabbe's* — and they are meant to be the first
   * thing a reader meets, on every shelf, under every sort. `featured` cannot
   * say that: it is a boolean, so it can mark a book as important but not say
   * which important book comes first, and it is a curator's flag that the
   * admin form lets anyone toggle.
   *
   * So this is a separate, ordered field, and the data layer applies it as the
   * primary sort key on *every* ordering it returns — recent, popular, title,
   * year, related, the shelves, the search index. A sort the reader chose still
   * happens; it just happens below these three. See `lib/data/books`.
   */
  priority?: number;

  addedAt: string;
  uploadedBy: string;
}

/**
 * What the admin actually supplies when cataloguing a book. Everything else on
 * `Book` (accession code, slug, shelf position, counters) is derived by the
 * data layer, so two librarians can never disagree about the format of a code.
 */
export interface NewBookInput {
  title: string;
  titleBn?: string;
  authorId: string;
  categoryId: string;
  publisher: string;
  year: number;
  language: BookLanguage;
  /** Optional: a title with no readable ISBN leaves this absent. */
  isbn?: string;
  /** Edition label, e.g. "9th" or "Twenty-second edition". */
  edition?: string;
  /**
   * Served path to a real cover image, e.g. `/covers/<slug>.webp`.
   * Set by the seed / build script, not by the admin form.
   */
  coverImage?: string;
  pages: number;
  description: string;
  descriptionBn?: string;
  status: BookStatus;
  copiesTotal: number;
  format: BookFormat;
  fileSizeMb: number;
  featured: boolean;
  /** Cover scheme seed. See `lib/cover-theme`. */
  coverHue: number;
}

export interface NewAuthorInput {
  name: string;
  nameBn?: string;
  bio: string;
  bioBn?: string;
  era?: string;
}

export interface NewCategoryInput {
  name: string;
  nameBn: string;
  description: string;
  descriptionBn?: string;
  icon: string;
}

export interface CatalogueQuery {
  q?: string;
  category?: string;
  language?: BookLanguage;
  status?: BookStatus;
  sort?: "recent" | "popular" | "title" | "year";
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
