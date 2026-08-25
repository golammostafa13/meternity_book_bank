"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, Search } from "lucide-react";
import { BrandMark } from "@/components/brand";
import {
  AccountPanel,
  SignInLink,
} from "@/components/auth/account-menu";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth/use-session";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Site header.
 *
 * Three things across one bar: a menu button on the left, the name in the
 * middle, one utility group on the right. Every page has the same header at
 * every width: there is no separate desktop nav that collapses into a
 * hamburger, because the reason a row of five links exists on wide screens is
 * that there is room for it, not that anyone needed it there. Putting the links
 * behind one button at all widths costs a reader one tap and buys the page its
 * whole top edge back, which on a full-bleed hero is the difference between a
 * header sitting *on* the picture and one sitting *in front of* it.
 *
 * It is transparent over the hero and solid once past it, and that is decided by
 * an `IntersectionObserver` on a one-pixel sentinel rather than by a scroll
 * handler: the same rule the rest of the app follows. The sentinel is rendered
 * here rather than by the page so a page cannot forget it: no sentinel simply
 * means the header is solid, which is the correct answer for a page with no
 * hero.
 *
 * A Client Component, because the panel and that observer hold state. The
 * session is still fetched after paint from `/api/session` rather than read on
 * the server, for the reason it always was: doing so would make every static
 * page render per request for one name in one corner.
 */
export function SiteHeader({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  /**
   * The panel is open when it was opened *on the page we are still on*.
   *
   * Stored as the path it opened at rather than as a boolean, which makes
   * "close it on navigation" fall out of the render instead of needing an
   * effect to synchronise it, and an effect that calls `setState` in its own
   * body is a cascading render, which is what the lint rule is for. It also
   * covers what an `onClick` on each link alone would miss: the browser's own
   * back button, which navigates without anyone clicking a link.
   *
   * The links clear it as well as navigating, and that is not belt-and-braces.
   * Without it, following a link from the panel leaves the remembered path
   * behind: `open` goes false because the path changed, and then pressing back
   * returns to that same path and the panel springs open again over it.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [lifted, setLifted] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const open = openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);
  const href = (path: string) => localePath(lang, path);
  const { session, loading } = useSession();

  /* Transparent while the sentinel (a hairline at the very top of the
     document) is still on screen. */
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLifted(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* An open panel covers the page, so the page behind it must not scroll,
     and Escape has to close it, because a full-screen overlay with no visible
     way out is a trap for anyone not using a mouse. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      /* `setOpenedAt` directly, not the `setOpen` wrapper: the wrapper closes
         over `pathname` and would have to be a dependency of this effect,
         which would then tear down and re-add the listener on navigation for
         no reason. Closing needs no path. */
      if (event.key === "Escape") setOpenedAt(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const accountStrings = {
    account: dict.common.account,
    signedInAs: dict.common.signedInAs,
    signOut: dict.common.signOut,
  };

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="topbar__sentinel" />

      <header
        className="topbar"
        data-lifted={lifted || undefined}
        data-open={open || undefined}
      >
        <div className="topbar__row">
          {/* Left: the one way in to everything. The word is next to the
              glyph because three stacked lines alone is a symbol a good
              many readers have to learn, and there is room for the word. */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? dict.common.closeMenu : dict.common.openMenu}
            className="topbar__menu"
          >
            <span className="topbar__burger" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className={cn("topbar__menu-word", textClass(lang))}>
              {dict.common.menu}
            </span>
          </button>

          {/* Middle: the name, stacked and tracked wide. The mark rides
              above it rather than beside it, which is what lets the whole
              lockup stay centred on the page's axis at any width. */}
          <Link
            href={href("/")}
            className="topbar__brand"
            aria-label={`${site.name}, ${dict.common.home}`}
          >
            <BrandMark className="topbar__brand-mark" />
            {/* `.bn` is what turns off the Latin tracking on this lockup:
                the global rule in globals.css keys off that class, and a
                Bengali conjunct set at 0.13em comes apart into its parts. */}
            <span
              className={cn("topbar__brand-name", textClass(lang))}
              aria-hidden="true"
            >
              <span className="topbar__brand-line">
                {lang === "bn" ? "মাতৃত্ব" : "Maternity"}
              </span>
              <span className="topbar__brand-sub">
                {lang === "bn" ? "বুক ব্যাংক" : "Book Bank"}
              </span>
            </span>
          </Link>

          {/* Right: search, theme, and the way back out. Search stays out
              of the panel because it is the one control a reader reaches
              for mid-task rather than while deciding where to go, and
              signing out sits beside it for the same reason: it used to be
              a panel on the catalogue page, where it was a piece of account
              furniture in the middle of the shelves. The header is where a
              reader looks for it, and putting it here means every page has
              it rather than one.

              The placeholder while the session is still unknown is not
              cosmetic: without it the icons shift sideways the moment the
              answer arrives. */}
          <div className="topbar__utility">
            <Link
              href={href("/search")}
              aria-label={dict.common.searchTheCatalogue}
              className="topbar__icon"
            >
              <Search className="size-[17px]" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            {loading ? (
              <span className="topbar__icon" aria-hidden="true" />
            ) : session ? (
              <>
                {/* The administrator's one route in. It was on the catalogue
                    page, next to the sign-out that has just moved here, and
                    leaving it behind would have stranded /admin. */}
                {session.admin && (
                  <Link
                    href={href("/admin")}
                    aria-label={dict.catalogue.adminTools}
                    title={dict.catalogue.adminTools}
                    className="topbar__icon"
                  >
                    <LayoutDashboard className="size-[17px]" aria-hidden="true" />
                  </Link>
                )}
                <SignOutButton
                  label=""
                  srLabel={dict.common.signOut}
                  className="topbar__icon"
                  icon
                />
              </>
            ) : (
              <SignInLink
                href={href("/signin")}
                label={dict.common.signIn}
                className="topbar__icon"
              />
            )}
          </div>
        </div>
      </header>

      {/* --- The panel --------------------------------------------------
          Full-screen, and it is the whole navigation: the same five links
          at every width, set large. `inert` while closed keeps its links
          out of the tab order without needing to unmount them, so the
          panel can animate out rather than vanish.
          -------------------------------------------------------------- */}
      <div
        id="site-menu"
        className="sheet"
        data-open={open || undefined}
        inert={!open}
      >
        <nav className="sheet__nav" aria-label={dict.common.mainNav}>
          <ol className="sheet__list">
            {site.nav.map((item, i) => {
              const target = href(item.href);
              const active =
                pathname === target || pathname.startsWith(`${target}/`);
              return (
                <li
                  key={item.href}
                  className="sheet__item"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Link
                    href={target}
                    aria-current={active ? "page" : undefined}
                    className={cn("sheet__link", textClass(lang))}
                    data-active={active || undefined}
                    onClick={() => setOpenedAt(null)}
                  >
                    <span className="sheet__n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {dict.nav[item.key]}
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="sheet__foot">
            <Link
              href={href("/books")}
              className="sheet__cta"
              onClick={() => setOpenedAt(null)}
            >
              <span className={textClass(lang)}>{dict.common.browseLibrary}</span>
            </Link>

            <div className="sheet__aside">
              <LanguageSwitch lang={lang} label={dict.common.switchLanguage} />
              {session ? (
                <AccountPanel
                  lang={lang}
                  session={session}
                  strings={accountStrings}
                  onSignOut={() => setOpen(false)}
                />
              ) : (
                !loading && (
                  <Link
                    href={href("/signin")}
                    className={cn("sheet__signin", textClass(lang))}
                    onClick={() => setOpenedAt(null)}
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    {dict.common.signIn}
                  </Link>
                )
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
