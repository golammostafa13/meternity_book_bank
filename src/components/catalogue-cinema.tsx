import Link from "next/link";
import { ArrowRight, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { CatalogueFilterRow } from "@/components/catalogue-filter-row";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import type { Book } from "@/types";

/**
 * The catalogue's front: one dark room, the filters as the only controls in it,
 * and whichever book the current filter puts first standing in the middle.
 *
 * The grid is still the catalogue and it is still directly below. What this
 * replaces is the stack of headings, search field and select boxes that used to
 * sit above it, which was a form with a title on top. The reference site does
 * this with its four ingredients: name the section, name the thing, put the
 * choices within reach, and then show one item properly rather than sixteen
 * thumbnails. A catalogue can borrow all of that without giving up the
 * grid, because the grid answers a different question ("which of these?") from
 * the one the room answers ("what is this shelf like?").
 *
 * **Zero JavaScript, and the filters are better for it.** Every option is a
 * `<Link>` to the same page with one search parameter changed, the menus are
 * `<details>` elements, and the search box is a plain `method="get"` form. So a filtered view is a URL that can be
 * linked, shared, bookmarked, crawled and cached at the edge; the back button
 * steps through filter changes; and none of it waits on hydration. The client
 * component this replaces pushed the same URLs through the router, which is the
 * same behaviour at the cost of shipping a bundle to get it.
 *
 * The band is dark in both themes. That is the exception this stylesheet already
 * carries for the home hero, written the same way: the palette is redefined once
 * against the same token names (see `.cinema, .cine` in globals.css), so every
 * rule inside still reads `var(--ink)` and nothing here knows it is in the dark.
 */

/** One choice inside a filter's menu. `href` is the whole state change. */
export interface CatalogueOption {
  key: string;
  label: string;
  /** Shown right-aligned beside the label. Absent where there is no count. */
  count?: string;
  href: string;
  active: boolean;
}

/**
 * One filter axis, drawn as a menu button.
 *
 * This used to be a row of pills — every option of every axis laid out flat,
 * which for two seven-item taxonomies plus sort and language came to twenty-
 * three controls stacked above the shelf. Flat is honest but it is not
 * readable: the row wrapped to four lines, the two chosen options were two
 * filled shapes among thirty-three, and the reader had to scan the lot to
 * learn what the catalogue was currently showing them.
 *
 * A button per axis is what every catalogue does, and it is what it does for
 * the reason: the button *states its own answer* ("Subject — Gynecology"), so
 * four buttons say what the shelf is filtered by without the reader reading a
 * single option. The options are one click away, which is the right price for
 * a choice made once.
 *
 * Still no JavaScript. `<details>`/`<summary>` is the disclosure, every option
 * inside is a `<Link>`, and the shared `name` makes the four an exclusive
 * group, so opening one closes the last — the behaviour a menu bar normally
 * needs a listener for, done by the browser.
 */
export interface CatalogueFilter {
  key: string;
  /** Names the axis: "Stage of care", "Subject", "Language", "Sort by". */
  label: string;
  /** The current answer, shown on the button itself: "Gynecology", "All". */
  value: string;
  /**
   * Whether this axis is *narrowing* the shelf. Sort is never active by this
   * measure however it is set: it changes the order, not the contents.
   */
  active: boolean;
  options: CatalogueOption[];
}

/**
 * One filter currently in force, as a chip that removes it.
 *
 * The counterpart to the menu buttons and the half that makes them safe. A
 * button collapses its options out of sight, so on its own it risks a reader
 * forgetting what is set; a chip row spells the whole filter state out in
 * plain words, in one place, and every chip is the way out of itself. "Clear
 * 2 filters" — a number, with nothing to say which two — was what this
 * replaces.
 */
export interface CatalogueChip {
  key: string;
  /** The axis, set small: "Subject". */
  axis: string;
  /** The value: "Gynecology". */
  value: string;
  /** This same view with only this one filter dropped. */
  href: string;
  /** Spoken name for the link, which does a thing its text does not say. */
  removeLabel: string;
}

export interface CatalogueSpecRow {
  label: string;
  value: string;
  /** Small tracked suffix, as on the reference's "500 MG OF 1,150". */
  unit?: string;
  /**
   * 0 to 1. Draws the rule under the row as a measure rather than a divider,
   * which is what turns a figure into a figure with a scale.
   */
  share?: number;
}

export interface CatalogueSpotlight {
  id: string;
  /** The accession code, set small above the name. */
  code: string;
  title: string;
  author: string;
  description: string;
  /** "01 / 16", already in the reader's numerals. */
  counter: string;
  /** Spoken form of the counter, for anyone not seeing it. */
  counterLabel: string;
  spec: CatalogueSpecRow[];
  href: string;
  cover: Pick<
    Book,
    | "id"
    | "title"
    | "titleBn"
    | "authorName"
    | "authorNameBn"
    | "coverHue"
    | "coverImage"
    | "pages"
  >;
}

export interface CatalogueCinemaCopy {
  /** "Catalogue · 16 titles", assembled by the server. */
  eyebrow: string;
  /** The page's h1, set in the italic serif. */
  title: string;
  /** The line across the foot, in tracked capitals. */
  strapline: string;
  searchPlaceholder: string;
  searchLabel: string;
  /** Accessible name for the row of filter menus. */
  filterLabel: string;
  /** Introduces the chip row: "Filtering by". */
  appliedLabel: string;
  openRecord: string;
  /** On the cue that scrolls down to the grid. */
  seeAll: string;
  /** Shown in place of the spotlight when a filter matches nothing. */
  empty: string;
}

interface CatalogueCinemaProps {
  copy: CatalogueCinemaCopy;
  /** One menu button per axis, each with its "all" option first. */
  filters: CatalogueFilter[];
  /** Everything currently narrowing the shelf, one removable chip each. */
  applied: CatalogueChip[];
  /**
   * The way out of all of it at once, set at the end of the chip row. A
   * reader who has combined a stage, a subject and a language should not have
   * to unpick three controls to see the whole shelf again.
   */
  reset?: { label: string; href: string };
  spotlight?: CatalogueSpotlight;
  /** Where the search form posts, and the parameters it must not drop. */
  search: { action: string; keep: Record<string, string | undefined>; q?: string };
  /** Fragment the cue scrolls to. */
  gridHref: string;
  lang?: Locale;
  className?: string;
}

export function CatalogueCinema({
  copy,
  filters,
  applied,
  reset,
  spotlight,
  search,
  gridHref,
  lang = defaultLocale,
  className,
}: CatalogueCinemaProps) {
  /*
   * Closes the open menu once a choice has been made.
   *
   * `<details>` is opened by the browser, not by React, and every option in it
   * is a `<Link>`. The navigation re-renders this component, but React
   * reconciles the *same* `<details>` element — `open` attribute and all — so
   * the panel stayed spread over the spotlight after every selection: the shelf
   * changed underneath a menu that was still covering it.
   *
   * Folding the current answers into the key makes it a different element the
   * moment any axis changes, so React mounts a fresh one, closed, because
   * nobody has clicked this one yet.
   *
   * This is the half that needs no JavaScript, and it is why a choice closes
   * the menu with the bundle blocked. The other two dismissals a menu is owed —
   * a click outside it, and Escape — cannot be had without a listener, and live
   * in `CatalogueFilterRow` below.
   */
  const answers = filters.map((filter) => filter.value).join("|");

  return (
    <section className={cn("cine", className)} aria-labelledby="catalogue-title">
      <div className="cine__inner">
        <header className="cine__head">
          <p className={cn("cine__eyebrow", textClass(lang))}>{copy.eyebrow}</p>
          <h1
            id="catalogue-title"
            className={cn("cine__title", textClass(lang))}
          >
            {copy.title}
            {/* The reference's full stop, in the accent. Not on a Bengali
                title: the script's stop is the danda and it ends a sentence
                rather than a name. */}
            {lang === "bn" ? null : (
              <span className="cine__stop" aria-hidden="true">
                .
              </span>
            )}
          </h1>

          {/* A plain GET form. No `onSubmit`, no router: the browser builds
              the URL, and the parameters already in play ride along as hidden
              fields so searching does not silently clear the filter. */}
          <form className="cine__search" method="get" action={search.action}>
            {Object.entries(search.keep).map(([name, value]) =>
              value ? (
                <input key={name} type="hidden" name={name} value={value} />
              ) : null,
            )}
            <Search className="cine__search-glyph" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={search.q}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchLabel}
              className={cn("cine__search-field", textClass(lang))}
            />
            <button type="submit" className={cn("cine__search-go", textClass(lang))}>
              {copy.searchLabel}
            </button>
          </form>

          {/* --- The four menus ---------------------------------------
              Stage of care, subject, book language, order. One row, one
              shape, one way to work: the sort and language links that used
              to sit under the pills in a third style of their own are the
              same control as the other two now, because from the reader's
              side they always were the same question.
              ------------------------------------------------------------ */}
          <CatalogueFilterRow
            className="cine__filters"
            label={copy.filterLabel}
          >
            {filters.map((filter) => (
              <details
                key={`${filter.key}:${answers}`}
                name="cine-filter"
                className="cine__filter"
              >
                <summary
                  className={cn("cine__filter-btn", textClass(lang))}
                  data-active={filter.active || undefined}
                >
                  <span className="cine__filter-name">{filter.label}</span>
                  <span className="cine__filter-value">{filter.value}</span>
                  <ChevronDown className="cine__filter-chev" aria-hidden="true" />
                </summary>
                <ul className="cine__filter-menu">
                  {filter.options.map((option) => (
                    <li key={option.key}>
                      <Link
                        href={option.href}
                        aria-current={option.active ? "true" : undefined}
                        className={cn("cine__filter-opt", textClass(lang))}
                        data-active={option.active || undefined}
                      >
                        <span className="cine__filter-opt-label">
                          {option.label}
                        </span>
                        {option.count ? (
                          <span className="cine__filter-opt-count">
                            {option.count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </CatalogueFilterRow>

          {/* Present only while something is filtered, so no empty line is
              left behind when it goes. */}
          {applied.length ? (
            <div className="cine__applied">
              <span className={cn("cine__applied-label", textClass(lang))}>
                {copy.appliedLabel}
              </span>
              <ul>
                {applied.map((chip) => (
                  <li key={chip.key}>
                    <Link
                      href={chip.href}
                      aria-label={chip.removeLabel}
                      className={cn("cine__chip", textClass(lang))}
                    >
                      <span className="cine__chip-axis">{chip.axis}</span>
                      <span className="cine__chip-value">{chip.value}</span>
                      <X className="cine__chip-x" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {reset ? (
                  <li>
                    <Link
                      href={reset.href}
                      className={cn("cine__reset", textClass(lang))}
                    >
                      <RotateCcw className="cine__reset-glyph" aria-hidden="true" />
                      {reset.label}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

        </header>

        {spotlight ? (
          <div className="cine__stage">
            {/* Left: the title again, as an object rather than as a heading.
                Set in the display face at a size where it reads as the room's
                signage, which is what the reference does with its ingredient
                names, and hidden from screen readers because the record on the
                right says the same words in the right order. */}
            <div className="cine__signage" aria-hidden="true">
              <p className={cn("cine__display", textClass(lang))}>
                {spotlight.title}
              </p>
              <p className={cn("cine__by", textClass(lang))}>
                <span className="cine__by-rule" />
                {spotlight.author}
              </p>
            </div>

            <div className="cine__vol">
              <span className="cine__bloom" aria-hidden="true" />
              <Book3D book={spotlight.cover} lang={lang} size="lg" showcase />
            </div>

            <div className="cine__meta">
              <p className="cine__counter">
                <span aria-hidden="true">{spotlight.counter}</span>
                <span className="sr-only">{spotlight.counterLabel}</span>
              </p>
              <p className={cn("cine__note", textClass(lang))}>
                {spotlight.description}
              </p>

              <dl className={cn("cine__spec", textClass(lang))}>
                {spotlight.spec.map((row) => (
                  <div
                    key={row.label}
                    className="cine__spec-row"
                    /* The rule under the row doubles as a measure when the
                       figure has a scale to be read against. */
                    style={
                      row.share === undefined
                        ? undefined
                        : ({
                            "--share": `${Math.round(
                              Math.min(1, Math.max(0, row.share)) * 100,
                            )}%`,
                          } as React.CSSProperties)
                    }
                    data-measured={row.share === undefined ? undefined : true}
                  >
                    <dt className="cine__spec-label">{row.label}</dt>
                    <dd className="cine__spec-value">
                      <span className="cine__spec-figure tabular-nums">
                        {row.value}
                      </span>
                      {row.unit ? (
                        <span className="cine__spec-unit">{row.unit}</span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href={spotlight.href}
                className={cn("cine__open", textClass(lang))}
              >
                {copy.openRecord}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <p className={cn("cine__empty", textClass(lang))}>{copy.empty}</p>
        )}

        <div className="cine__foot">
          {/* The dot in the reference's corner is a carousel control; here the
              thing below is the grid, so it scrolls to it. An anchor, so it
              works before hydration and can be opened in a new tab. */}
          <a href={gridHref} className="cine__cue" aria-label={copy.seeAll}>
            <span aria-hidden="true" />
          </a>
          <p className={cn("cine__strapline", textClass(lang))}>
            {copy.strapline}
          </p>
        </div>
      </div>
    </section>
  );
}
