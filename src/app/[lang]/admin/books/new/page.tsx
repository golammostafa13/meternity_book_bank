import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { BookForm } from "@/components/admin/book-form";
import { getAuthors, getCategories } from "@/lib/data/books";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/books/new">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.catalogueABook };
}

export default async function NewBookPage(
  props: PageProps<"/[lang]/admin/books/new">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const [authors, categories] = await Promise.all([
    getAuthors(),
    getCategories(),
  ]);

  return (
    <AdminShell
      title={dict.admin.catalogueABook}
      breadcrumb={dict.admin.breadcrumbNew}
      lang={lang}
    >
      <BookForm
        authors={authors}
        categories={categories}
        lang={lang}
      />
    </AdminShell>
  );
}
