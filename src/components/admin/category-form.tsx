"use client";

import { useActionState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { createCategoryAction, type ActionState } from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

const empty: ActionState = { ok: false };

export function CategoryForm({
  lang,
}: {
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    empty,
  );
  const errors = state.errors ?? {};
  const bn = textClass(lang);
  const f = dict.admin.form;

  /** The icon set the public category cards can render. */
  const icons = [
    { value: "BookOpen", label: f.iconBookOpen },
    { value: "Feather", label: f.iconFeather },
    { value: "Landmark", label: f.iconLandmark },
    { value: "Atom", label: f.iconAtom },
    { value: "Baby", label: f.iconBaby },
    { value: "Library", label: f.iconLibrary },
  ];

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-surface p-6 shadow-e1"
    >
      <input type="hidden" name="lang" value={lang} />

      <h2 className={cn("font-semibold text-ink", bn)}>{dict.admin.openShelf}</h2>

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
        <Field label={f.shelfName} htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            placeholder={f.shelfNamePlaceholder}
            className={fieldClass(errors.name)}
          />
        </Field>

        <Field label={f.shelfNameBn} htmlFor="nameBn" error={errors.nameBn}>
          <input
            id="nameBn"
            name="nameBn"
            placeholder={f.shelfNameBnPlaceholder}
            className={cn(fieldClass(errors.nameBn), "bn")}
          />
        </Field>

        <Field
          label={f.shelfDescription}
          htmlFor="description"
          error={errors.description}
          hint={f.shelfDescriptionHint}
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            className={cn(fieldClass(errors.description), "h-auto resize-y py-3")}
          />
        </Field>

        <Field
          label={f.shelfDescriptionBn}
          htmlFor="descriptionBn"
          error={errors.descriptionBn}
          hint={f.optional}
        >
          <textarea
            id="descriptionBn"
            name="descriptionBn"
            rows={3}
            className={cn(
              fieldClass(errors.descriptionBn),
              "bn h-auto resize-y py-3",
            )}
          />
        </Field>

        <Field label={f.icon} htmlFor="icon" error={errors.icon}>
          <select
            id="icon"
            name="icon"
            defaultValue="BookOpen"
            className={cn(fieldClass(errors.icon), bn)}
          >
            {icons.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
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
          <Plus className="size-4" aria-hidden="true" />
        )}
        {f.createShelf}
      </Button>
    </form>
  );
}
