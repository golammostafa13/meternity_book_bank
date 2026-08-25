import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { BookRowActions } from "@/components/admin/book-row-actions";
import { Book3D } from "@/components/book-3d";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status-pill";
import { getBooks, getCategories } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  bookAuthorName,
  bookTitle,
  categoryName,
  formatCompactIn,
  formatDateIn,
  formatNumberIn,
  formatYearIn,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/format";
import type { BookStatus, CatalogueQuery } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/books">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.books };
}

/**
 * The catalogue management table.
 *
 * Filters are plain GET form fields rather than client state: the librarian's
 * current view is a URL they can bookmark, share with a colleague, or reload
 * after an edit without losing their place. No client JS is needed to filter,
 * which is also why this page works before hydration finishes.
 */
export default async function AdminBooksPage(
  props: PageProps<"/[lang]/admin/books">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const href = (path: string) => localePath(lang, path);
  const bn = textClass(lang);

  const sp = await props.searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const query: CatalogueQuery = {
    q: first(sp.q),
    category: first(sp.category),
    status: first(sp.status) as BookStatus | undefined,
    sort: (first(sp.sort) as CatalogueQuery["sort"]) ?? "recent",
    page: Number(first(sp.page) ?? 1) || 1,
    perPage: 12,
  };

  const [result, categories] = await Promise.all([
    getBooks(query),
    getCategories(),
  ]);

  return (
    <AdminShell
      title={dict.admin.books}
      breadcrumb={fill(lang, dict.admin.breadcrumbTitles, { n: result.total })}
      lang={lang}
      actions={
        <Button asChild variant="primary" size="sm">
          <Link href={href("/admin/books/new")}>
            <Plus className="size-4" aria-hidden="true" />
            {dict.admin.catalogueABook}
          </Link>
        </Button>
      }
    >
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-e1"
      >
        <div className="relative min-w-60 flex-1">
          <label
            htmlFor="q"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.admin.filterSearch}
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-[2.9rem] size-4 text-ink-faint"
            aria-hidden="true"
          />
          <input
            id="q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder={dict.admin.filterSearchPlaceholder}
            className={fieldClass(undefined, cn("pl-11", bn))}
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.admin.filterShelf}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={query.category ?? ""}
            className={fieldClass()}
          >
            <option value="">{dict.admin.filterAllShelves}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryName(c, lang)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.admin.filterStatus}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className={fieldClass()}
          >
            <option value="">{dict.admin.filterAnyStatus}</option>
            <option value="available">{dict.admin.statusAvailable}</option>
            <option value="borrowed">{dict.admin.statusOnLoan}</option>
            <option value="damaged">{dict.admin.statusDamaged}</option>
            <option value="lost">{dict.admin.statusLost}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="sort"
            className={cn("mb-2 block text-sm font-medium text-ink", bn)}
          >
            {dict.admin.filterSort}
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={query.sort}
            className={fieldClass()}
          >
            <option value="recent">{dict.catalogue.sortRecent}</option>
            <option value="popular">{dict.catalogue.sortPopular}</option>
            <option value="title">{dict.catalogue.sortTitle}</option>
            <option value="year">{dict.catalogue.sortYear}</option>
          </select>
        </div>

        <Button type="submit" variant="primary" size="md">
          {dict.admin.apply}
        </Button>
        {(query.q || query.category || query.status) && (
          <Button asChild variant="ghost" size="md">
            <Link href={href("/admin/books")}>{dict.admin.clear}</Link>
          </Button>
        )}
      </form>

      {result.items.length === 0 ? (
        <p className={cn("py-24 text-center text-ink-mute", bn)}>
          {dict.admin.noMatches}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-248 text-left text-sm">
              <caption className="sr-only">
                {fill(lang, dict.admin.catalogueTable, {
                  page: result.page,
                  total: result.totalPages,
                })}
              </caption>
              <thead className="bg-bg-deep/60">
                <tr
                  className={cn(
                    "text-xs uppercase tracking-wider text-ink-faint",
                    bn,
                  )}
                >
                  <th scope="col" className="w-16 px-5 py-3 font-medium">
                    {dict.admin.colCover}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colTitle}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colShelf}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colCopies}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colDownloads}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colAdded}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {dict.admin.colStatus}
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    {dict.admin.colActions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((book) => (
                  <tr
                    key={book.id}
                    className="border-t border-line/70 transition-colors hover:bg-bg-deep/40"
                  >
                    {/* The same object the public site shows, at thumbnail
                        scale: a librarian recognises the cover long before
                        they read the row. */}
                    <td className="px-5 py-4">
                      <Book3D
                        book={book}
                        lang={lang}
                        size="sm"
                        angle={-24}
                        hoverAngle={-8}
                        depthScale={0.5}
                        className="w-11"
                      />
                    </td>
                    <td className="max-w-88 px-3 py-3">
                      <Link
                        href={href(`/admin/books/${book.id}`)}
                        className={cn(
                          "line-clamp-1 font-medium text-ink hover:text-accent",
                          bn,
                        )}
                      >
                        {bookTitle(book, lang)}
                      </Link>
                      <p className={cn("line-clamp-1 text-xs text-ink-mute", bn)}>
                        {bookAuthorName(book, lang)} ·{" "}
                        {formatYearIn(book.year, lang)} ·{" "}
                        <span className="font-mono">{book.code}</span>
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className={cn("text-ink-mute", bn)}>
                        {book.categoryName}
                      </p>
                      <p className="font-mono text-xs text-ink-faint">
                        {book.shelf}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-ink-mute">
                      {formatNumberIn(book.copiesAvailable, lang)}/
                      {formatNumberIn(book.copiesTotal, lang)}
                    </td>
                    <td className="px-3 py-3 text-ink-mute">
                      {formatCompactIn(book.downloads, lang)}
                    </td>
                    <td className={cn("px-3 py-3 text-ink-mute", bn)}>
                      {formatDateIn(book.addedAt, lang)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={book.status} dict={dict} lang={lang} />
                    </td>
                    <td className="px-5 py-3">
                      <BookRowActions book={book} lang={lang} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={href("/admin/books")}
        dict={dict}
        searchParams={{
          q: query.q,
          category: query.category,
          status: query.status,
          sort: query.sort,
        }}
      />
    </AdminShell>
  );
}
