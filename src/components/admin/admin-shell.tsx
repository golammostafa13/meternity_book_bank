"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookMarked,
  FolderOpen,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LanguageSwitch } from "@/components/language-switch";
import { adminUsername } from "@/lib/auth/username";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

/**
 * Admin chrome: a slim icon rail plus a topbar. Everything under /admin is
 * gated twice: once by the route guard in `proxy.ts` and again inside every
 * Server Action, so anything rendered here is behind the admin password.
 *
 * There is no identity to show. The door is a password, not an account, so the
 * pill in the corner is the handle and the handle is a constant: whoever is at
 * the desk, the administrator is the same one. This used to take a `librarian`
 * prop carrying an email address and a Google avatar; both are gone with the
 * accounts they belonged to.
 */

/**
 * Two letters for the fallback avatar. Splits on spaces *and* hyphens, because
 * the account is a handle rather than a person's name: `maternity-book-bank`
 * gives "MB". Numeric segments are skipped; a digit is not an initial.
 */
function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((part) => /^[a-z]/i.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const nav = [
  { href: "/admin", key: "dashboard", Icon: LayoutDashboard },
  { href: "/admin/books", key: "books", Icon: BookMarked },
  { href: "/admin/authors", key: "authors", Icon: Users },
  { href: "/admin/categories", key: "categories", Icon: FolderOpen },
] as const;

/**
 * Only the administrator can reach these screens, so the handle shown in the
 * topbar is always `adminUsername`: it is not carried in the session, because
 * the session does not know it is the admin's. The address is.
 */
export function AdminShell({
  title,
  breadcrumb,
  actions,
  lang,
  children,
}: {
  title: string;
  breadcrumb: string;
  actions?: React.ReactNode;
  lang: Locale;
  children: React.ReactNode;
}) {
  const dict = getDictionary(lang);
  const pathname = usePathname();
  const href = (path: string) => localePath(lang, path);
  const bn = textClass(lang);

  return (
    <div className="flex min-h-dvh bg-bg-deep">
      {/* Icon rail */}
      <aside className="sticky top-0 flex h-dvh w-[74px] shrink-0 flex-col items-center gap-2 border-r border-line/60 bg-surface py-5">
        <Link href={href("/")} aria-label={dict.common.home} className="mb-4">
          <Brand markOnly size="md" />
        </Link>

        <nav aria-label="Admin" className="flex flex-col gap-1.5">
          {nav.map(({ href: path, key, Icon }) => {
            const target = href(path);
            const label = dict.admin[key];
            const active =
              path === "/admin" ? pathname === target : pathname.startsWith(target);
            return (
              <Link
                key={path}
                href={target}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-accent text-accent-ink shadow-e2"
                    : "text-ink-mute hover:bg-accent-soft hover:text-accent",
                )}
              >
                <Icon className="size-[19px]" />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1.5">
          <button
            type="button"
            title={dict.admin.settings}
            aria-label={dict.admin.settings}
            className="inline-flex size-11 items-center justify-center rounded-xl text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <Settings className="size-[19px]" />
          </button>
          <Link
            href={href("/books")}
            title={dict.admin.publicCatalogue}
            aria-label={dict.admin.publicCatalogue}
            className="inline-flex size-11 items-center justify-center rounded-xl text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <Library className="size-[19px]" />
          </Link>
          <SignOutButton
            label=""
            icon
            className="inline-flex size-11 items-center justify-center rounded-xl text-ink-mute hover:bg-accent-soft hover:text-accent"
          />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[74px] items-center gap-4 border-b border-line/60 bg-surface px-6">
          <div className="min-w-0">
            <h1 className={cn("truncate text-lg font-semibold text-ink", bn)}>
              {title}
            </h1>
            <p className={cn("text-xs text-ink-faint", bn)}>{breadcrumb}</p>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {actions}
            <button
              type="button"
              aria-label={dict.common.search}
              className="inline-flex size-10 items-center justify-center rounded-full text-ink-mute hover:bg-accent-soft hover:text-accent"
            >
              <Search className="size-[18px]" />
            </button>
            <button
              type="button"
              aria-label={dict.admin.notifications}
              className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-mute hover:bg-accent-soft hover:text-accent"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
            </button>
            <LanguageSwitch lang={lang} label={dict.common.switchLanguage} />
            <ThemeToggle />

            <div className="ml-2 flex items-center gap-2.5 border-l border-line pl-4">
              <span
                aria-hidden="true"
                className="inline-flex size-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent"
              >
                {initialsOf(adminUsername)}
              </span>
              <div className="hidden leading-tight sm:block">
                {/* The handle, not a person's name: whoever is at the desk, the
                    account is the same one. Monospaced so it reads as an id. */}
                <p className="font-mono text-sm font-medium text-ink">
                  {adminUsername}
                </p>
                <p className="max-w-40 truncate text-xs text-ink-faint">
                  {dict.admin.signedIn}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
