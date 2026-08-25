import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { Button } from "@/components/ui/button";
import { getPopular } from "@/lib/data/books";
import { defaultLocale, getDictionary, localePath } from "@/lib/i18n";
import { bookTitle, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

export const metadata = {
  title: getDictionary(defaultLocale).notFound.metaTitle,
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * A dead end is the one page where a suggestion is worth more than an apology,
 * so it offers three books that actually exist rather than a large "404".
 *
 * `not-found.tsx` cannot read route params: by the time it renders, the route
 * that would have carried them did not match. It therefore renders in the
 * default language, and every link goes to a real localised path.
 */
export default async function NotFound() {
  const lang = defaultLocale;
  const dict = getDictionary(lang);
  const suggestions = await getPopular(3);

  return (
    <div className="paper-grain mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-accent">
        {dict.notFound.code}
      </p>
      <h1
        className={cn(
          "mt-5 text-[clamp(2.1rem,6vw,3.6rem)] font-bold leading-[1.08] tracking-tight text-ink",
          textClass(lang),
        )}
      >
        {dict.notFound.title}
      </h1>
      <p
        className={cn("mt-5 max-w-md text-lg text-ink-mute", textClass(lang))}
      >
        {dict.notFound.lead}
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary" size="lg">
          <Link href={localePath(lang)}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {dict.notFound.back}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={localePath(lang, "/search")}>
            <Search className="size-4" aria-hidden="true" />
            {dict.notFound.search}
          </Link>
        </Button>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-20 w-full">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
            {dict.notFound.suggestions}
          </h2>
          <ul className="mt-8 grid grid-cols-3 gap-6 sm:gap-10">
            {suggestions.map((book) => (
              <li key={book.id}>
                <Link
                  href={localePath(lang, `/books/${book.slug}`)}
                  className="group block"
                >
                  <Book3D
                    book={book}
                    lang={lang}
                    size="md"
                    angle={-24}
                    hoverAngle={-6}
                  />
                  <p className="mt-5 line-clamp-2 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    {bookTitle(book, lang)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
