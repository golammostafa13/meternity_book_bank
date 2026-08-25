/**
 * Prepares the six chapter backgrounds for the collection scroll.
 *
 *   node scripts/build-chapter-art.mjs
 *
 * Writes `public/bg/<category-slug>.webp`, all committed, plus
 * `src/lib/data/chapter-art.ts` carrying the credits, because these are other
 * people's photographs under Creative Commons and the attribution is a licence
 * condition, not a courtesy. The generated file is what the About page reads, so
 * a photograph cannot end up on the site without its credit.
 *
 * They are downloaded rather than hotlinked because `next.config.ts` ships a CSP
 * with `img-src 'self' data: blob:` (a remote URL would simply not render), and
 * because a library should not make a request to a third party on every page
 * view.
 *
 * **The treatment matters more than the photographs.** Six stock images of
 * varying quality, dropped in at full colour, would read as six stock images.
 * Each one here is collapsed to luminance and then mapped through the site's own
 * plum-to-blush ramp as a two-colour duotone, so they arrive as one set in one
 * palette: the photograph supplies the composition and every tone comes from the
 * design. It is also why the licensing risk is low and the weight is ~50 KB each.
 *
 * Sources are cached under `.cache/chapter-art/`, ignored by git. The treatment
 * is the part that gets iterated on, and re-downloading six originals from a
 * rate-limited host to change a curve is a good way to get locked out.
 *
 * Commons rate-limits an unauthenticated client hard and answers with an HTML
 * scolding rather than an error status, so requests are spaced and retried; a
 * "unsupported image format" from sharp here almost always means the body was
 * that scolding.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "bg");
const creditsFile = join(root, "src", "lib", "data", "chapter-art.ts");
const cacheDir = join(root, ".cache", "chapter-art");
mkdirSync(outDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

const UA = "maternity-book-bank/1.0 (an educational library; one-off asset build)";
const API = "https://commons.wikimedia.org/w/api.php";

/**
 * One photograph per chapter, chosen by hand.
 *
 * Chosen by hand because searching Commons for this subject and taking the top
 * result gives you sea otters, rhesus macaques and a clinical photograph of a
 * congenital defect: all correctly matching "mother and baby" and none of them
 * something to put behind a chapter heading. The search is useful for finding
 * candidates and useless for choosing between them.
 */
const CHAPTERS = [
  {
    slug: "pregnancy-antenatal",
    file: "File:Autumn baby to be (Unsplash).jpg",
    /** Focus point, as a fraction: where the crop should keep its centre. */
    focus: { x: 0.5, y: 0.42 },
    /** >1 crops tighter than the largest 16:9 window. Default 1. */
    zoom: 1,
  },
  {
    /**
     * Two hands clasped through a delivery. Chosen over every actual
     * delivery-room photograph on Commons, which are almost all either
     * clinical, graphic, or a picture of a building: the "maternity ward" that
     * stood here first turned out to be the hospital's car park and facade.
     */
    slug: "labour-birth",
    file:
      "File:A HUSBAND HOLDS HIS WIFE'S HAND DURING DELIVERY OF THEIR BABY IN " +
      "LORETTO HOSPITAL IN NEW ULM, MINNESOTA. THERE ARE... - NARA - 558167.jpg",
    focus: { x: 0.46, y: 0.5 },
  },
  {
    slug: "newborn-care",
    file: "File:Newborn baby sleeps in a basket.jpg",
    focus: { x: 0.5, y: 0.5 },
  },
  {
    /**
     * Framed on the baby's head, not wide. Breastfeeding photographs are the
     * right subject for this chapter and WHO's own guidance is illustrated with
     * them, but a full-bleed panel behind a heading is not the place for an
     * anatomical close-up, so the crop pulls in on the child and the `zoom`
     * knob exists for precisely this.
     */
    slug: "feeding-nutrition",
    file: "File:Breastfeeding a newborn baby, Moscow, Russia.jpg",
    focus: { x: 0.4, y: 0.34 },
    zoom: 1.5,
  },
  {
    slug: "complications",
    file: "File:MODULAR NICU WITH HEPAFILTERS.jpg",
    focus: { x: 0.5, y: 0.5 },
  },
  {
    slug: "postnatal-quality",
    file: "File:A Syrian refugee and her newborn baby at a clinic in Ramtha, Jordan (9613483141).jpg",
    focus: { x: 0.5, y: 0.42 },
  },
];

/** 16:9 at a size that survives a 2× display on a full-bleed panel. */
const WIDTH = 1920;
const HEIGHT = 1080;

/**
 * The duotone ramp: the site's own ink and blush, as a per-channel straight
 * line. Black in the photograph becomes `SHADOW`, white becomes `HIGHLIGHT`,
 * and everything between interpolates, which is what makes six unrelated
 * photographs read as one set rather than six.
 *
 * `SHADOW` is `--ink` (#4c1d33) and `HIGHLIGHT` sits just above `--accent-soft`,
 * so a background never goes darker than the body text or lighter than the page.
 * Neither end is pure black or pure white: a duotone that bottoms out at #000
 * reads as a hole punched in the page rather than as a photograph behind it.
 */
const SHADOW = { r: 0x4c, g: 0x1d, b: 0x33 };
const HIGHLIGHT = { r: 0xfb, g: 0xe4, b: 0xec };
const DUOTONE = {
  slope: ["r", "g", "b"].map((c) => (HIGHLIGHT[c] - SHADOW[c]) / 255),
  intercept: ["r", "g", "b"].map((c) => SHADOW[c]),
};

async function commons(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 900 : 2500 * attempt));
    try {
      const response = await fetch(url, { headers: { "User-Agent": UA } });
      const body = await response.text();
      if (body.startsWith("{")) return JSON.parse(body);
    } catch {
      // Commons occasionally answers on an unreachable IPv6 address. Retried.
    }
  }
  throw new Error("Commons would not answer (rate limit?)");
}

async function fetchImage(url, cacheKey) {
  const cached = join(cacheDir, `${cacheKey}.bin`);
  if (existsSync(cached)) return readFileSync(cached);

  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 900 : 2500 * attempt));
    try {
      const response = await fetch(url, { headers: { "User-Agent": UA } });
      const buffer = Buffer.from(await response.arrayBuffer());
      // A rate-limit page is HTML and starts "<"; a JPEG starts 0xFFD8.
      const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const png = buffer[0] === 0x89 && buffer[1] === 0x50;
      if (jpeg || png) {
        writeFileSync(cached, buffer);
        return buffer;
      }
    } catch {
      // Retried.
    }
  }
  throw new Error("could not download the image");
}

const credits = [];

for (const chapter of CHAPTERS) {
  const data = await commons({
    action: "query",
    titles: chapter.file,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: String(WIDTH * 1.4),
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) {
    console.error(`  ✗ ${chapter.slug}: not found on Commons`);
    continue;
  }

  const meta = info.extmetadata ?? {};
  const strip = (value) =>
    (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const source = await fetchImage(info.thumburl ?? info.url, chapter.slug);

  /* --- The treatment ---------------------------------------------------- *
   * 1. Cover-crop to 16:9 around the focus point.
   * 2. Collapse to luminance, so the photograph's own colour cast cannot fight
   *    the palette. A gentle blur here too: these sit behind large display type
   *    and any detail sharper than the text competes with it.
   * 3. Map that luminance through the duotone ramp: see `duotone` below.
   *
   * Note what is *not* used: `.greyscale().tint(…)`. `greyscale` sets the output
   * colourspace to single-channel `b-w`, and sharp applies that at the end of
   * the pipeline regardless of the order the calls were made in, so the tint is
   * computed and then thrown away, and you get six grey photographs with no
   * error to tell you why. Hence the two passes, with an explicit
   * `toColourspace("srgb")` between them.
   * -------------------------------------------------------------------- */
  // sharp's `position` takes gravity keywords, not percentages, so the focus
  // crop is computed here: take the largest 16:9 window that fits, then slide
  // it so the focus point sits at its centre, clamped to the frame.
  const meta0 = await sharp(source).metadata();
  const targetRatio = WIDTH / HEIGHT;
  const sourceRatio = meta0.width / meta0.height;
  const zoom = Math.max(1, chapter.zoom ?? 1);
  const cropWidth = Math.round(
    (sourceRatio > targetRatio ? meta0.height * targetRatio : meta0.width) / zoom,
  );
  const cropHeight = Math.round(
    (sourceRatio > targetRatio ? meta0.height : meta0.width / targetRatio) / zoom,
  );
  const left = Math.max(
    0,
    Math.min(meta0.width - cropWidth, Math.round(chapter.focus.x * meta0.width - cropWidth / 2)),
  );
  const top = Math.max(
    0,
    Math.min(meta0.height - cropHeight, Math.round(chapter.focus.y * meta0.height - cropHeight / 2)),
  );

  const luminance = await sharp(source)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(WIDTH, HEIGHT)
    .greyscale()
    .blur(1.6)
    .png({ compressionLevel: 0 })
    .toBuffer();

  const written = await sharp(luminance)
    .toColourspace("srgb")
    .linear(DUOTONE.slope, DUOTONE.intercept)
    .webp({ quality: 76, effort: 6 })
    .toFile(join(outDir, `${chapter.slug}.webp`));

  credits.push({
    slug: chapter.slug,
    title: strip(page.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, "")),
    artist: strip(meta.Artist?.value) || "Unknown",
    license: strip(meta.LicenseShortName?.value) || "see source",
    sourceUrl: info.descriptionurl,
  });

  console.log(
    `  ✓ ${chapter.slug}.webp  ${(written.size / 1024).toFixed(0)} KB  ` +
      `(${credits.at(-1).license}, ${credits.at(-1).artist.slice(0, 32)})`,
  );
}

const ts = `/**
 * Credits for the chapter backgrounds.
 *
 * Generated by \`scripts/build-chapter-art.mjs\`; do not hand-edit. These are
 * other people's photographs under Creative Commons, and attribution is a
 * condition of those licences rather than a courtesy, so the credits are a
 * module the About page imports, which means a photograph cannot reach the site
 * without one.
 */

export interface ChapterArt {
  /** Category slug: the join to \`public/bg/<slug>.webp\`. */
  slug: string;
  title: string;
  artist: string;
  license: string;
  sourceUrl: string;
}

export const chapterArt: readonly ChapterArt[] = ${JSON.stringify(credits, null, 2)
  .replace(/"([a-zA-Z]+)":/g, "$1:")
  .replace(/"/g, '"')};

export function artFor(slug: string): ChapterArt | undefined {
  return chapterArt.find((art) => art.slug === slug);
}
`;
writeFileSync(creditsFile, ts, "utf8");
console.log(`\n${credits.length} chapter backgrounds written, credits in src/lib/data/chapter-art.ts`);
