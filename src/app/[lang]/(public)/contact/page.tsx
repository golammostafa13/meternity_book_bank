import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/[lang]/contact">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: dict.contact.eyebrow,
    description: dict.contact.metaDescription,
    alternates: {
      canonical: localePath(lang, "/contact"),
      languages: {
        en: localePath("en", "/contact"),
        bn: localePath("bn", "/contact"),
      },
    },
  };
}

export default async function ContactPage(props: PageProps<"/[lang]/contact">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-24">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr]">
        <div className="reveal-3d">
          <p
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.2em] text-accent",
              textClass(lang),
            )}
          >
            {dict.contact.eyebrow}
          </p>
          <h1
            className={cn(
              "mt-2 text-[clamp(2.2rem,5vw,3.4rem)] font-bold tracking-tight text-ink",
              lang === "bn" ? "bn leading-[1.3]" : "leading-[1.1]",
            )}
          >
            {dict.contact.title}
          </h1>
          <p
            className={cn(
              "mt-5 text-lg leading-relaxed text-ink-mute",
              textClass(lang),
            )}
          >
            {dict.contact.lead}
          </p>

          <dl className="mt-12 space-y-6">
            {[
              { Icon: Mail, label: dict.contact.email, value: site.email },
              {
                Icon: MapPin,
                label: dict.contact.readingRoom,
                value: dict.contact.address,
              },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <dt className={cn("text-sm text-ink-faint", textClass(lang))}>
                    {label}
                  </dt>
                  <dd
                    className={cn("mt-0.5 font-medium text-ink", textClass(lang))}
                  >
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="reveal-3d" style={{ "--lag": 6 } as React.CSSProperties}>
          <ContactForm lang={lang} />
        </div>
      </div>
    </div>
  );
}
