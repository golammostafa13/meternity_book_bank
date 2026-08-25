import Link from "next/link";
import { Brand } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { fill } from "@/lib/i18n/format";

/**
 * Brand marks are inline SVG: lucide-react dropped its brand icon set, and
 * pulling a second icon package in for three glyphs isn't worth the bytes.
 */
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

export function SiteFooter({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  const href = (path: string) => localePath(lang, path);

  const columns = [
    {
      title: dict.footer.library,
      links: [
        { href: "/books", label: dict.footer.allBooks },
        { href: "/categories", label: dict.common.categories },
        { href: "/authors", label: dict.common.authors },
        { href: "/search", label: dict.common.search },
      ],
    },
    {
      title: dict.footer.about,
      links: [
        { href: "/about", label: dict.footer.ourMission },
        { href: "/contact", label: dict.nav.contact },
        { href: "/signin", label: dict.common.signIn },
      ],
    },
    {
      title: dict.footer.legal,
      links: [
        { href: "/about", label: dict.footer.privacy },
        { href: "/about", label: dict.footer.terms },
        { href: "/about", label: dict.footer.copyright },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line/60 bg-bg-deep">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Brand size="lg" />
            <p
              className={`mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-mute${
                lang === "bn" ? " bn" : ""
              }`}
            >
              {lang === "bn" ? site.descriptionBn : site.description}
            </p>
            <LanguageSwitch
              lang={lang}
              label={dict.common.switchLanguage}
              className="mt-6"
            />
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      href={href(link.href)}
                      className="text-[0.95rem] text-ink-mute transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-line/60 pt-8 sm:flex-row">
          <p className="text-sm text-ink-faint">
            {fill(lang, dict.footer.rights, {
              year: new Date().getFullYear(),
              name: site.name,
            })}
          </p>
          <div className="flex items-center gap-1">
            {[
              {
                href: site.social.facebook,
                Icon: FacebookIcon,
                label: "Facebook",
              },
              {
                href: site.social.instagram,
                Icon: InstagramIcon,
                label: "Instagram",
              },
              {
                href: site.social.youtube,
                Icon: YoutubeIcon,
                label: "YouTube",
              },
            ].map(({ href: url, Icon, label }) => (
              <a
                key={label}
                href={url}
                aria-label={label}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-flex size-10 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <Icon className="size-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
