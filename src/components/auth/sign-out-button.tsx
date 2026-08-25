import { LogOut } from "lucide-react";
import { leaveAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

/**
 * Sign out. A plain form posting to a Server Action: no client JS, and it
 * cannot be triggered by a GET, which is what stops a stray <img src> or a
 * prefetch from logging the librarian out.
 */
export function SignOutButton({
  label = "Sign out",
  srLabel,
  className,
  icon = false,
}: {
  /** Empty renders an icon-only button; pass `srLabel` for its name then. */
  label?: string;
  /** The accessible name when there is no visible label to be one. */
  srLabel?: string;
  className?: string;
  icon?: boolean;
}) {
  const name = label || srLabel || "Sign out";
  return (
    <form action={leaveAction}>
      <button
        type="submit"
        aria-label={name}
        title={name}
        className={cn(
          "inline-flex items-center gap-2 transition-colors",
          /* Only when it is a text button. Icon-only, it is dropped into a
             class of its own (the header's `.topbar__icon`) and these would
             fight it for the same properties. */
          label && "text-sm text-ink-mute hover:text-ink",
          className,
        )}
      >
        {icon && <LogOut className="size-[17px]" aria-hidden="true" />}
        {label}
      </button>
    </form>
  );
}
