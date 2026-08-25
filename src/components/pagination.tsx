import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Link-based pagination: real <a> hrefs, so pages are crawlable and each
 * one can be prerendered and cached independently.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  dict,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  /** Already locale-prefixed by the caller. */
  basePath: string;
  dict: Dictionary;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Window of pages around the current one, with ellipses at the edges.
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <nav
      aria-label={dict.common.pagination}
      className="mt-14 flex items-center justify-center gap-1.5"
    >
      <PageLink
        href={href(page - 1)}
        disabled={page <= 1}
        label={dict.common.previousPage}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </PageLink>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full text-sm transition-colors",
              p === page
                ? "bg-accent font-semibold text-accent-ink shadow-e1"
                : "text-ink-mute hover:bg-accent-soft hover:text-accent",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <PageLink
        href={href(page + 1)}
        disabled={page >= totalPages}
        label={dict.common.nextPage}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-full text-ink-faint opacity-40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line text-ink-mute transition-colors hover:border-ink/30 hover:text-ink"
    >
      {children}
    </Link>
  );
}
