import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Download,
  HardDrive,
  Library,
  Plus,
  Rss,
  Upload,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatTile } from "@/components/admin/stat-tile";
import { Shelf3D } from "@/components/shelf-3d";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getCategoryShelves,
  getRecent,
  getStats,
  getStorageUsage,
} from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  bookTitle,
  categoryName,
  formatCompactIn,
  formatDateIn,
  formatNumberIn,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill, titlesCount } from "@/lib/i18n/format";
import type { BookStatus } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata(props: PageProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.dashboard };
}

const statusBars: { status: BookStatus; bar: string }[] = [
  { status: "available", bar: "bg-ok" },
  { status: "borrowed", bar: "bg-warn" },
  { status: "damaged", bar: "bg-danger" },
  { status: "lost", bar: "bg-neutral" },
];

export default async function AdminDashboardPage(
  props: PageProps<"/[lang]/admin">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const href = (path: string) => localePath(lang, path);
  const bn = textClass(lang);

  const statusLabels: Record<BookStatus, string> = {
    available: dict.admin.statusAvailable,
    borrowed: dict.admin.statusOnLoan,
    damaged: dict.admin.statusDamaged,
    lost: dict.admin.statusLost,
  };

  const [stats, recent, categories, storage] = await Promise.all([
    getStats(),
    getRecent(14),
    getCategoryShelves(12),
    getStorageUsage(),
  ]);

  const biggestShelf = Math.max(...categories.map((c) => c.bookCount), 1);

  return (
    <AdminShell
      title={dict.admin.dashboard}
      breadcrumb={dict.admin.overview}
      lang={lang}
      actions={
        <Button asChild variant="primary" size="sm">
          <Link href={href("/admin/books/new")}>
            <Plus className="size-4" aria-hidden="true" />
            {dict.admin.catalogueABook}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={dict.admin.statTitles}
          value={formatNumberIn(stats.totalBooks, lang)}
          sub={fill(lang, dict.admin.statShelves, { n: stats.totalCategories })}
          Icon={BookMarked}
          lang={lang}
          accent
        />
        <StatTile
          label={dict.admin.statWriters}
          value={formatNumberIn(stats.totalAuthors, lang)}
          sub={dict.admin.statBothLanguages}
          Icon={Users}
          lang={lang}
        />
        <StatTile
          label={dict.admin.statDownloads}
          value={formatCompactIn(stats.totalDownloads, lang)}
          sub={dict.admin.statSinceLaunch}
          Icon={Download}
          lang={lang}
        />
        <StatTile
          label={dict.admin.statOnLoan}
          value={formatNumberIn(stats.borrowed, lang)}
          sub={fill(lang, dict.admin.statAvailableNow, { n: stats.available })}
          Icon={Rss}
          lang={lang}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        {/* --- Recently shelved ---------------------------------------- */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={cn("font-semibold text-ink", bn)}>
                {dict.admin.recentlyShelved}
              </h2>
              <p className={cn("mt-1 text-sm text-ink-mute", bn)}>
                {dict.admin.recentlyShelvedLead}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={href("/admin/books")}>
                {dict.admin.manageAll}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Not an ornament: hovering a spine pulls it out of the row and
              links straight to that book's public page. */}
          <div className="mt-7 rounded-xl bg-bg-deep px-5 pb-4 pt-8">
            <Shelf3D books={recent} lang={lang} height={92} />
          </div>

          <table className="mt-7 w-full text-left text-sm">
            <caption className="sr-only">{dict.admin.recentUploads}</caption>
            <thead>
              <tr
                className={cn(
                  "text-xs uppercase tracking-wider text-ink-faint",
                  bn,
                )}
              >
                <th scope="col" className="pb-3 font-medium">
                  {dict.admin.colTitle}
                </th>
                <th scope="col" className="pb-3 font-medium">
                  {dict.admin.colUploadedBy}
                </th>
                <th scope="col" className="hidden pb-3 font-medium sm:table-cell">
                  {dict.admin.colAdded}
                </th>
                <th scope="col" className="pb-3 text-right font-medium">
                  {dict.admin.colStatus}
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 5).map((book) => (
                <tr key={book.id} className="border-t border-line/70">
                  <td className="py-3 pr-3">
                    <Link
                      href={href(`/admin/books/${book.id}`)}
                      className={cn(
                        "font-medium text-ink hover:text-accent",
                        bn,
                      )}
                    >
                      {bookTitle(book, lang)}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-ink-faint">
                      {book.code}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-ink-mute">{book.uploadedBy}</td>
                  <td className="hidden py-3 pr-3 text-ink-mute sm:table-cell">
                    {formatDateIn(book.addedAt, lang)}
                  </td>
                  <td className="py-3 text-right">
                    <StatusPill status={book.status} dict={dict} lang={lang} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="flex flex-col gap-4">
          {/* --- Inventory ---------------------------------------------- */}
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
            <h2 className={cn("font-semibold text-ink", bn)}>
              {dict.admin.inventory}
            </h2>
            <dl className="mt-5 space-y-4">
              {statusBars.map(({ status, bar }) => {
                // CatalogueStats carries one counter per BookStatus.
                const count = stats[status];
                const percent = (count / Math.max(stats.totalBooks, 1)) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-baseline justify-between text-sm">
                      <dt className={cn("text-ink-mute", bn)}>
                        {statusLabels[status]}
                      </dt>
                      <dd className="font-semibold text-ink">
                        {formatNumberIn(count, lang)}
                      </dd>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70">
                      <div
                        className={`h-full rounded-full ${bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>

          {/* --- Storage ------------------------------------------------ */}
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-ink-faint" aria-hidden="true" />
              <h2 className={cn("font-semibold text-ink", bn)}>
                {dict.admin.storage}
              </h2>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-ink">
              {formatNumberIn(
                Number((storage.usedMb / 1024).toFixed(2)),
                lang,
              )}{" "}
              {/* The unit follows the digits: "০.২২ GB" next to "১০ জিবি" on
                  the line below reads as two different units. */}
              <span className={bn}>{dict.admin.gigabytes}</span>
              <span className={cn("ml-1.5 text-sm font-normal text-ink-faint", bn)}>
                {fill(lang, dict.admin.storageOf, { gb: storage.quotaMb / 1024 })}
              </span>
            </p>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-line/70"
              role="img"
              aria-label={fill(lang, dict.admin.storageUsedLabel, {
                percent: storage.percent.toFixed(1),
              })}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(storage.percent, 1.5)}%` }}
              />
            </div>
            <p className={cn("mt-3 text-sm text-ink-mute", bn)}>
              {fill(lang, dict.admin.storageNote, { mb: storage.averageMb })}
            </p>
          </section>

          {/* --- Quick actions ------------------------------------------ */}
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-e1">
            <h2 className={cn("font-semibold text-ink", bn)}>
              {dict.admin.addToLibrary}
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {[
                {
                  path: "/admin/books/new",
                  label: dict.admin.catalogueABook,
                  Icon: Upload,
                },
                {
                  path: "/admin/authors",
                  label: dict.admin.addWriter,
                  Icon: Users,
                },
                {
                  path: "/admin/categories",
                  label: dict.admin.openShelf,
                  Icon: Library,
                },
              ].map(({ path, label, Icon }) => (
                <Link
                  key={path}
                  href={href(path)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-line bg-bg px-4 py-3 text-[0.95rem] text-ink transition-colors hover:border-accent/50 hover:bg-accent-soft",
                    bn,
                  )}
                >
                  <Icon
                    className="size-4 text-accent"
                    aria-hidden="true"
                  />
                  {label}
                  <ArrowRight
                    className="ml-auto size-4 text-ink-faint transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* --- Shelf occupancy -------------------------------------------- */}
      <section className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-e1">
        <h2 className={cn("font-semibold text-ink", bn)}>
          {dict.admin.occupancy}
        </h2>
        <p className={cn("mt-1 text-sm text-ink-mute", bn)}>
          {dict.admin.occupancyLead}
        </p>
        <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link
                  href={href(`/admin/books?category=${cat.id}`)}
                  className={cn("font-medium text-ink hover:text-accent", bn)}
                >
                  {categoryName(cat, lang)}
                </Link>
                <span className={cn("shrink-0 text-ink-mute", bn)}>
                  {titlesCount(dict, lang, cat.bookCount)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${(cat.bookCount / biggestShelf) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
