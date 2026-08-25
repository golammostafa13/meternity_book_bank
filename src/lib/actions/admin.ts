"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current";
import { getDictionaryFor, localePath, type Dictionary } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n/config";
import {
  deleteBook,
  insertAuthor,
  insertBook,
  insertCategory,
  setBookStatus,
  updateBook,
} from "@/lib/data/books";

/**
 * Admin mutations.
 *
 * Server Actions are reachable by direct POST, not only through the UI, so
 * every one of these validates its input from scratch, none of them trusts a
 * hidden field, and every one re-checks the session. The route guard in
 * `proxy.ts` protects navigation; it does not protect endpoints, so the check
 * here is the one that actually matters.
 *
 * Revalidation is explicit and narrow. A new book has to invalidate the
 * catalogue, its own page and the admin table, but nothing else, because the
 * whole 100k-visitors/minute plan rests on the rest of the cache staying warm.
 */

/** Throws for anyone who is not the signed-in librarian. */
async function assertLibrarian(): Promise<void> {
  await requireAdmin();
}

/**
 * Which language to answer in.
 *
 * Server Actions cannot read route params, so every admin form posts the locale
 * it was rendered in. Validated rather than trusted; anything unrecognised falls
 * back to the default language.
 */
function localeOf(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

export interface ActionState {
  ok: boolean;
  message?: string;
  /** Field name → first error. Field-level, so the form can render inline. */
  errors?: Record<string, string>;
}

/**
 * Built per request from the dictionary, so a Bengali librarian is corrected in
 * Bengali. The rules themselves are identical in both languages: only the
 * messages differ.
 */
function bookSchema(dict: Dictionary) {
  const e = dict.admin.errors;
  return z.object({
    title: z.string().trim().min(2, e.title),
    titleBn: z.string().trim().optional(),
    authorId: z.string().trim().min(1, e.author),
    categoryId: z.string().trim().min(1, e.category),
    publisher: z.string().trim().min(2, e.publisher),
    year: z.coerce
      .number()
      .int(e.yearInt)
      .min(1400, e.yearMin)
      .max(new Date().getFullYear(), e.yearMax),
    language: z.enum(["bn", "en"]),
    isbn: z.string().trim().min(6, e.isbn),
    pages: z.coerce.number().int().min(1, e.pagesMin).max(20000, e.pagesMax),
    description: z
      .string()
      .trim()
      .min(20, e.descriptionShort)
      .max(4000, e.descriptionLong),
    descriptionBn: z.string().trim().max(4000).optional(),
    status: z.enum(["available", "borrowed", "damaged", "lost"]),
    copiesTotal: z.coerce
      .number()
      .int()
      .min(1, e.copiesMin)
      .max(999, e.copiesMax),
    format: z.enum(["pdf", "epub"]),
    fileSizeMb: z.coerce
      .number()
      .min(0.1, e.fileSizeMin)
      // 10 GB is the whole R2 free tier; a single file near it is a mistake.
      .max(512, e.fileSizeMax),
    featured: z.coerce.boolean(),
    coverHue: z.coerce.number().int().min(0).max(359),
    coverImage: z.string().trim().optional(),
  });
}

/** Turns a ZodError into the flat field→message map the forms render. */
function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function readBookForm(formData: FormData, dict: Dictionary) {
  return bookSchema(dict).safeParse({
    title: formData.get("title"),
    titleBn: formData.get("titleBn") ?? undefined,
    authorId: formData.get("authorId"),
    categoryId: formData.get("categoryId"),
    publisher: formData.get("publisher"),
    year: formData.get("year"),
    language: formData.get("language"),
    isbn: formData.get("isbn"),
    pages: formData.get("pages"),
    description: formData.get("description"),
    descriptionBn: formData.get("descriptionBn") ?? undefined,
    status: formData.get("status"),
    copiesTotal: formData.get("copiesTotal"),
    format: formData.get("format"),
    fileSizeMb: formData.get("fileSizeMb"),
    // An unchecked checkbox sends nothing at all.
    featured: formData.get("featured") === "on",
    coverHue: formData.get("coverHue"),
    coverImage: formData.get("coverImage") ? String(formData.get("coverImage")) : undefined,
  });
}

/**
 * Every surface a book appears on, in every language. Cheaper to list than to
 * over-revalidate, and forgetting the other locale is exactly the bug that
 * makes a translated site drift.
 */
function revalidateCatalogue(slug?: string) {
  for (const lang of locales) {
    revalidatePath(localePath(lang));
    revalidatePath(localePath(lang, "/books"));
    revalidatePath(localePath(lang, "/categories"));
    revalidatePath(localePath(lang, "/authors"));
    revalidatePath(localePath(lang, "/admin"));
    revalidatePath(localePath(lang, "/admin/books"));
    if (slug) revalidatePath(localePath(lang, `/books/${slug}`));
  }
}

export async function createBookAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLibrarian();
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);

  const parsed = readBookForm(formData, dict);
  if (!parsed.success) {
    return {
      ok: false,
      message: dict.admin.messages.needsAttention,
      errors: fieldErrors(parsed.error),
    };
  }

  const book = await insertBook(parsed.data);
  revalidateCatalogue(book.slug);

  return {
    ok: true,
    message: fill(lang, dict.admin.messages.created, {
      title: book.title,
      code: book.code,
    }),
  };
}

export async function updateBookAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLibrarian();
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: dict.admin.messages.missingId };

  const parsed = readBookForm(formData, dict);
  if (!parsed.success) {
    return {
      ok: false,
      message: dict.admin.messages.needsAttention,
      errors: fieldErrors(parsed.error),
    };
  }

  const book = await updateBook(id, parsed.data);
  if (!book) return { ok: false, message: dict.admin.messages.gone };

  revalidateCatalogue(book.slug);
  return { ok: true, message: dict.admin.messages.saved };
}

const statusSchema = z.enum(["available", "borrowed", "damaged", "lost"]);

export async function setBookStatusAction(formData: FormData): Promise<void> {
  await assertLibrarian();

  const id = String(formData.get("id") ?? "");
  const status = statusSchema.safeParse(formData.get("status"));
  if (!id || !status.success) return;

  const book = await setBookStatus(id, status.data);
  revalidateCatalogue(book?.slug);
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  await assertLibrarian();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // In production the R2 object is deleted in the same transaction boundary as
  // the row, so a withdrawn book can't leave a downloadable orphan behind.
  await deleteBook(id);
  revalidateCatalogue();
}

function authorSchema(dict: Dictionary) {
  const e = dict.admin.errors;
  return z.object({
    name: z.string().trim().min(2, e.name),
    nameBn: z.string().trim().optional(),
    era: z.string().trim().max(40).optional(),
    bio: z.string().trim().min(20, e.bio),
    bioBn: z.string().trim().max(2000).optional(),
  });
}

export async function createAuthorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLibrarian();
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);

  const parsed = authorSchema(dict).safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn") ?? undefined,
    era: formData.get("era") ?? undefined,
    bio: formData.get("bio"),
    bioBn: formData.get("bioBn") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: dict.admin.messages.needsAttention,
      errors: fieldErrors(parsed.error),
    };
  }

  const author = await insertAuthor(parsed.data);
  for (const lang of locales) {
    revalidatePath(localePath(lang, "/authors"));
    revalidatePath(localePath(lang, "/admin/authors"));
    revalidatePath(localePath(lang, "/admin/books/new"));
  }
  return {
    ok: true,
    message: fill(lang, dict.admin.messages.writerAdded, {
      name: author.name,
    }),
  };
}

function categorySchema(dict: Dictionary) {
  const e = dict.admin.errors;
  return z.object({
    name: z.string().trim().min(2, e.name),
    nameBn: z.string().trim().min(1, e.nameBnRequired),
    description: z.string().trim().min(20, e.shelfDescription),
    descriptionBn: z.string().trim().max(2000).optional(),
    icon: z.enum(["BookOpen", "Feather", "Landmark", "Atom", "Baby", "Library"]),
  });
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLibrarian();
  const lang = localeOf(formData);
  const dict = getDictionaryFor(lang);

  const parsed = categorySchema(dict).safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn"),
    description: formData.get("description"),
    descriptionBn: formData.get("descriptionBn") ?? undefined,
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: dict.admin.messages.needsAttention,
      errors: fieldErrors(parsed.error),
    };
  }

  const category = await insertCategory(parsed.data);
  for (const lang of locales) {
    revalidatePath(localePath(lang, "/categories"));
    revalidatePath(localePath(lang, "/admin/categories"));
    revalidatePath(localePath(lang, "/admin/books/new"));
  }
  return {
    ok: true,
    message: fill(lang, dict.admin.messages.shelfCreated, {
      name: category.name,
    }),
  };
}
