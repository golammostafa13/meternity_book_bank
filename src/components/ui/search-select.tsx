"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A searchable select: one text input, a filtered listbox, and a hidden field
 * that carries the chosen id into an ordinary form POST.
 *
 * Why this exists rather than a dependency: the District field has 64 options
 * and the Thana field up to 16, in two scripts, and a plain `<select>` with 64
 * `<option>`s is unusable on a phone. Radix has no combobox primitive, and
 * `@radix-ui/react-select` (which this project inherited and no longer
 * installs) is a select, not a combobox: it has no search. `cmdk` would do it,
 * but this is 200 lines and the form is the only caller.
 *
 * Three things it has to get right.
 *
 * **It has to work inside a `<form action={serverAction}>` with no state
 * plumbing.** The chosen value lives in a hidden `<input name>`, so the Server
 * Action reads `formData.get("district")` exactly as it reads a text field. The
 * parent is told about changes through `onChange` only because the Thana field
 * has to react to the District one, not because the form needs it.
 *
 * **It has to be usable before hydration.** Until the effect below runs, this
 * renders a real `<select>` carrying the same `name`. A reader on a slow
 * connection who submits early sends a valid value; they just do not get the
 * search box. This is the same reasoning as the language switch being a plain
 * link.
 *
 * **It has to be operable from the keyboard and announced.** `role="combobox"`
 * with `aria-expanded`/`aria-controls` on the input, `role="listbox"` on the
 * popup, `aria-selected` per option, and `aria-activedescendant` pointing at
 * the highlighted row, which is what lets a screen reader read the option
 * without moving focus off the text field it is being typed into.
 */

export interface SearchOption {
  id: string;
  label: string;
  /** Matched as well as `label`, so Bengali input finds Bengali names. */
  labelAlt?: string;
  /** Matched but never shown: old spellings, romanisations. */
  aliases?: readonly string[];
  /** Shown greyed beside the label: the division, mostly. */
  note?: string;
}

/**
 * Fold to something comparable: lower case, no Latin diacritics, no punctuation.
 *
 * `"Cox's Bazar"` has to be found by typing `coxs bazar` or `cox bazar`. The
 * decompose-and-strip step is scoped to the Latin combining range (U+0300-
 * U+036F) on purpose: a blanket NFD strip would take Bengali vowel signs off
 * their consonants and make every Bengali name unsearchable, which is the
 * opposite of the point.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function matches(option: SearchOption, query: string): boolean {
  if (!query) return true;
  const haystack = [option.label, option.labelAlt, ...(option.aliases ?? [])]
    .filter(Boolean)
    .map((value) => fold(value as string));
  // Every whitespace-separated term must appear somewhere. "cox baz" finds
  // Cox's Bazar; "baz cox" finds it too, which is what someone typing fast
  // expects and what a plain `startsWith` would refuse.
  return fold(query)
    .split(" ")
    .every((term) => haystack.some((value) => value.includes(term)));
}

export function SearchSelect({
  name,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
  disabledLabel,
  id,
  className,
  bnClass,
}: {
  name: string;
  options: readonly SearchOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  /** Shown when the query matches nothing. */
  emptyLabel: string;
  disabled?: boolean;
  /** Shown in place of the placeholder while disabled: says *why*. */
  disabledLabel?: string;
  id?: string;
  className?: string;
  /** The `.bn` class, when this form is rendering in Bengali. */
  bnClass?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  const listId = `${fieldId}-list`;

  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The pre-hydration <select> swap. Deliberately in an effect rather than a
  // `typeof window` check: the server and the first client render have to agree
  // or React replaces the field mid-type.
  useEffect(() => setHydrated(true), []);

  const selected = useMemo(
    () => options.find((option) => option.id === value),
    [options, value],
  );

  const filtered = useMemo(
    () => options.filter((option) => matches(option, query)),
    [options, query],
  );

  // A filter that shortens the list can leave the highlight past the end of it.
  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Keep the highlighted row in view when it moves by keyboard rather than by
  // pointer: `scrollIntoView` on the row, not the list, so it scrolls the
  // minimum distance.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(option: SearchOption) {
    onChange(option.id);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => {
        if (filtered.length === 0) return 0;
        return (current + step + filtered.length) % filtered.length;
      });
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!open) return;
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : filtered.length - 1);
      return;
    }
    if (event.key === "Enter") {
      // Only swallow Enter while the list is open with something under the
      // cursor. Otherwise it must reach the form and submit it.
      if (open && filtered[active]) {
        event.preventDefault();
        commit(filtered[active]);
      }
      return;
    }
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setQuery("");
      }
      return;
    }
    if (event.key === "Backspace" && !query && value) {
      // Backspace on an empty box unpicks the current choice, the way a chip
      // in a tag field would.
      event.preventDefault();
      clear();
    }
  }

  // The pre-hydration fallback, and the whole field when JavaScript never
  // arrives. Carries `name` itself, so it submits.
  if (!hydrated) {
    return (
      <div className={className}>
        <select
          id={fieldId}
          name={name}
          defaultValue={value}
          disabled={disabled}
          className={cn(
            "h-12 w-full appearance-none rounded-xl border border-line bg-bg px-4 text-[0.95rem] text-ink",
            disabled && "opacity-60",
            bnClass,
          )}
        >
          <option value="">{disabled ? disabledLabel : placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const shown = open ? query : (selected?.label ?? "");

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />

      <div className="relative">
        {open ? (
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
        ) : null}

        <input
          ref={inputRef}
          id={fieldId}
          role="combobox"
          type="text"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[active] ? `${listId}-${active}` : undefined
          }
          value={shown}
          placeholder={disabled ? disabledLabel : placeholder}
          onFocus={() => !disabled && setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "h-12 w-full rounded-xl border bg-bg pr-20 text-[0.95rem] text-ink shadow-[inset_0_1px_2px_rgba(94,24,60,0.06)] placeholder:text-ink-faint focus:outline-none",
            open ? "border-accent pl-11" : "border-line pl-4",
            disabled && "cursor-not-allowed opacity-60",
            bnClass,
          )}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !disabled ? (
            <button
              type="button"
              onClick={clear}
              // The label is the only text on a 32px target, so it has to say
              // which field is being cleared: there are two on this form.
              aria-label={`${placeholder}: clear`}
              className="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <ChevronDown
            className={cn(
              "mr-1 size-4 text-ink-faint transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Rendered only while open: 494 thana rows in the document at all times
          would be 494 rows for a screen reader to walk past. */}
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface-2 py-1.5 shadow-e3"
        >
          {filtered.length === 0 ? (
            <li
              role="presentation"
              className={cn("px-4 py-3 text-sm text-ink-faint", bnClass)}
            >
              {emptyLabel}
            </li>
          ) : (
            filtered.map((option, index) => {
              const isActive = index === active;
              const isChosen = option.id === value;
              return (
                <li key={option.id} role="none">
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    data-index={index}
                    aria-selected={isChosen}
                    // Pointer-down rather than click: the document-level
                    // pointerdown listener above closes the popup, and a click
                    // handler would fire after it had already gone.
                    onPointerDown={(event) => {
                      event.preventDefault();
                      commit(option);
                    }}
                    onPointerEnter={() => setActive(index)}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[0.95rem]",
                      isActive ? "bg-accent-soft text-accent" : "text-ink",
                      bnClass,
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.note ? (
                      <span className="shrink-0 text-xs text-ink-faint">
                        {option.note}
                      </span>
                    ) : null}
                    {isChosen ? (
                      <Check className="size-4 shrink-0" aria-hidden="true" />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
