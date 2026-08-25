import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Globe, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStats } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { formatCompactIn, formatNumberIn, textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/about">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.about.eyebrow,
    description: dict.about.metaDescription,
    alternates: {
      canonical: localePath(lang, "/about"),
      languages: {
        en: localePath("en", "/about"),
        bn: localePath("bn", "/about"),
      },
    },
  };
}

export default async function AboutPage(props: PageProps<"/[lang]/about">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const stats = await getStats();
  const propIcons = [Zap, Lock, Globe];

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 lg:py-24">
      <p
        className={cn(
          "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
          textClass(lang),
        )}
      >
        {dict.about.eyebrow}
      </p>
      <h1
        className={cn(
          "mt-2 text-[clamp(2.2rem,5.5vw,3.6rem)] font-bold tracking-tight text-ink",
          lang === "bn" ? "bn leading-[1.3]" : "leading-[1.08]",
        )}
      >
        {dict.about.title}
      </h1>

      <div
        className={cn(
          "reveal-3d mt-10 space-y-6 text-lg leading-relaxed text-ink-mute",
          textClass(lang),
        )}
      >
        <p>
          {fill(lang, dict.about.lead, {
            name: site.name,
            books: formatCompactIn(stats.totalBooks, lang),
          })}
        </p>
        <p>{dict.about.body}</p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {dict.about.props.map((prop, i) => {
          const Icon = propIcons[i];
          return (
            <div
              key={prop.title}
              className="reveal-3d"
              style={{ "--lag": i * 5 } as React.CSSProperties}
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className={cn("mt-4 font-semibold text-ink", textClass(lang))}>
                {prop.title}
              </h2>
              <p
                className={cn(
                  "mt-2 text-[0.95rem] leading-relaxed text-ink-mute",
                  textClass(lang),
                )}
              >
                {prop.body}
              </p>
            </div>
          );
        })}
      </div>

      <dl className="reveal-3d mt-16 grid grid-cols-2 gap-8 rounded-2xl border border-line bg-surface p-8 sm:grid-cols-4">
        {[
          {
            label: dict.about.statBooks,
            value: formatCompactIn(stats.totalBooks, lang),
          },
          {
            label: dict.about.statAuthors,
            value: formatCompactIn(stats.totalAuthors, lang),
          },
          {
            label: dict.about.statCategories,
            value: formatNumberIn(stats.totalCategories, lang),
          },
          {
            label: dict.about.statDownloads,
            value: formatCompactIn(stats.totalDownloads, lang),
          },
        ].map((s) => (
          <div key={s.label}>
            <dt className={cn("text-sm text-ink-faint", textClass(lang))}>
              {s.label}
            </dt>
            <dd className="mt-1 text-3xl font-bold tracking-tight text-ink">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="reveal-3d mt-14">
        <Button asChild size="lg" variant="primary">
          <Link href={localePath(lang, "/books")}>
            {dict.common.startBrowsing}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
