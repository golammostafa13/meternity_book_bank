import type { Dictionary } from "@/lib/i18n";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types";

/**
 * Inventory status pill: the Available / On loan / Damaged / Lost states from
 * the admin reference. Colour alone never carries the meaning; the label is
 * always present, and always in the reader's language.
 */

const styles: Record<BookStatus, string> = {
  available: "bg-ok-soft text-ok",
  borrowed: "bg-warn-soft text-warn",
  damaged: "bg-danger-soft text-danger",
  lost: "bg-neutral-soft text-neutral",
};

export function StatusPill({
  status,
  dict,
  lang = defaultLocale,
  className,
}: {
  status: BookStatus;
  dict: Dictionary;
  lang?: Locale;
  className?: string;
}) {
  const labels: Record<BookStatus, string> = {
    available: dict.admin.statusAvailable,
    borrowed: dict.admin.statusOnLoan,
    damaged: dict.admin.statusDamaged,
    lost: dict.admin.statusLost,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
        textClass(lang),
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}
