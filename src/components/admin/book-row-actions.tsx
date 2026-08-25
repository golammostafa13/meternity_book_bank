"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Pencil, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { deleteBookAction, setBookStatusAction } from "@/lib/actions/admin";
import { getDictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { bookTitle, textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/format";
import type { Book } from "@/types";

/**
 * Per-row controls for the admin book table.
 *
 * Deliberately three buttons rather than a dropdown: a librarian working
 * through a delivery hits the same two actions over and over, and a menu adds
 * a click to both. Destructive delete confirms inline instead of in a modal:
 * the row stays visible, so there is no doubt about which book is going.
 */
export function BookRowActions({
  book,
  lang,
}: {
  book: Book;
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const lendingOut = book.status === "available";
  const title = bookTitle(book, lang);

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className={cn("text-xs text-ink-mute", textClass(lang))}>
          {dict.admin.withdrawConfirm}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const data = new FormData();
              data.set("id", book.id);
              await deleteBookAction(data);
            })
          }
          className="rounded-full bg-danger px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? dict.admin.removing : dict.admin.yes}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-line px-3 py-1 text-xs text-ink-mute hover:text-ink"
        >
          {dict.admin.no}
        </button>
      </div>
    );
  }

  const lendLabel = fill(
    lang,
    lendingOut ? dict.admin.markOnLoanOf : dict.admin.markAvailableOf,
    { title },
  );

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={localePath(lang, `/admin/books/${book.id}`)}
        aria-label={fill(lang, dict.admin.editOf, { title })}
        title={dict.admin.edit}
        className={iconButton}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Link>

      <button
        type="button"
        aria-label={lendLabel}
        title={lendingOut ? dict.admin.markOnLoan : dict.admin.markAvailable}
        disabled={pending}
        className={iconButton}
        onClick={() =>
          run(async () => {
            const data = new FormData();
            data.set("id", book.id);
            data.set("status", lendingOut ? "borrowed" : "available");
            await setBookStatusAction(data);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : lendingOut ? (
          <Undo2 className="size-4" aria-hidden="true" />
        ) : (
          <RotateCcw className="size-4" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        aria-label={fill(lang, dict.admin.withdrawOf, { title })}
        title={dict.admin.withdraw}
        onClick={() => setConfirming(true)}
        className={cn(iconButton, "hover:bg-danger-soft hover:text-danger")}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Shared 36px hit target for every row control. */
const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50";
