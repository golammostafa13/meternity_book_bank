import type { LucideIcon } from "lucide-react";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

/**
 * Dashboard stat tile.
 *
 * A slab, not a rectangle: the `tile3d` treatment gives it a lit top bevel and
 * a shadow it sits in, which is the same physical logic the covers use. The
 * number is the loudest thing on it: everything else is support.
 */
export function StatTile({
  label,
  value,
  sub,
  Icon,
  lang = defaultLocale,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  lang?: Locale;
  /** One tile per row may carry the accent; more than one and it stops meaning anything. */
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tile3d rounded-2xl border border-line bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm text-ink-mute", textClass(lang))}>{label}</p>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
            accent
              ? "bg-accent text-accent-ink shadow-e1"
              : "bg-accent-soft text-accent",
          )}
        >
          <Icon className="size-[17px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[2rem] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>
      {sub && (
        <p className={cn("mt-2 text-sm text-ink-faint", textClass(lang))}>
          {sub}
        </p>
      )}
    </div>
  );
}
