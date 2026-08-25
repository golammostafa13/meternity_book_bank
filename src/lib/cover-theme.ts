/**
 * Cover colour system.
 *
 * The identity is a three-colour world: blush ground, plum ink, one deep
 * pink. A cover generator that reads `coverHue` straight out of the data
 * produces full-spectrum candy covers (mint, violet, lime), which is the
 * fastest way to break that world.
 *
 * So `coverHue` stops being a hue and becomes a *seed*: it selects one of a
 * small set of hand-mixed schemes, every one of them sampled from the
 * identity's own palette. The data layer is untouched, the catalogue still
 * looks varied, and no cover can ever land outside the design.
 *
 * Schemes are picked deterministically: no Math.random anywhere, so server
 * and client renders always agree.
 */

export interface CoverTheme {
  /** Shown in the admin's cover picker. */
  name: string;
  /** Cover stock. The dominant area of the face. */
  paper: string;
  /** Type colour on `paper`. Always ≥ 7:1 against it. */
  ink: string;
  /** Mid tone for bands, discs and rules. */
  mid: string;
  /** Deepest tone: panels, borders, the darker half of a split cover. */
  deep: string;
  /** Spine stock. Reads as the same bound object as the face. */
  spine: string;
  /** Type colour on `spine` / on `deep` fields. */
  spineInk: string;
  /** True when the scheme is dark-on-light; drives type inversion. */
  light: boolean;
}

/**
 * Eight schemes. Two are the identity itself (blush + plum, and its inverse);
 * the rest are neighbours in the same warm family (rose, peony, clay, oxblood,
 * mauve) plus one desaturated sage so a shelf of them has some cool relief and
 * does not read as a single pink block.
 */
const themes: readonly CoverTheme[] = [
  // Blush stock, plum type, the accent as a rule. The identity, verbatim.
  {
    name: "Blush & plum",
    paper: "#f6e7ec",
    ink: "#3b0f22",
    mid: "#be185d",
    deep: "#4c1d33",
    spine: "#4c1d33",
    spineInk: "#fbeaf0",
    light: true,
  },
  // Aubergine cover, blush type. The inverse: anchors a grid visually.
  {
    name: "Aubergine",
    paper: "#241019",
    ink: "#f9e6ee",
    mid: "#ec4899",
    deep: "#150911",
    spine: "#150911",
    spineInk: "#f9e6ee",
    light: false,
  },
  // Rose, the accent used as a field rather than a detail.
  {
    name: "Rose",
    paper: "#f0d9df",
    ink: "#45141f",
    mid: "#d1355c",
    deep: "#7d1d32",
    spine: "#7d1d32",
    spineInk: "#fbe7ec",
    light: true,
  },
  // Clay rose / warm brown, the bound-cloth look.
  {
    name: "Clay rose",
    paper: "#ecdcd3",
    ink: "#3d2318",
    mid: "#b9705c",
    deep: "#6b3527",
    spine: "#6b3527",
    spineInk: "#f6e7df",
    light: true,
  },
  // Peony, the brightest stock in the set.
  {
    name: "Peony",
    paper: "#f7dfe6",
    ink: "#3f1226",
    mid: "#e05f8b",
    deep: "#8f2350",
    spine: "#8f2350",
    spineInk: "#fdeaf1",
    light: true,
  },
  // Sage, heavily desaturated. The one cool scheme, and the reason a full
  // shelf reads as a library rather than as a colour swatch.
  {
    name: "Sage",
    paper: "#dee5df",
    ink: "#1e2a22",
    mid: "#6f8b78",
    deep: "#35473b",
    spine: "#35473b",
    spineInk: "#edf2ee",
    light: true,
  },
  // Oxblood, deep, near-ink, for the heavier titles.
  {
    name: "Oxblood",
    paper: "#ecd6d6",
    ink: "#3c1414",
    mid: "#a33a3a",
    deep: "#601c1c",
    spine: "#601c1c",
    spineInk: "#f7e3e3",
    light: true,
  },
  // Mauve. Cool-leaning but still on the pink axis; kept low-chroma.
  {
    name: "Mauve",
    paper: "#dcd8e0",
    ink: "#211b28",
    mid: "#6f6480",
    deep: "#3a3245",
    spine: "#3a3245",
    spineInk: "#eae7ee",
    light: true,
  },
];

/** Stable 32-bit hash. Same string in, same layout out, forever. */
function hashOf(seed: string): number {
  let h = 2166136261;
  for (const char of seed) {
    h ^= char.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** All eight schemes, in picker order. */
export const coverSchemes = themes;

const BUCKET = 360 / themes.length;

/**
 * Hue → scheme, in even buckets around the wheel.
 *
 * Deriving the scheme from the hue alone (rather than mixing in the book id)
 * is what makes it *choosable*: the admin's cover picker writes back a hue and
 * gets exactly the scheme it showed. Seed data spread across the wheel still
 * lands on a varied set of schemes.
 */
export function schemeIndexOf(coverHue: number): number {
  const hue = ((coverHue % 360) + 360) % 360;
  return Math.min(themes.length - 1, Math.floor(hue / BUCKET));
}

/** The hue to store for a chosen scheme: the centre of its bucket. */
export function hueForScheme(index: number): number {
  const i = ((index % themes.length) + themes.length) % themes.length;
  return Math.round(i * BUCKET + BUCKET / 2);
}

export function coverTheme(book: { coverHue: number }): CoverTheme {
  return themes[schemeIndexOf(book.coverHue)];
}

/** Cover layout variant, 0-4. Kept separate so art and colour vary apart. */
export function coverVariant(book: { id: string }): number {
  return (hashOf(`${book.id}:layout`) >>> 3) % 5;
}

/**
 * Two-tone pair for non-book chrome: author avatars, category glyphs,
 * admin table markers. Same restricted world as the covers, so an avatar
 * grid can never turn into a rainbow.
 */
const marks: readonly { bg: string; fg: string }[] = [
  { bg: "#f3dde5", fg: "#4c1d33" },
  { bg: "#efdcd6", fg: "#6b3527" },
  { bg: "#f6dde6", fg: "#8f2350" },
  { bg: "#dfe6e0", fg: "#35473b" },
  { bg: "#eed9d9", fg: "#601c1c" },
  { bg: "#ded9e2", fg: "#3a3245" },
  { bg: "#eee3e7", fg: "#2b1d24" },
];

export function markTheme(seed: string): { bg: string; fg: string } {
  return marks[hashOf(seed) % marks.length];
}
