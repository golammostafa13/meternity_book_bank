import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { BookForm } from "@/components/admin/book-form";
import { Button } from "@/components/ui/button";
import { getAuthors, getBookById, getCategories } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { bookTitle } from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/books/[id]">,
) {
  const { lang, id } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const book = await getBookById(id);
  return {
    title: book
      ? fill(lang, dict.admin.editOf, { title: bookTitle(book, lang) })
      : dict.book.notFound,
  };
}

export default async function EditBookPage(
  props: PageProps<"/[lang]/admin/books/[id]">,
) {
  const { lang, id } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const [book, authors, categories] = await Promise.all([
    getBookById(id),
    getAuthors(),
    getCategories(),
  ]);

  if (!book) notFound();

  return (
    <AdminShell
      title={bookTitle(book, lang)}
      breadcrumb={fill(lang, dict.admin.breadcrumbBook, { code: book.code })}
      lang={lang}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link
            href={localePath(lang, `/books/${book.slug}`)}
            target="_blank"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {dict.admin.viewPublicPage}
          </Link>
        </Button>
      }
    >
      <BookForm
        authors={authors}
        categories={categories}
        book={book}
        lang={lang}
      />
    </AdminShell>
  );
}
