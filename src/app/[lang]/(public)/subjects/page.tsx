import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarHeart,
  Dna,
  HeartPulse,
  Ribbon,
  Stethoscope,
  Venus,
} from "lucide-react";
import { getSubjectShelves } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  subjectDescription,
  subjectName,
  textClass,
} from "@/lib/i18n/content";
import { titlesCount } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/[lang]/subjects">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.subjects.title,
    description: dict.subjects.metaDescription,
    alternates: {
      canonical: localePath(lang, "/subjects"),
      languages: {
        en: localePath("en", "/subjects"),
        bn: localePath("bn", "/subjects"),
      },
    },
  };
}

/**
 * Every icon a subject can name, and nothing else.
 *
 * The map is exhaustive by hand rather than a dynamic import from `lucide-react`
 * because a dynamic one pulls the whole icon set into the bundle to satisfy a
 * lookup of seven. `BookOpen` is the fallback, and reaching it means a subject
 * named an icon that is not here.
 */
const icons: Record<string, typeof BookOpen> = {
  Stethoscope,
  Venus,
  HeartPulse,
  Dna,
  Ribbon,
  Activity,
  CalendarHeart,
  BookOpen,
};

export default async function SubjectsPage(
  props: PageProps<"/[lang]/subjects">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const subjects = await getSubjectShelves(4);
  const href = (path: string) => localePath(lang, path);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="reveal-3d max-w-2xl">
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
            textClass(lang),
          )}
        >
          {dict.subjects.eyebrow}
        </p>
        <h1
          className={cn(
            "mt-2 text-[clamp(2.1rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
            lang === "bn" && "bn leading-[1.3]",
          )}
        >
          {dict.subjects.title}
        </h1>
        <p className={cn("mt-4 text-lg text-ink-mute", textClass(lang))}>
          {dict.subjects.lead}
        </p>
        <Link
          href={href("/categories")}
          className={cn(
            "mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover",
            textClass(lang),
          )}
        >
          {dict.subjects.alsoByCategory}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, i) => {
          const Icon = icons[subject.icon] ?? BookOpen;
          const name = subjectName(subject, lang);
          return (
            /* Reveal on a wrapper, as on the categories grid: the tile's own
               hover transform has to stay free of a filled scroll animation. */
            <div
              key={subject.id}
              className="reveal-3d h-full"
              style={{ "--lag": (i % 3) * 5 } as React.CSSProperties}
            >
              <Link
                href={href(`/subjects/${subject.slug}`)}
                className="tile3d group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:border-accent/40"
              >
                {/* The subject's plate, and the reason the tile is not the
                    same tile as a category's: a subject is recognised by its
                    picture before its name is read. `sizes` matches the grid
                    so a phone never downloads the three-column asset. */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-deep">
                  <Image
                    src={subject.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    priority={i < 3}
                  />
                  <span className="absolute left-5 top-5 inline-flex size-11 items-center justify-center rounded-xl bg-surface/85 text-accent backdrop-blur-sm">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h2
                    className={cn(
                      "text-xl font-semibold text-ink transition-colors group-hover:text-accent",
                      textClass(lang),
                    )}
                  >
                    {name}
                  </h2>
                  {/* The other language's name as a subtitle, exactly as the
                      category page does it: a Bengali shelf is still worth
                      naming in English, and the reverse. */}
                  <p
                    className={cn(
                      "mt-1 text-sm text-ink-faint",
                      lang === "bn" || "bn",
                    )}
                  >
                    {lang === "bn" ? subject.name : subject.nameBn}
                  </p>
                  <p
                    className={cn(
                      "mt-3 leading-relaxed text-ink-mute",
                      textClass(lang),
                    )}
                  >
                    {subjectDescription(subject, lang)}
                  </p>
                  <p
                    className={cn(
                      "mt-auto pt-6 inline-flex items-center gap-2 text-sm font-medium text-ink",
                      textClass(lang),
                    )}
                  >
                    {titlesCount(dict, lang, subject.bookCount)}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
