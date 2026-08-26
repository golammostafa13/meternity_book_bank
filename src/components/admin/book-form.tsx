"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Check, FileUp, Loader2, Save, Trash2 } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import {
  coverSchemes,
  hueForScheme,
  schemeIndexOf,
} from "@/lib/cover-theme";
import {
  createBookAction,
  updateBookAction,
  type ActionState,
} from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import {
  authorName,
  categoryName,
  subjectName,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Author, Book, Category, Subject } from "@/types";

/**
 * Catalogue a book, or edit one already on the shelf.
 *
 * The right-hand column renders the actual `Book3D` the public site will show,
 * live, from the fields as they are typed, so choosing a cover scheme is a
 * decision about a visible object rather than about a number in a form. It is
 * the same component, not a mock-up of it.
 *
 * Validation is the server's job (see `lib/actions/admin`); the errors it
 * returns are keyed by field name and rendered inline. Required attributes are
 * left off deliberately so the server path is the one that gets exercised.
 */

const empty: ActionState = { ok: false };

export function BookForm({
  authors,
  categories,
  subjects,
  book,
  lang,
}: {
  authors: Author[];
  categories: Category[];
  subjects: Subject[];
  /** Absent when cataloguing something new. */
  book?: Book;
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const editing = Boolean(book);
  const [state, formAction, pending] = useActionState(
    editing ? updateBookAction : createBookAction,
    empty,
  );

  // Preview state: only the fields the cover actually renders.
  const [title, setTitle] = useState(book?.title ?? "");
  const [titleBn, setTitleBn] = useState(book?.titleBn ?? "");
  const [authorId, setAuthorId] = useState(book?.authorId ?? authors[0]?.id);
  const [pages, setPages] = useState(String(book?.pages ?? 240));
  const [scheme, setScheme] = useState(
    schemeIndexOf(book?.coverHue ?? hueForScheme(0)),
  );
  const [coverImageData, setCoverImageData] = useState<string | null>(null);
  const [removingCover, setRemovingCover] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImageData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getCoverImageValue = () => {
    if (removingCover) return "";
    if (coverImageData) return coverImageData;
    return book?.coverImage || "";
  };

  const previewId = useId();
  const selectedAuthor = authors.find((a) => a.id === authorId);

  const preview = {
    id: book?.id ?? previewId,
    title: title || "Untitled",
    titleBn: titleBn || undefined,
    authorName: selectedAuthor?.name ?? "",
    authorNameBn: selectedAuthor?.nameBn,
    coverHue: hueForScheme(scheme),
    coverImage: coverImageData || book?.coverImage,
    pages: Number(pages) || 240,
  };

  const errors = state.errors ?? {};
  const bn = textClass(lang);
  const f = dict.admin.form;

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      {editing && <input type="hidden" name="id" value={book!.id} />}
      <input type="hidden" name="coverHue" value={hueForScheme(scheme)} />
      <input type="hidden" name="coverImage" value={getCoverImageValue()} />
      {/* Server Actions cannot read route params, so the language the librarian
          is working in rides along and the validation answers in it. */}
      <input type="hidden" name="lang" value={lang} />

      <div className="flex flex-col gap-4">
        {state.message && (
          <p
            role="status"
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
              state.ok
                ? "border-ok/30 bg-ok-soft text-ok"
                : "border-danger/30 bg-danger-soft text-danger",
            )}
          >
            {state.ok && <Check className="size-4" aria-hidden="true" />}
            <span className={bn}>{state.message}</span>
            {state.ok && !editing && (
              <Link
                href={localePath(lang, "/admin/books")}
                className="ml-auto font-medium underline underline-offset-4"
              >
                {f.viewCatalogue}
              </Link>
            )}
          </p>
        )}

        {/* --- Identity ------------------------------------------------- */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
          <h2 className={cn("font-semibold text-ink", bn)}>{f.theBook}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={f.title} htmlFor="title" error={errors.title}>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={f.titlePlaceholder}
                className={fieldClass(errors.title)}
              />
            </Field>

            <Field
              label={f.titleBn}
              htmlFor="titleBn"
              error={errors.titleBn}
              hint={f.titleBnHint}
            >
              <input
                id="titleBn"
                name="titleBn"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder={f.titleBnPlaceholder}
                className={cn(fieldClass(errors.titleBn), "bn")}
              />
            </Field>

            <Field label={f.author} htmlFor="authorId" error={errors.authorId}>
              <select
                id="authorId"
                name="authorId"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className={fieldClass(errors.authorId)}
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {authorName(a, lang)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={f.shelf} htmlFor="categoryId" error={errors.categoryId}>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={book?.categoryId ?? categories[0]?.id}
                className={fieldClass(errors.categoryId)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryName(c, lang)}
                  </option>
                ))}
              </select>
            </Field>

            {/* The clinical axis, beside the shelf it is not a synonym for: a
                book has both, and picking one does not pick the other. */}
            <Field label={f.subject} htmlFor="subjectId" error={errors.subjectId}>
              <select
                id="subjectId"
                name="subjectId"
                defaultValue={book?.subjectId ?? subjects[0]?.id}
                className={fieldClass(errors.subjectId)}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {subjectName(s, lang)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={f.publisher} htmlFor="publisher" error={errors.publisher}>
              <input
                id="publisher"
                name="publisher"
                defaultValue={book?.publisher}
                placeholder={f.publisherPlaceholder}
                className={fieldClass(errors.publisher)}
              />
            </Field>

            <Field label={f.year} htmlFor="year" error={errors.year}>
              <input
                id="year"
                name="year"
                type="number"
                inputMode="numeric"
                defaultValue={book?.year ?? new Date().getFullYear()}
                className={fieldClass(errors.year)}
              />
            </Field>

            <Field label={f.language} htmlFor="language" error={errors.language}>
              <select
                id="language"
                name="language"
                defaultValue={book?.language ?? "bn"}
                className={fieldClass(errors.language)}
              >
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
              </select>
            </Field>

            <Field
              label={f.isbn}
              htmlFor="isbn"
              error={errors.isbn}
              hint={f.isbnHint}
            >
              <input
                id="isbn"
                name="isbn"
                defaultValue={book?.isbn}
                placeholder="978-984-10000-1"
                className={cn(fieldClass(errors.isbn), "font-mono")}
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-5">
            <Field
              label={f.description}
              htmlFor="description"
              error={errors.description}
              hint={f.descriptionHint}
            >
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={book?.description}
                className={cn(fieldClass(errors.description), "h-auto resize-y py-3")}
              />
            </Field>

            <Field
              label={f.descriptionBn}
              htmlFor="descriptionBn"
              error={errors.descriptionBn}
              hint={f.optional}
            >
              <textarea
                id="descriptionBn"
                name="descriptionBn"
                rows={3}
                defaultValue={book?.descriptionBn}
                className={cn(
                  fieldClass(errors.descriptionBn),
                  "bn h-auto resize-y py-3",
                )}
              />
            </Field>
          </div>
        </section>

        {/* --- Inventory and file --------------------------------------- */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
          <h2 className={cn("font-semibold text-ink", bn)}>{f.inventoryAndFile}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={f.pages} htmlFor="pages" error={errors.pages}>
              <input
                id="pages"
                name="pages"
                type="number"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className={fieldClass(errors.pages)}
              />
            </Field>

            <Field label={f.copies} htmlFor="copiesTotal" error={errors.copiesTotal}>
              <input
                id="copiesTotal"
                name="copiesTotal"
                type="number"
                inputMode="numeric"
                defaultValue={book?.copiesTotal ?? 1}
                className={fieldClass(errors.copiesTotal)}
              />
            </Field>

            <Field label={f.status} htmlFor="status" error={errors.status}>
              <select
                id="status"
                name="status"
                defaultValue={book?.status ?? "available"}
                className={fieldClass(errors.status)}
              >
                <option value="available">{dict.admin.statusAvailable}</option>
                <option value="borrowed">{dict.admin.statusOnLoan}</option>
                <option value="damaged">{dict.admin.statusDamaged}</option>
                <option value="lost">{dict.admin.statusLost}</option>
              </select>
            </Field>

            <Field label={f.format} htmlFor="format" error={errors.format}>
              <select
                id="format"
                name="format"
                defaultValue={book?.format ?? "pdf"}
                className={fieldClass(errors.format)}
              >
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label={f.fileSize}
              htmlFor="fileSizeMb"
              error={errors.fileSizeMb}
              hint={f.fileSizeHint}
            >
              <input
                id="fileSizeMb"
                name="fileSizeMb"
                type="number"
                step="0.1"
                inputMode="decimal"
                defaultValue={book?.fileSizeMb ?? 4}
                className={fieldClass(errors.fileSizeMb)}
              />
            </Field>

            {/* The real upload is a presigned PUT straight to R2: the file
                never passes through the app, which is what keeps a 400 MB scan
                off the Workers CPU budget. */}
            <div>
              <span
                className={cn("mb-2 block text-sm font-medium text-ink", bn)}
              >
                {f.bookFile}
              </span>
              <label
                htmlFor="file"
                className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-bg px-4 text-[0.95rem] text-ink-mute transition-colors hover:border-accent hover:text-ink"
              >
                <FileUp className="size-4 text-accent" aria-hidden="true" />
                {f.choosePdf}
              </label>
              <input id="file" name="file" type="file" className="sr-only" />
              <p className={cn("mt-1.5 text-sm text-ink-faint", bn)}>
                {f.uploadNote}
              </p>
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 text-[0.95rem] text-ink">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={book?.featured}
              className="size-4 rounded border-line accent-[var(--accent)]"
            />
            {f.feature}
          </label>
        </section>
      </div>

      {/* --- Live cover ------------------------------------------------- */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
          <h2 className={cn("font-semibold text-ink", bn)}>{f.cover}</h2>
          <p className={cn("mt-1 text-sm text-ink-mute", bn)}>{f.coverLead}</p>

          <div className="mx-auto mt-8 w-[62%] xl:w-[74%]">
            <Book3D
              book={preview}
              lang={lang}
              size="lg"
              angle={-20}
              hoverAngle={-6}
              depthScale={1.1}
            />
          </div>

          <div className="mx-auto mt-6 w-[62%] xl:w-[74%]">
            <span className={cn("mb-2 block text-sm font-medium text-ink", bn)}>
              {f.coverImage}
            </span>
            {coverImageData || (!removingCover && book?.coverImage) ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageData || book!.coverImage!}
                  alt=""
                  className="w-full rounded-lg border border-line"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-surface/80 backdrop-blur"
                  onClick={() => {
                    setRemovingCover(true);
                    setCoverImageData(null);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span className="ml-1">{f.removeCover}</span>
                </Button>
              </div>
            ) : (
              <label
                htmlFor="coverImage"
                className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-bg px-4 text-[0.95rem] text-ink-mute transition-colors hover:border-accent hover:text-ink"
              >
                <FileUp className="size-4 text-accent" aria-hidden="true" />
                {f.chooseCover}
              </label>
            )}
            <input
              id="coverImage"
              name="coverImage"
              type="file"
              accept="image/webp,image/jpeg,image/png"
              className="sr-only"
              onChange={handleCoverChange}
            />
            <p className={cn("mt-1.5 text-sm text-ink-faint", bn)}>
              {f.coverUploadNote}
            </p>
          </div>

          <fieldset className="mt-10">
            <legend className={cn("text-sm font-medium text-ink", bn)}>
              {f.scheme}
            </legend>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {coverSchemes.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setScheme(i)}
                  aria-pressed={scheme === i}
                  title={s.name}
                  className={cn(
                    "h-11 overflow-hidden rounded-lg border-2 transition-transform",
                    scheme === i
                      ? "border-accent"
                      : "border-transparent hover:-translate-y-0.5",
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${s.paper} 0 52%, ${s.deep} 52% 100%)`,
                  }}
                >
                  <span className="sr-only">{s.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-faint">
              {coverSchemes[scheme].name}
            </p>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="mt-8 w-full"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {editing ? f.save : f.add}
          </Button>
          <Button asChild variant="ghost" size="md" className="mt-2 w-full">
            <Link href={localePath(lang, "/admin/books")}>{f.cancel}</Link>
          </Button>
        </div>
      </aside>
    </form>
  );
}
