"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { enterAction, type DoorState } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

const empty: DoorState = { ok: false };

/**
 * The door. One field.
 *
 * Two details are doing more work than they look.
 *
 * `key={attempt}` remounts the input on every rejection. The `attempt` counter
 * exists only for that: without it, a second identical rejection changes nothing
 * in the DOM, so a screen reader announces nothing and a reader who mistyped the
 * same word twice gets no feedback at all.
 *
 * The reveal toggle is not a nicety here. The password is a word copied off a
 * printed page, often on a phone, often by someone who is tired, and this field
 * is the only thing between them and the library. Being able to see what you
 * typed is the difference between one attempt and three.
 */
export function DoorForm({ lang, next = "" }: { lang: Locale; next?: string }) {
  const dict = getDictionary(lang);
  const [state, formAction, pending] = useActionState(enterAction, empty);
  const [shown, setShown] = useState(false);
  const bn = textClass(lang);

  const attempt = state.attempt ?? 0;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="password"
          className={cn("mb-2 block text-sm font-medium text-ink", bn)}
        >
          {dict.auth.passwordLabel}
        </label>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            key={`password-${attempt}`}
            id="password"
            name="password"
            type={shown ? "text" : "password"}
            // Not `current-password`: there is no account, so there is nothing
            // for a password manager to have saved and offering to save it
            // teaches the browser a credential that belongs to a print run.
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            placeholder={dict.auth.passwordPlaceholder}
            className={fieldClass(undefined, "pl-11 pr-12")}
          />
          <button
            type="button"
            onClick={() => setShown((value) => !value)}
            aria-label={shown ? dict.auth.hidePassword : dict.auth.showPassword}
            aria-pressed={shown}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-accent-soft hover:text-accent"
          >
            {shown ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {state.message && (
        <p
          role="alert"
          className={cn(
            "flex items-start gap-2 text-sm text-danger",
            bn,
          )}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-6! w-full"
        disabled={pending}
      >
        {pending ? dict.auth.entering : dict.auth.enter}
      </Button>
    </form>
  );
}
