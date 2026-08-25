import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PdfReader } from "@/components/pdf-reader";
import { getAllBooks, getBook } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath, locales } from "@/lib/i18n";
import { bookAuthorName, bookTitle } from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";

export async function generateStaticParams() {
  const books = await getAllBooks();
  return locales.flatMap((lang) => books.map((b) => ({ lang, slug: b.slug })));
}

export async function generateMetadata(
  props: PageProps<"/[lang]/read/[slug]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) return {};

  const dict = getDictionary(lang);
  const book = await getBook(slug);
  if (!book) return { title: dict.book.notFound };

  const title = bookTitle(book, lang);

  return {
    title: fill(lang, dict.reader.metaTitle, { title }),
    description: fill(lang, dict.reader.metaDescription, {
      title,
      author: bookAuthorName(book, lang),
    }),
    // The reader is a viewer for content already indexed at /books/[slug];
    // indexing it too would just split ranking signals between the two.
    robots: { index: false, follow: true },
    alternates: { canonical: localePath(lang, `/books/${book.slug}`) },
  };
}

export default async function ReadPage(props: PageProps<"/[lang]/read/[slug]">) {
  const { lang, slug } = await props.params;
  if (!hasLocale(lang)) notFound();

  const book = await getBook(slug);
  if (!book) notFound();

  return <PdfReader book={book} lang={lang} />;
}
