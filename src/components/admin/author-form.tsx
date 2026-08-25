"use client";

import { useActionState } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { createAuthorAction, type ActionState } from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

const empty: ActionState = { ok: false };

/**
 * Add a writer. Small enough to live beside the list rather than behind a
 * route: a librarian usually discovers a missing author while cataloguing,
 * and a full page navigation there loses their place.
 */
export function AuthorForm({
  lang,
}: {
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const [state, formAction, pending] = useActionState(
    createAuthorAction,
    empty,
  );
  const errors = state.errors ?? {};
  const bn = textClass(lang);
  const f = dict.admin.form;

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-surface p-6 shadow-e1"
    >
      <input type="hidden" name="lang" value={lang} />

      <h2 className={cn("font-semibold text-ink", bn)}>{dict.admin.addWriter}</h2>

      {state.message && (
        <p
          role="status"
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
            bn,
            state.ok
              ? "border-ok/30 bg-ok-soft text-ok"
              : "border-danger/30 bg-danger-soft text-danger",
          )}
        >
          {state.ok && <Check className="size-4 shrink-0" aria-hidden="true" />}
          {state.message}
        </p>
      )}

      <div className="mt-5 grid gap-5">
        <Field label={f.writerName} htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            placeholder={f.writerNamePlaceholder}
            className={fieldClass(errors.name)}
          />
        </Field>

        <Field
          label={f.writerNameBn}
          htmlFor="nameBn"
          error={errors.nameBn}
          hint={f.optional}
        >
          <input
            id="nameBn"
            name="nameBn"
            placeholder={f.writerNameBnPlaceholder}
            className={cn(fieldClass(errors.nameBn), "bn")}
          />
        </Field>

        <Field label={f.era} htmlFor="era" error={errors.era} hint={f.eraHint}>
          <input
            id="era"
            name="era"
            placeholder="1861-1941"
            className={fieldClass(errors.era)}
          />
        </Field>

        <Field label={f.biography} htmlFor="bio" error={errors.bio}>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className={cn(fieldClass(errors.bio), "h-auto resize-y py-3")}
          />
        </Field>

        <Field
          label={f.biographyBn}
          htmlFor="bioBn"
          error={errors.bioBn}
          hint={f.optional}
        >
          <textarea
            id="bioBn"
            name="bioBn"
            rows={3}
            className={cn(fieldClass(errors.bioBn), "bn h-auto resize-y py-3")}
          />
        </Field>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="mt-6 w-full"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="size-4" aria-hidden="true" />
        )}
        {f.addWriterButton}
      </Button>
    </form>
  );
}
