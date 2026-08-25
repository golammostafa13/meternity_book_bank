"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

/**
 * Theme toggle.
 *
 * Both icons are always rendered and CSS picks the visible one from the `.dark`
 * class that the theme provider writes onto <html>. That keeps the markup
 * identical on the server and the client: no mount flag, no effect, and
 * nothing for React to report as a hydration mismatch.
 *
 * The label stays constant for the same reason; "Switch theme" is accurate in
 * both directions.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Switch theme"
      title="Switch theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex size-10 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent"
    >
      <Sun className="hidden size-[18px] dark:block" aria-hidden="true" />
      <Moon className="size-[18px] dark:hidden" aria-hidden="true" />
    </button>
  );
}
