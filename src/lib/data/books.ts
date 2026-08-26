import fs from "fs";
import path from "path";
import {
  books,
  authors,
  bookFiles,
  categories,
  sampleFileName,
  shelfPrefix,
  subjects,
} from "@/lib/fixtures/catalogue";
import type {
  Author,
  Book,
  BookStatus,
  CatalogueQuery,
  Category,
  NewAuthorInput,
  NewBookInput,
  NewCategoryInput,
  Paginated,
  Subject,
} from "@/types";

/**
 * The single seam between pages and the catalogue store.
 *
 * Every function is async and returns plain typed objects, so replacing the
 * fixture import with a Postgres query changes this file only: no page or
 * component needs to be touched. Components must never import fixtures directly.
 */

const DEFAULT_PER_PAGE = 12;

/**
 * The standing order.
 *
 * Three books in this library are the reference the others are guidance from —
 * the *Johns Hopkins Manual*, *Obstetric Decisions* and *Te Linde's* — and they
 * are meant to be met first, on every shelf and under every sort.
 * `Book.priority` numbers them; everything without one sorts equal, below all
 * three.
 *
 * It is a *primary* key, not a replacement: `byPriority(a, b) || <whatever the
 * reader asked for>` keeps their chosen sort intact underneath. Every ordering
 * this file returns goes through it, which is the point — a rail that quietly
 * dropped the three because it happened to sort by download count would be the
 * bug this is here to prevent.
 */
const LAST = Number.MAX_SAFE_INTEGER;

function byPriority(a: Book, b: Book): number {
  return (a.priority ?? LAST) - (b.priority ?? LAST);
}

/** Sorted copy, priority first, then `compare`. Never mutates the input. */
function ordered<T extends Book>(
  rows: readonly T[],
  compare: (a: T, b: T) => number,
): T[] {
  return [...rows].sort((a, b) => byPriority(a, b) || compare(a, b));
}

/** The catalogue's own order, priority first: the default for a plain list. */
function inShelfOrder<T extends Book>(rows: readonly T[]): T[] {
  return ordered(rows, () => 0);
}

function normalise(value: string): string {
  return value.toLowerCase().normalize("NFC");
}

/** Matches Latin and Bengali alike: no ASCII-only assumptions. */
function matches(book: Book, q: string): boolean {
  const needle = normalise(q);
  return [
    book.title,
    book.titleBn ?? "",
    book.authorName,
    book.authorNameBn ?? "",
    book.publisher,
    book.categoryName,
    book.subjectName,
    book.isbn ?? "",
    book.code,
  ].some((field) => normalise(field).includes(needle));
}

export async function getBooks(
  query: CatalogueQuery = {},
): Promise<Paginated<Book>> {
  const {
    q,
    category,
    subject,
    language,
    status,
    sort = "recent",
    page = 1,
    perPage = DEFAULT_PER_PAGE,
  } = query;

  let rows = [...books];

  if (q?.trim()) rows = rows.filter((b) => matches(b, q.trim()));
  if (category) rows = rows.filter((b) => b.categoryId === category);
  if (subject) rows = rows.filter((b) => b.subjectId === subject);
  if (language) rows = rows.filter((b) => b.language === language);
  if (status) rows = rows.filter((b) => b.status === status);

  // The reader's sort, underneath the standing order. A book they asked to see
  // by title is still in title order; the three references are simply above it.
  rows = ordered(rows, (a, b) => {
    switch (sort) {
      case "popular":
        return b.downloads - a.downloads;
      case "title":
        return a.title.localeCompare(b.title);
      case "year":
        return b.year - a.year;
      default:
        return b.addedAt.localeCompare(a.addedAt);
    }
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: rows.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  };
}

export async function getAllBooks(): Promise<Book[]> {
  return inShelfOrder(books);
}

export async function getBook(slug: string): Promise<Book | null> {
  return books.find((b) => b.slug === slug) ?? null;
}

export async function getBookById(id: string): Promise<Book | null> {
  return books.find((b) => b.id === id) ?? null;
}

/**
 * Where a book's file actually is, and what to call it once it is handed over.
 *
 * Server-only by intent: this is the one fact about a book that never travels
 * to the browser, which is why it is not a field on `Book`. Only the route
 * handler at `/api/file/[slug]` asks for it, and only after it has satisfied
 * itself that whoever is asking has an account.
 *
 * Returns null for a book that does not exist. A book that does but has no
 * file of its own falls back to the sample, exactly as `fileSizeMb` and the
 * rest of the demo metadata do.
 */
export async function getBookFile(slug: string): Promise<{
  /** Name in private storage: never a path, so a slug cannot escape it. */
  storageName: string;
  /** What the reader's browser should save it as. */
  downloadName: string;
  format: Book["format"];
} | null> {
  const book = await getBook(slug);
  if (!book) return null;

  const storageName = bookFiles[book.slug] ?? sampleFileName;
  return {
    storageName,
    downloadName: `${book.slug}.${book.format}`,
    format: book.format,
  };
}

export async function getFeatured(limit = 6): Promise<Book[]> {
  return inShelfOrder(books.filter((b) => b.featured)).slice(0, limit);
}

export async function getRecent(limit = 8): Promise<Book[]> {
  return ordered(books, (a, b) => b.addedAt.localeCompare(a.addedAt)).slice(
    0,
    limit,
  );
}

export async function getPopular(limit = 8): Promise<Book[]> {
  return ordered(books, (a, b) => b.downloads - a.downloads).slice(0, limit);
}

/** Same author first, then same category: enough for a demo "related" rail. */
export async function getRelated(book: Book, limit = 4): Promise<Book[]> {
  const sameAuthor = books.filter(
    (b) => b.authorId === book.authorId && b.id !== book.id,
  );
  const sameCategory = books.filter(
    (b) =>
      b.categoryId === book.categoryId &&
      b.id !== book.id &&
      b.authorId !== book.authorId,
  );
  // Priority applies within each group rather than across them: a reader on a
  // WHO guideline is better served by its own author's other volumes than by
  // being sent to the textbook every rail on the site already offers.
  return [
    ...inShelfOrder(sameAuthor),
    ...inShelfOrder(sameCategory),
  ].slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  return [...categories];
}

export interface CategoryShelf extends Category {
  /** A handful of volumes to draw the category's shelf with. */
  shelf: Book[];
}

/**
 * Categories with enough books attached to render each one as a physical
 * shelf. Pages ask for the shape they display rather than assembling it
 * themselves, which keeps the Postgres swap confined to this file.
 */
export async function getCategoryShelves(
  perCategory = 8,
): Promise<CategoryShelf[]> {
  return categories.map((c) => ({
    ...c,
    shelf: ordered(
      books.filter((b) => b.categoryId === c.id),
      (a, b) => b.downloads - a.downloads,
    ).slice(0, perCategory),
  }));
}

export async function getCategory(slug: string): Promise<Category | null> {
  return categories.find((c) => c.slug === slug) ?? null;
}

/**
 * Subjects: the clinical axis. Mirrors the category helpers above exactly,
 * because the two taxonomies are peers — neither is the "real" one with the
 * other bolted on, and the pages that render them are the same shape.
 */
export async function getSubjects(): Promise<Subject[]> {
  return [...subjects];
}

export interface SubjectShelf extends Subject {
  /** A handful of volumes to draw the subject's shelf with. */
  shelf: Book[];
}

export async function getSubjectShelves(
  perSubject = 8,
): Promise<SubjectShelf[]> {
  return subjects.map((s) => ({
    ...s,
    shelf: ordered(
      books.filter((b) => b.subjectId === s.id),
      (a, b) => b.downloads - a.downloads,
    ).slice(0, perSubject),
  }));
}

export async function getSubject(slug: string): Promise<Subject | null> {
  return subjects.find((s) => s.slug === slug) ?? null;
}

export async function getBooksBySubject(subjectId: string): Promise<Book[]> {
  return inShelfOrder(books.filter((b) => b.subjectId === subjectId));
}

export async function getAuthors(): Promise<Author[]> {
  return [...authors];
}

export interface AuthorShelf extends Author {
  /** A few volumes to draw this author's shelf with. */
  shelf: Book[];
}

export async function getAuthorShelves(
  perAuthor = 6,
): Promise<AuthorShelf[]> {
  return authors.map((a) => ({
    ...a,
    shelf: ordered(
      books.filter((b) => b.authorId === a.id),
      (x, y) => y.downloads - x.downloads,
    ).slice(0, perAuthor),
  }));
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return authors.find((a) => a.slug === slug) ?? null;
}

export async function getAuthorById(id: string): Promise<Author | null> {
  return authors.find((a) => a.id === id) ?? null;
}

export async function getBooksByAuthor(authorId: string): Promise<Book[]> {
  return inShelfOrder(books.filter((b) => b.authorId === authorId));
}

export async function getBooksByCategory(categoryId: string): Promise<Book[]> {
  return inShelfOrder(books.filter((b) => b.categoryId === categoryId));
}

export interface CatalogueStats {
  totalBooks: number;
  totalAuthors: number;
  totalCategories: number;
  totalSubjects: number;
  totalDownloads: number;
  available: number;
  borrowed: number;
  damaged: number;
  lost: number;
}

export async function getStats(): Promise<CatalogueStats> {
  return {
    totalBooks: books.length,
    totalAuthors: authors.length,
    totalCategories: categories.length,
    totalSubjects: subjects.length,
    totalDownloads: books.reduce((sum, b) => sum + b.downloads, 0),
    available: books.filter((b) => b.status === "available").length,
    borrowed: books.filter((b) => b.status === "borrowed").length,
    damaged: books.filter((b) => b.status === "damaged").length,
    lost: books.filter((b) => b.status === "lost").length,
  };
}

/**
 * Lightweight index shipped to the client for instant search.
 * In production this is generated into R2 on book upload rather than
 * derived at request time: the shape stays identical.
 */
export interface SearchDoc {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  author: string;
  /** Both spellings are indexed, so "Tagore" and "ঠাকুর" both find the book. */
  authorBn: string;
  category: string;
  categoryBn: string;
  /** The clinical axis, indexed too: "gynecology" has to find the shelf. */
  subject: string;
  subjectBn: string;
  year: number;
  coverHue: number;
  coverImage?: string;
}

/* ---------------------------------------------------------------------------
   Writes.

   In production every function below is a single Postgres statement, and the
   file bytes have already been PUT to R2 by a presigned upload before the row
   is written (see the architecture brief: "books never touch a build"). Here
   they mutate the fixture arrays in place, which means the demo store is
   per-process and resets when the dev server restarts: deliberate, because a
   demo that pretends to persist is worse than one that admits it doesn't.

   Authorisation is *not* handled here. It belongs at the edge (Cloudflare
   Access in front of /admin) and is re-checked in the Server Actions that call
   these: a data-layer function has no idea who is calling it.
--------------------------------------------------------------------------- */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slugs are the public URL, so a collision has to be resolved, not ignored. */
function uniqueSlug(base: string): string {
  const root = base || "untitled";
  if (!books.some((b) => b.slug === root)) return root;
  let n = 2;
  while (books.some((b) => b.slug === `${root}-${n}`)) n++;
  return `${root}-${n}`;
}

function nextAccessionCode(): string {
  const highest = books.reduce((max, b) => {
    const n = Number(b.code.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 8000);
  return `BK-${String(highest + 37).padStart(5, "0")}`;
}

const COVERS_DIR = path.join(process.cwd(), "public", "covers");

function writeCoverImage(slug: string, base64Data: string): string {
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid cover image data");
  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `${slug}.${ext}`;
  const filepath = path.join(COVERS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/covers/${filename}`;
}

function deleteCoverImage(coverImage?: string): void {
  if (!coverImage) return;
  const filename = path.basename(coverImage);
  const filepath = path.join(COVERS_DIR, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

export async function insertBook(input: NewBookInput): Promise<Book> {
  const author = authors.find((a) => a.id === input.authorId);
  const category = categories.find((c) => c.id === input.categoryId);
  const subject = subjects.find((s) => s.id === input.subjectId);
  if (!author) throw new Error(`Unknown author: ${input.authorId}`);
  if (!category) throw new Error(`Unknown category: ${input.categoryId}`);
  if (!subject) throw new Error(`Unknown subject: ${input.subjectId}`);

  const seq = books.length + 1;
  // Hoisted: the file's address is built from it too, and the two must not be
  // allowed to disagree.
  const slug = uniqueSlug(slugify(input.title));

  let coverImage = input.coverImage;
  if (coverImage && coverImage.startsWith("data:")) {
    coverImage = writeCoverImage(slug, coverImage);
  }

  const book: Book = {
    id: `bk-${String(seq).padStart(3, "0")}-${Date.now().toString(36)}`,
    code: nextAccessionCode(),
    slug,
    title: input.title,
    titleBn: input.titleBn || undefined,
    authorId: author.id,
    authorName: author.name,
    authorNameBn: author.nameBn,
    categoryId: category.id,
    categoryName: category.name,
    subjectId: subject.id,
    subjectName: subject.name,
    publisher: input.publisher,
    year: input.year,
    language: input.language,
    isbn: input.isbn,
    pages: input.pages,
    description: input.description,
    descriptionBn: input.descriptionBn || undefined,
    status: input.status,
    copiesTotal: input.copiesTotal,
    copiesAvailable: input.status === "available" ? input.copiesTotal : 0,
    shelf: `${shelfPrefix[category.id] ?? "F0-MISC"}-SH${(seq % 6) + 1}-R${
      (seq % 4) + 1
    }-P${String((seq % 12) + 1).padStart(2, "0")}`,
    coverHue: input.coverHue,
    coverImage,
    format: input.format,
    fileSizeMb: input.fileSizeMb,
    // Until R2 is wired up every book streams the same sample file, but it
    // streams it through the gate like every other book, so a new record is
    // no more downloadable to a stranger than an old one.
    fileUrl: `/api/file/${slug}`,
    downloads: 0,
    rating: 0,
    featured: input.featured,
    addedAt: new Date().toISOString().slice(0, 10),
    uploadedBy: "Apu Roy",
  };

  books.unshift(book);
  category.bookCount += 1;
  subject.bookCount += 1;
  author.bookCount += 1;
  return book;
}

export async function updateBook(
  id: string,
  input: NewBookInput,
): Promise<Book | null> {
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const previous = books[index];
  const author = authors.find((a) => a.id === input.authorId);
  const category = categories.find((c) => c.id === input.categoryId);
  const subject = subjects.find((s) => s.id === input.subjectId);
  if (!author || !category || !subject) return null;

  // Moving a book between shelves or writers has to move the counts with it.
  if (previous.categoryId !== category.id) {
    const old = categories.find((c) => c.id === previous.categoryId);
    if (old) old.bookCount -= 1;
    category.bookCount += 1;
  }
  if (previous.subjectId !== subject.id) {
    const old = subjects.find((s) => s.id === previous.subjectId);
    if (old) old.bookCount -= 1;
    subject.bookCount += 1;
  }
  if (previous.authorId !== author.id) {
    const old = authors.find((a) => a.id === previous.authorId);
    if (old) old.bookCount -= 1;
    author.bookCount += 1;
  }

  let coverImage = input.coverImage;
  if (coverImage && coverImage.startsWith("data:")) {
    if (previous.coverImage) deleteCoverImage(previous.coverImage);
    coverImage = writeCoverImage(previous.slug, coverImage);
  } else if (!coverImage && previous.coverImage) {
    deleteCoverImage(previous.coverImage);
  }

  const next: Book = {
    ...previous,
    ...input,
    titleBn: input.titleBn || undefined,
    descriptionBn: input.descriptionBn || undefined,
    authorName: author.name,
    authorNameBn: author.nameBn,
    categoryName: category.name,
    subjectName: subject.name,
    coverImage,
    // The slug is a published URL: it only follows a retitle if nothing links
    // to the old one yet, which for a demo means "never".
    slug: previous.slug,
    copiesAvailable:
      input.status === "available"
        ? Math.min(previous.copiesAvailable || input.copiesTotal, input.copiesTotal)
        : 0,
  };

  books[index] = next;
  return next;
}

export async function setBookStatus(
  id: string,
  status: BookStatus,
): Promise<Book | null> {
  const book = books.find((b) => b.id === id);
  if (!book) return null;
  book.status = status;
  book.copiesAvailable = status === "available" ? book.copiesTotal : 0;
  return book;
}

export async function deleteBook(id: string): Promise<boolean> {
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return false;

  const [removed] = books.splice(index, 1);
  const category = categories.find((c) => c.id === removed.categoryId);
  const subject = subjects.find((s) => s.id === removed.subjectId);
  const author = authors.find((a) => a.id === removed.authorId);
  if (category) category.bookCount -= 1;
  if (subject) subject.bookCount -= 1;
  if (author) author.bookCount -= 1;
  return true;
}

export async function insertAuthor(input: NewAuthorInput): Promise<Author> {
  const author: Author = {
    id: `au-${slugify(input.name)}-${Date.now().toString(36)}`,
    slug: slugify(input.name),
    name: input.name,
    nameBn: input.nameBn || undefined,
    bio: input.bio,
    bioBn: input.bioBn || undefined,
    era: input.era || undefined,
    bookCount: 0,
  };
  authors.push(author);
  return author;
}

export async function insertCategory(
  input: NewCategoryInput,
): Promise<Category> {
  const category: Category = {
    id: `cat-${slugify(input.name)}`,
    slug: slugify(input.name),
    name: input.name,
    nameBn: input.nameBn,
    description: input.description,
    descriptionBn: input.descriptionBn || undefined,
    icon: input.icon,
    bookCount: 0,
  };
  categories.push(category);
  return category;
}

/**
 * Storage headroom. The architecture brief keeps the whole catalogue inside
 * R2's 10 GB free tier, so this is a number the librarian genuinely needs on
 * screen rather than a dashboard ornament.
 */
export interface StorageUsage {
  usedMb: number;
  quotaMb: number;
  percent: number;
  averageMb: number;
}

export async function getStorageUsage(): Promise<StorageUsage> {
  const usedMb = books.reduce((sum, b) => sum + b.fileSizeMb, 0);
  const quotaMb = 10 * 1024;
  return {
    usedMb: Math.round(usedMb * 10) / 10,
    quotaMb,
    percent: Math.min(100, (usedMb / quotaMb) * 100),
    averageMb: books.length ? Math.round((usedMb / books.length) * 10) / 10 : 0,
  };
}

export async function getSearchIndex(): Promise<SearchDoc[]> {
  // Ordered, even though MiniSearch ranks a query by relevance: the search page
  // shows this list as-is before anything is typed.
  return inShelfOrder(books).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    titleBn: b.titleBn ?? "",
    author: b.authorName,
     authorBn: b.authorNameBn ?? "",
     category: b.categoryName,
     categoryBn:
       categories.find((c) => c.id === b.categoryId)?.nameBn ?? b.categoryName,
     subject: b.subjectName,
     subjectBn:
       subjects.find((x) => x.id === b.subjectId)?.nameBn ?? b.subjectName,
     year: b.year,
     coverHue: b.coverHue,
     coverImage: b.coverImage,
   }));
}
