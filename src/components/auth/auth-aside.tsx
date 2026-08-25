import { BookOpen, KeyRound, Languages } from "lucide-react";
import { CourtesyBy } from "@/components/courtesy-by";
import { ExiumAd } from "@/components/exium-ad";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The panel beside the card, on both doors.
 *
 * This is the first surface anyone sees, because `/` lands on sign-in and there
 * is no way past it, so it has to do three jobs at once: say what the library
 * is, say who paid for it, and not get in the way of a single password field.
 * Hence the order: the promise, then three facts, then the sponsor.
 *
 * The advert is *here* rather than only inside the library on purpose. A reader
 * who never gets past this page has still seen the pack, which is the deal; and
 * putting it at the door means the catalogue pages can carry it once, quietly,
 * in a sidebar instead of everywhere.
 *
 * Desktop only. On a phone the form is the page, and nothing should stand
 * between the reader and it.
 */
export function AuthAside({
  lang,
  lead,
}: {
  lang: Locale;
  /** Each door says something different about why it is asking. */
  lead: string;
}) {
  const dict = getDictionary(lang);
  const bn = textClass(lang);

  return (
    <div className="hidden lg:block">
      <p
        className={cn(
          "inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink-mute",
          bn,
        )}
      >
        <span
          aria-hidden="true"
          className="brand-mark inline-block size-2 rounded-full"
        />
        {dict.auth.sideEyebrow}
      </p>

      <p
        className={cn(
          "mt-3 max-w-xl text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-[-0.02em] text-ink",
          lang === "bn" ? "bn leading-[1.35]" : "leading-[1.15]",
        )}
      >
        {lang === "bn" ? site.taglineBn : site.tagline}
      </p>

      <p className={cn("mt-3 max-w-md text-[0.95rem] text-ink-mute", bn)}>
        {lead}
      </p>

      {/* Three facts about the library, one line. They answer the question the
          card provokes: "do I need this?", without another paragraph. */}
      <ul
        className={cn(
          "mt-5 flex max-w-md flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] font-medium text-ink-mute",
          bn,
        )}
      >
        {[
          { key: "book", Icon: KeyRound, label: dict.auth.badgeWithBook },
          { key: "bi", Icon: Languages, label: dict.auth.badgeBilingual },
          { key: "browser", Icon: BookOpen, label: dict.auth.badgeBrowser },
        ].map(({ key, Icon, label }) => (
          <li key={key} className="inline-flex items-center gap-1.5">
            <Icon className="size-4 text-accent" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-9 flex max-w-lg items-end gap-8">
        <ExiumAd
          copy={dict.sponsor}
          className="w-[17rem] shrink-0"
          bnClass={bn}
        />
        <CourtesyBy
          label={dict.sponsor.courtesy}
          company={dict.sponsor.company}
          className="pb-2"
          bnClass={bn}
        />
      </div>
    </div>
  );
}

/**
 * The card itself: heading, lead, and whatever form the door needs. Shared so
 * that the password and the register are visibly the same object seen twice
 * rather than two pages that happen to look similar.
 */
export function AuthCard({
  lang,
  title,
  lead,
  children,
  footer,
}: {
  lang: Locale;
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const bn = textClass(lang);

  return (
    <div className="mx-auto w-full max-w-sm lg:mx-0">
      <div className="rounded-3xl border border-line bg-surface p-8 shadow-e3">
        <h1
          className={cn("text-[1.65rem] font-bold tracking-tight text-ink", bn)}
        >
          {title}
        </h1>

        {lead ? (
          <p className={cn("mt-2.5 text-[0.92rem] text-ink-mute", bn)}>{lead}</p>
        ) : null}

        <div className="mt-7">{children}</div>
      </div>

      {footer}
    </div>
  );
}

/** The shell both columns sit in. */
export function AuthLayoutGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-5 pb-20 lg:grid-cols-[1fr_24rem] lg:gap-20 lg:px-8">
      {children}
    </div>
  );
}
