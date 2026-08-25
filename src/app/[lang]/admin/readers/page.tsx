import { notFound } from "next/navigation";
import { AlertTriangle, Database, DoorOpen, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatTile } from "@/components/admin/stat-tile";
import { isRedisConfigured, listAccounts } from "@/lib/auth/accounts";
import { listReaders } from "@/lib/auth/readers";
import { districtById, thanaById } from "@/lib/data/bd-geo";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { formatNumberIn, textClass } from "@/lib/i18n/content";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

/**
 * Who the books reached, and who opened them.
 *
 * Two tables, two different facts, and the difference is the reason this screen
 * shows both rather than pretending they are one list:
 *
 *   • **The register** is `/signup`. Someone holding a hard copy chose to say
 *     who they are and where they are, which is what the sponsor funded a print
 *     run to find out. Keyed on a phone number. Entirely voluntary, and plenty
 *     of readers will never appear in it.
 *   • **The door** is every address that has typed the printed word. Written
 *     without anyone being asked, so it is close to complete — but it is an
 *     address and a count, and it cannot say which thana a book landed in.
 *
 * Most rows sit in exactly one of the two. Joining them on the address would
 * produce a third table that is wrong about both.
 *
 * Neither is a credential. Nothing on this screen is consulted to decide
 * whether anyone may come in — see the note at the top of `lib/auth/accounts`.
 */

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/readers">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.readers };
}

/** Both stores are per-request state; nothing here may be prerendered. */
export const dynamic = "force-dynamic";

/**
 * A time, in whichever language is on screen.
 *
 * `formatDateIn` takes an ISO date string and these are epoch milliseconds, so
 * this is the millisecond counterpart rather than a duplicate of it. Both
 * stores record instants, not days, and the day is what a librarian reading
 * this actually wants.
 */
function formatStamp(ms: number, lang: "en" | "bn"): string {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

export default async function AdminReadersPage(
  props: PageProps<"/[lang]/admin/readers">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const bn = textClass(lang);

  // Independent stores, so they are fetched together rather than in sequence.
  // `catch` on each: a cache having a bad minute should cost this screen one
  // table, not both and not the page.
  const [readers, accounts] = await Promise.all([
    listReaders().catch(() => []),
    listAccounts().catch(() => []),
  ]);

  const durable = isRedisConfigured();
  const visits = accounts.reduce((total, a) => total + a.visits, 0);

  const th = cn("px-5 py-3 font-medium");
  const headRow = cn("text-xs uppercase tracking-wider text-ink-faint", bn);

  return (
    <AdminShell
      title={dict.admin.readers}
      breadcrumb={fill(lang, dict.admin.breadcrumbReaders, {
        n: formatNumberIn(readers.length, lang),
      })}
      lang={lang}
    >
      {/* A JSON file on a serverless host is a store that forgets. Say so here
          rather than letting an empty table read as "nobody has signed up". */}
      {!durable && (
        <p
          role="status"
          className={cn(
            "mb-4 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn",
            bn,
          )}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {dict.admin.readersNoStore}
        </p>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile
          Icon={Users}
          label={dict.admin.statRegistered}
          value={formatNumberIn(readers.length, lang)}
          sub={dict.admin.statRegisteredHint}
          lang={lang}
        />
        <StatTile
          Icon={DoorOpen}
          label={dict.admin.statAddresses}
          value={formatNumberIn(accounts.length, lang)}
          sub={fill(lang, dict.admin.statAddressesHint, {
            n: formatNumberIn(visits, lang),
          })}
          lang={lang}
        />
        <StatTile
          Icon={Database}
          label={dict.admin.statStore}
          value={durable ? dict.admin.storeRedis : dict.admin.storeFile}
          sub={durable ? dict.admin.storeRedisHint : dict.admin.storeFileHint}
          lang={lang}
        />
      </div>

      {/* ── The register ─────────────────────────────────────────────────── */}
      <section className="mb-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
        <header className="border-b border-line/70 px-5 py-4">
          <h2 className={cn("font-medium text-ink", bn)}>
            {dict.admin.registerTitle}
          </h2>
          <p className={cn("mt-1 text-sm text-ink-mute", bn)}>
            {dict.admin.registerLead}
          </p>
        </header>

        {readers.length === 0 ? (
          <p className={cn("px-5 py-8 text-center text-sm text-ink-faint", bn)}>
            {dict.admin.registerEmpty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">{dict.admin.registerTitle}</caption>
              <thead className="bg-bg-deep/60">
                <tr className={headRow}>
                  <th scope="col" className={th}>
                    {dict.admin.colName}
                  </th>
                  <th scope="col" className={th}>
                    {dict.admin.colPhone}
                  </th>
                  <th scope="col" className={th}>
                    {dict.admin.colEmail}
                  </th>
                  <th scope="col" className={th}>
                    {dict.admin.colWhere}
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    {dict.admin.colRegistered}
                  </th>
                </tr>
              </thead>
              <tbody>
                {readers.map((reader) => {
                  const district = districtById(reader.district);
                  const thana = thanaById(district?.id, reader.thana);
                  // Thana before district, the way an address is said aloud.
                  const where = [
                    lang === "bn" ? thana?.nameBn : thana?.name,
                    lang === "bn" ? district?.nameBn : district?.name,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={reader.phone}
                      className="border-t border-line/70 transition-colors hover:bg-bg-deep/40"
                    >
                      <td className={cn("px-5 py-3.5 font-medium text-ink", bn)}>
                        {reader.name}
                      </td>
                      {/* Numerals stay Latin: a phone number is dialled, and a
                          Bengali-numeral one cannot be. */}
                      <td className="px-5 py-3.5 tabular-nums text-ink-mute">
                        {reader.phone}
                      </td>
                      <td className="px-5 py-3.5 text-ink-mute">
                        {reader.email ?? (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className={cn("px-5 py-3.5 text-ink-mute", bn)}>
                        {where || <span className="text-ink-faint">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right text-ink-faint">
                        {formatStamp(reader.createdAt, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── The door ─────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
        <header className="border-b border-line/70 px-5 py-4">
          <h2 className={cn("font-medium text-ink", bn)}>
            {dict.admin.doorTitle}
          </h2>
          <p className={cn("mt-1 text-sm text-ink-mute", bn)}>
            {dict.admin.doorLead}
          </p>
        </header>

        {accounts.length === 0 ? (
          <p className={cn("px-5 py-8 text-center text-sm text-ink-faint", bn)}>
            {dict.admin.doorEmpty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">{dict.admin.doorTitle}</caption>
              <thead className="bg-bg-deep/60">
                <tr className={headRow}>
                  <th scope="col" className={th}>
                    {dict.admin.colEmail}
                  </th>
                  <th scope="col" className={th}>
                    {dict.admin.colOpenedWith}
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    {dict.admin.colVisits}
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    {dict.admin.colFirstSeen}
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    {dict.admin.colLastSeen}
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.email}
                    className="border-t border-line/70 transition-colors hover:bg-bg-deep/40"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {account.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          bn,
                          account.role === "admin"
                            ? "bg-accent-soft text-accent"
                            : "bg-bg-deep text-ink-mute",
                        )}
                      >
                        {account.role === "admin"
                          ? dict.admin.roleAdmin
                          : dict.admin.roleReader}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink-mute">
                      {formatNumberIn(account.visits, lang)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-faint">
                      {formatStamp(account.firstSeenAt, lang)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-faint">
                      {formatStamp(account.lastSeenAt, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
