import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AuthorForm } from "@/components/admin/author-form";
import { Shelf3D } from "@/components/shelf-3d";
import { getAuthorShelves } from "@/lib/data/books";
import { markTheme } from "@/lib/cover-theme";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { authorName, formatNumberIn, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/authors">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.authors };
}

export default async function AdminAuthorsPage(
  props: PageProps<"/[lang]/admin/authors">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const href = (path: string) => localePath(lang, path);
  const bn = textClass(lang);

  const [authors] = await Promise.all([
    getAuthorShelves(8),
  ]);
  const sorted = [...authors].sort((a, b) => b.bookCount - a.bookCount);

  return (
    <AdminShell
      title={dict.admin.authors}
      breadcrumb={fill(lang, dict.admin.breadcrumbWriters, {
        n: authors.length,
      })}
      lang={lang}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">
              {dict.admin.writersInCollection}
            </caption>
            <thead className="bg-bg-deep/60">
              <tr
                className={cn(
                  "text-xs uppercase tracking-wider text-ink-faint",
                  bn,
                )}
              >
                <th scope="col" className="px-5 py-3 font-medium">
                  {dict.admin.colWriter}
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  {dict.admin.colOnTheShelf}
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  {dict.admin.colTitles}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((author) => {
                const t = markTheme(author.id);
                return (
                  <tr
                    key={author.id}
                    className="border-t border-line/70 transition-colors hover:bg-bg-deep/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-e1"
                          style={{ background: t.bg, color: t.fg }}
                        >
                          {author.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className={cn("font-medium text-ink", bn)}>
                            {authorName(author, lang)}
                          </p>
                          <p className="text-xs text-ink-faint">{author.era}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {author.shelf.length > 0 ? (
                        <Shelf3D books={author.shelf} lang={lang} height={44} />
                      ) : (
                        <span className={cn("text-ink-faint", bn)}>
                          {dict.admin.nothingYet}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={href(
                          `/admin/books?q=${encodeURIComponent(author.name)}`,
                        )}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {formatNumberIn(author.bookCount, lang)}
                      </Link>
                      <Link
                        href={href(`/authors/${author.slug}`)}
                        target="_blank"
                        aria-label={fill(lang, dict.admin.openPublicPage, {
                          name: authorName(author, lang),
                        })}
                        className="ml-3 inline-flex text-ink-faint hover:text-accent"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AuthorForm lang={lang} />
      </div>
    </AdminShell>
  );
}
