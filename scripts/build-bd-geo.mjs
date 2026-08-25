/**
 * Regenerates `src/lib/data/bd-geo.ts`: Bangladesh's 8 divisions, 64 districts
 * and 494 thanas, in Bengali and English.
 *
 *   node scripts/build-bd-geo.mjs
 *
 * Source: https://github.com/ifahimreza/bangladesh-geojson (MIT), which
 * publishes flat single-key arrays with a `bn_name` beside every `name`. The
 * better-known `nuhil/bangladesh-geocode` carries the same data but ships it as
 * a phpMyAdmin dump: a four-element array with the rows hidden at
 * `json.at(-1).data`, so this uses the cleaner one.
 *
 * Output is committed. The form must not fetch a third-party dataset at
 * runtime, and 70 KB of data that changes when the map does has no business
 * being a dependency.
 *
 * Two corrections are applied on the way through; both are listed below in
 * `RENAME`/`RENAME_BN` so they are visible rather than mysterious.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE =
  "https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/src/data";

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
  "bd-geo.ts",
);

/** Stale or mistyped English names in the source data. */
const RENAME = {
  Sirajgonj: "Sirajganj",
  // Disambiguated from Dhaka's Nawabganj upazila, which is a different place.
  Nawabganj: "Chapai Nawabganj",
};

/** Bengali spellings the source gets wrong. */
const RENAME_BN = {
  "নারায়াণগঞ্জ": "নারায়ণগঞ্জ",
  "কক্স বাজার": "কক্সবাজার",
  "নবাবগঞ্জ": "চাঁপাইনবাবগঞ্জ",
};

/**
 * Older English spellings still in everyday use: the districts renamed in
 * 2018, mostly, plus the ones with more than one romanisation. Searched, never
 * displayed: someone typing "Comilla" must find Cumilla.
 */
const ALIASES = {
  Cumilla: ["Comilla", "Komilla"],
  Chattogram: ["Chittagong", "Ctg"],
  Barishal: ["Barisal"],
  Jashore: ["Jessore"],
  Bogura: ["Bogra"],
  Jhalokati: ["Jhalakathi", "Jhalokathi"],
  Maulvibazar: ["Moulvibazar", "Moulavibazar"],
  Netrokona: ["Netrakona"],
  "Chapai Nawabganj": ["Nawabganj", "Chapainawabganj", "Chapai"],
  Khagrachari: ["Khagrachhari"],
  Munshiganj: ["Munshigonj", "Munsiganj"],
  Sirajganj: ["Sirajgonj"],
  Narsingdi: ["Narshingdi"],
  Nilphamari: ["Neelphamari"],
  "Cox's Bazar": ["Coxs Bazar", "Cox Bazar", "Coxsbazar"],
  Kushtia: ["Kustia"],
  Satkhira: ["Shatkhira"],
  Sunamganj: ["Sunamgonj"],
  Habiganj: ["Hobiganj"],
  Lakshmipur: ["Laxmipur", "Lokkhipur"],
  Patuakhali: ["Potuakhali"],
  Mymensingh: ["Momenshahi"],
  Rangamati: ["Rangamati Hill"],
};

async function fetchJson(name) {
  const response = await fetch(`${BASE}/${name}.json`);
  if (!response.ok) {
    throw new Error(`${name}.json: HTTP ${response.status}`);
  }
  const body = await response.json();
  // Single-key wrapper: { districts: [...] }, { upazilas: [...] }.
  return body[Object.keys(body)[0]];
}

/** The source has stray trailing spaces in a number of Bengali names. */
const clean = (value) => String(value ?? "").trim();

const quote = (value) =>
  `"${clean(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const [divisionRows, districtRows, thanaRows] = await Promise.all([
  fetchJson("bd-divisions"),
  fetchJson("bd-districts"),
  fetchJson("bd-upazilas"),
]);

const divisions = new Map(divisionRows.map((d) => [d.id, d]));

const thanasByDistrict = new Map();
for (const thana of thanaRows) {
  const list = thanasByDistrict.get(thana.district_id) ?? [];
  list.push(thana);
  thanasByDistrict.set(thana.district_id, list);
}

const orphans = thanaRows.filter(
  (t) => !districtRows.some((d) => d.id === t.district_id),
);
if (orphans.length > 0) {
  throw new Error(`${orphans.length} thanas have no district; source changed.`);
}
if (districtRows.length !== 64 || divisions.size !== 8) {
  throw new Error(
    `Expected 8 divisions and 64 districts, got ${divisions.size} and ${districtRows.length}.`,
  );
}

const named = districtRows.map((d) => ({
  ...d,
  english: RENAME[clean(d.name)] ?? clean(d.name),
  bengali: RENAME_BN[clean(d.bn_name)] ?? clean(d.bn_name),
}));

const body = named
  .sort((a, b) => a.english.localeCompare(b.english, "en"))
  .map((d) => {
    const division = divisions.get(d.division_id);
    const aliases = ALIASES[d.english];
    const thanas = (thanasByDistrict.get(d.id) ?? []).sort((a, b) =>
      clean(a.name).localeCompare(clean(b.name), "en"),
    );
    return [
      "  {",
      `    id: ${quote(d.id)},`,
      `    name: ${quote(d.english)},`,
      `    nameBn: ${quote(d.bengali)},`,
      `    division: ${quote(division.name)},`,
      `    divisionBn: ${quote(division.bn_name)},`,
      ...(aliases ? [`    aliases: [${aliases.map(quote).join(", ")}],`] : []),
      "    thanas: [",
      ...thanas.map(
        (t) =>
          `      { id: ${quote(t.id)}, name: ${quote(t.name)}, nameBn: ${quote(t.bn_name)} },`,
      ),
      "    ],",
      "  },",
    ].join("\n");
  })
  .join("\n");

const header = `/**
 * Bangladesh: 8 divisions, 64 districts, ${thanaRows.length} thanas.
 *
 * Generated by \`scripts/build-bd-geo.mjs\` and committed, so the sign-up form
 * needs no runtime fetch and no dependency for ~70 KB of data that changes
 * about as often as the map does. Regenerate rather than hand-edit.
 *
 * **On the word "thana".** Outside the metropolitan areas a thana and an
 * upazila are the same unit, and the list below is the upazila list. Inside
 * Dhaka, Chattogram and the other city corporations they are not: there, thanas
 * are police-station areas and there are several to an upazila. The label on
 * the form says Thana because that is what a Bangladeshi reader expects to be
 * asked, and district → upazila is the right granularity for knowing where a
 * print run went. Please do not "fix" this by swapping in a 639-row police
 * station list; the form would get worse and the record no more useful.
 *
 * Every district carries both spellings, because the Bengali page must not
 * print "Netrokona" and the English page must not print "নেত্রকোণা". Several
 * also carry \`aliases\`: the districts renamed in 2018 are still typed the old
 * way by most people, so searching "Comilla" has to find Cumilla and
 * "Chittagong" has to find Chattogram. Aliases are matched, never displayed.
 */

export interface Thana {
  id: string;
  name: string;
  nameBn: string;
}

export interface District {
  id: string;
  name: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  /** Older or alternate English spellings. Searched, never shown. */
  aliases?: readonly string[];
  thanas: readonly Thana[];
}

/** Alphabetical by English name: a searchable list wants one flat order. */
export const districts: readonly District[] = [
`;

const footer = `];

const byId = new Map(districts.map((d) => [d.id, d]));

export function districtById(id: string | undefined | null) {
  return id ? byId.get(id) : undefined;
}

/** Empty when no district is chosen, which is what the Thana field shows. */
export function thanasOf(districtId: string | undefined | null): readonly Thana[] {
  return districtById(districtId)?.thanas ?? [];
}

/**
 * A thana, but only if it really is inside that district.
 *
 * The pair arrives from a form, and a form can be submitted with the district
 * changed after the thana was picked. Validating the pair rather than the two
 * fields separately is what stops "Dhaka / Teknaf" reaching the register.
 */
export function thanaById(
  districtId: string | undefined | null,
  thanaId: string | undefined | null,
): Thana | undefined {
  if (!thanaId) return undefined;
  return thanasOf(districtId).find((t) => t.id === thanaId);
}
`;

writeFileSync(out, header + body + "\n" + footer, "utf8");
console.log(
  `bd-geo.ts: ${divisions.size} divisions, ${districtRows.length} districts, ${thanaRows.length} thanas`,
);
