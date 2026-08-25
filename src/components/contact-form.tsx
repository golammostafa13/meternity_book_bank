"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

/**
 * Contact form.
 *
 * Validation lives in a Zod schema rather than in the handler, so the exact
 * same schema can be reused server-side once a real endpoint exists: the
 * client check is for ergonomics, never for trust. The messages come from the
 * dictionary, so a Bengali reader is corrected in Bengali.
 */
function contactSchema(dict: Dictionary) {
  return z.object({
    name: z.string().min(2, dict.contact.errorName),
    email: z.string().email(dict.contact.errorEmail),
    subject: z.enum(["suggestion", "problem", "donation", "other"]),
    message: z
      .string()
      .min(10, dict.contact.errorMessageShort)
      .max(2000, dict.contact.errorMessageLong),
  });
}

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export function ContactForm({
  lang,
}: {
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const bn = textClass(lang);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = contactSchema(dict).safeParse(data);

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    // Demo build: no endpoint is wired up yet. The real submit posts to a
    // Turnstile-protected route handler.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start justify-center rounded-3xl border border-line bg-surface p-10 shadow-e2">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-ok-soft text-ok">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h2 className={cn("mt-6 text-2xl font-bold text-ink", bn)}>
          {dict.contact.sentTitle}
        </h2>
        <p className={cn("mt-3 text-ink-mute", bn)}>{dict.contact.sentBody}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-8"
          onClick={() => setSent(false)}
        >
          {dict.contact.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-line bg-surface p-8 shadow-e2 lg:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.contact.formName} error={errors.name} htmlFor="name">
          <input
            id="name"
            name="name"
            autoComplete="name"
            className={cn(fieldClass(errors.name), bn)}
            placeholder={dict.contact.formNamePlaceholder}
          />
        </Field>

        <Field
          label={dict.contact.formEmail}
          error={errors.email}
          htmlFor="email"
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass(errors.email)}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label={dict.contact.formSubject}
          error={errors.subject}
          htmlFor="subject"
        >
          <select
            id="subject"
            name="subject"
            defaultValue="suggestion"
            className={cn(fieldClass(errors.subject), bn)}
          >
            <option value="suggestion">{dict.contact.subjectSuggestion}</option>
            <option value="problem">{dict.contact.subjectProblem}</option>
            <option value="donation">{dict.contact.subjectDonation}</option>
            <option value="other">{dict.contact.subjectOther}</option>
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label={dict.contact.formMessage}
          error={errors.message}
          htmlFor="message"
        >
          <textarea
            id="message"
            name="message"
            rows={6}
            className={cn(fieldClass(errors.message), bn, "h-auto resize-y py-3")}
            placeholder={dict.contact.formMessagePlaceholder}
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full">
        <Send className="size-4" aria-hidden="true" />
        {dict.contact.send}
      </Button>

      <p className={cn("mt-4 text-center text-xs text-ink-faint", bn)}>
        {dict.contact.turnstile}
      </p>
    </form>
  );
}
