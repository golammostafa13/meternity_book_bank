"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import { leaveAction } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import type { SessionSummary } from "@/lib/auth/use-session";
import { cn } from "@/lib/utils";

/**
 * The signed-in reader's name in the header, and the way back out.
 *
 * The avatar is the first letter of the name rather than the Google profile
 * picture the session may carry. This site tells its readers, in as many words,
 * that it loads no third-party scripts and builds no profile of what they read;
 * fetching an image from Google's servers on every page would put a request to
 * Google in every page load, which is not that promise kept.
 *
 * Signing out is a form posting to a Server Action, so it cannot happen on a
 * GET: a prefetch or a stray <img src> must never be able to log someone out.
 */

interface Strings {
  account: string;
  signedInAs: string;
  signOut: string;
}

/** The bar, from `sm` up. Collapses to the avatar alone below `lg`. */
export function AccountMenu({
  lang,
  session,
  strings,
  className,
}: {
  lang: Locale;
  session: SessionSummary;
  strings: Strings;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    // Escape closes and puts focus back where it started, which is the button
    // the menu belongs to: otherwise a keyboard reader is left at the top of
    // the document.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      root.current?.querySelector("button")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={`${strings.account}: ${session.name}`}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-1 text-sm transition-colors hover:border-accent/40 hover:bg-accent-soft lg:pr-2.5",
          open && "border-accent/40 bg-accent-soft",
        )}
      >
        <Avatar name={session.name} />
        {/* The name itself only from `lg`: the bar holds the wordmark, the nav
            and four controls, and a name of any length is the first thing that
            pushes them out of a laptop width. Below that the avatar stands for
            it, and the menu spells it out. */}
        <span className="hidden max-w-[10rem] truncate font-semibold text-ink lg:block">
          {session.name}
        </span>
        <ChevronDown
          className={cn(
            "hidden size-4 shrink-0 text-ink-faint transition-transform lg:block",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-line bg-bg shadow-e3"
        >
          <div className="border-b border-line/60 px-4 py-3">
            <p className="text-[0.7rem] uppercase tracking-wide text-ink-faint">
              {strings.signedInAs}
            </p>
            <p className="truncate font-semibold text-ink">{session.name}</p>
          </div>

          <SignOutForm
            lang={lang}
            label={strings.signOut}
            onSubmit={() => setOpen(false)}
            className="w-full px-4 py-3 text-left text-sm text-ink-mute hover:bg-surface hover:text-ink"
          />
        </div>
      )}
    </div>
  );
}

/**
 * The same account inside the mobile menu panel, laid out flat.
 *
 * A dropdown inside a drawer is a menu inside a menu; at this width there is
 * room to simply show the name and the way out.
 */
export function AccountPanel({
  lang,
  session,
  strings,
  onSignOut,
}: {
  lang: Locale;
  session: SessionSummary;
  strings: Strings;
  onSignOut?: () => void;
}) {
  return (
    <div className="mt-1 border-t border-line/60 pt-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar name={session.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{session.name}</p>
        </div>
      </div>
      <SignOutForm
        lang={lang}
        label={strings.signOut}
        onSubmit={onSignOut}
        className="w-full rounded-xl px-3 py-3 text-left text-lg text-ink-mute hover:bg-surface hover:text-ink"
      />
    </div>
  );
}

/** The signed-out header control: the sign-in link, unchanged. */
export function SignInLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link href={href} aria-label={label} title={label} className={className}>
      <LogIn className="size-[18px]" aria-hidden="true" />
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold uppercase text-accent-ink"
    >
      {/* From the code points, not `name[0]`: a Bengali name's first letter is
          not its first UTF-16 unit, and half a surrogate pair renders as a
          replacement character. */}
      {[...name.trim()][0] ?? "?"}
    </span>
  );
}

function SignOutForm({
  lang,
  label,
  className,
  onSubmit,
}: {
  lang: Locale;
  label: string;
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <form action={leaveAction} onSubmit={onSubmit}>
      {/* A Server Action cannot read route params, so the language it should
          land in travels with the post, same as every other form here. */}
      <input type="hidden" name="lang" value={lang} />
      <button
        type="submit"
        role="menuitem"
        className={cn(
          "inline-flex items-center gap-2 transition-colors",
          className,
        )}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
