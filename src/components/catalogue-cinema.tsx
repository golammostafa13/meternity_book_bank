import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Book3D } from "@/components/book-3d";
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
 * this with its four ingredients: name the section, name the thing, offer the
 * few choices there are as pills, and then show one item properly rather than
 * sixteen thumbnails. A catalogue can borrow all of that without giving up the
 * grid, because the grid answers a different question ("which of these?") from
 * the one the room answers ("what is this shelf like?").
 *
 * **Zero JavaScript, and the filters are better for it.** Every pill is a
 * `<Link>` to the same page with one search parameter changed, and the search
 * box is a plain `method="get"` form. So a filtered view is a URL that can be
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

/** One filter choice. `href` is the whole state change; there is no handler. */
export interface CataloguePill {
  key: string;
  label: string;
  /** Shown small beside the label. Absent for choices that have no count. */
  count?: string;
  href: string;
  active: boolean;
}

/** A quiet secondary choice: sort order, book language. */
export interface CatalogueChoice {
  label: string;
  options: CataloguePill[];
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
  /** Accessible name for the row of category pills. */
  filterLabel: string;
  openRecord: string;
  /** On the cue that scrolls down to the grid. */
  seeAll: string;
  /** Shown in place of the spotlight when a filter matches nothing. */
  empty: string;
}

interface CatalogueCinemaProps {
  copy: CatalogueCinemaCopy;
  /** Category pills, "all" first. */
  pills: CataloguePill[];
  /** Sort and book-language, as quiet lines of links under the pills. */
  choices: CatalogueChoice[];
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
  pills,
  choices,
  spotlight,
  search,
  gridHref,
  lang = defaultLocale,
  className,
}: CatalogueCinemaProps) {
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

          <nav className="cine__pills" aria-label={copy.filterLabel}>
            <ul>
              {pills.map((pill) => (
                <li key={pill.key}>
                  <Link
                    href={pill.href}
                    aria-current={pill.active ? "true" : undefined}
                    className={cn("cine__pill", textClass(lang))}
                    data-active={pill.active || undefined}
                  >
                    {pill.label}
                    {pill.count ? (
                      <span className="cine__pill-count">{pill.count}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sort and book language. Real controls, set quietly: they matter
              to a reader who is looking for something specific and are noise
              to everyone else, and the pills above are the loud row. */}
          <div className="cine__choices">
            {choices.map((choice) => (
              <div key={choice.label} className="cine__choice">
                <span className={cn("cine__choice-label", textClass(lang))}>
                  {choice.label}
                </span>
                <ul>
                  {choice.options.map((option) => (
                    <li key={option.key}>
                      <Link
                        href={option.href}
                        aria-current={option.active ? "true" : undefined}
                        className={cn("cine__choice-link", textClass(lang))}
                        data-active={option.active || undefined}
                      >
                        {option.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
