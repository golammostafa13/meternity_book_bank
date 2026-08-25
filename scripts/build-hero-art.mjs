/**
 * Prepares the cinematic hero plates.
 *
 *   node scripts/build-hero-art.mjs
 *
 * Writes `public/hero/<n>-<slug>.webp`: four wide plates that cross-dissolve
 * behind the wordmark on the home page, with a slow push on each. Together they
 * are the "footage": there is no video file, and there should not be. A hero
 * video that reads as premium is several megabytes before it says anything, has
 * to be licensed for the purpose, and cannot be served from a CSP that only
 * allows `self` without shipping it in the repository. Four still plates with a
 * Ken Burns push and a long dissolve is what these sites actually look like
 * frame to frame, at ~120 KB each.
 *
 * The treatment is deliberately *not* the one in `build-chapter-art.mjs`. Those
 * plates sit behind body copy at low contrast and are blurred so they cannot
 * compete with it. These are the subject: darker, richer, no blur, and mapped
 * to a much deeper end of the plum ramp so light type sits over them the way it
 * does over a cinema frame. Same photographs, opposite job.
 *
 * Sources come from the cache `build-chapter-art.mjs` fills, so this does not
 * touch the network. Run that first on a clean checkout.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, ".cache", "chapter-art");
const outDir = join(root, "public", "hero");
mkdirSync(outDir, { recursive: true });

/**
 * The four, in the order they play: carrying, the birth, the newborn, the
 * mother and child. A sequence with an arc, rather than four pictures.
 *
 * The NICU and the feeding close-up are deliberately not here. Both are right
 * for the chapter they belong to and wrong for the first thing anyone sees:
 * one is clinical, the other is intimate in a way a hero plate should not be.
 */
const PLATES = [
  { slug: "pregnancy-antenatal", focus: { x: 0.52, y: 0.44 } },
  { slug: "labour-birth", focus: { x: 0.46, y: 0.5 } },
  { slug: "newborn-care", focus: { x: 0.5, y: 0.5 }, zoom: 1.15 },
  { slug: "postnatal-quality", focus: { x: 0.44, y: 0.4 } },
];

/** 16:9, and large enough that a 1.12 push on a 2560px display still resolves. */
const WIDTH = 2400;
const HEIGHT = 1350;

/**
 * The cinema ramp. Far deeper than the chapter one: black goes to a near-black
 * plum rather than to the body-text colour, and white stops well short of the
 * page so the plate never has a blown-out area for type to disappear into.
 */
const SHADOW = { r: 0x1e, g: 0x08, b: 0x13 };
const HIGHLIGHT = { r: 0xf2, g: 0xbf, b: 0xd3 };
const DUOTONE = {
  slope: ["r", "g", "b"].map((c) => (HIGHLIGHT[c] - SHADOW[c]) / 255),
  intercept: ["r", "g", "b"].map((c) => SHADOW[c]),
};

for (const [i, plate] of PLATES.entries()) {
  const source = join(cacheDir, `${plate.slug}.bin`);
  if (!existsSync(source)) {
    console.error(`  ✗ ${plate.slug}: no cached original; run build-chapter-art.mjs first`);
    continue;
  }
  const buffer = readFileSync(source);
  const meta = await sharp(buffer).metadata();

  const target = WIDTH / HEIGHT;
  const ratio = meta.width / meta.height;
  const zoom = Math.max(1, plate.zoom ?? 1);
  const cw = Math.round((ratio > target ? meta.height * target : meta.width) / zoom);
  const ch = Math.round((ratio > target ? meta.height : meta.width / target) / zoom);
  const left = Math.max(0, Math.min(meta.width - cw, Math.round(plate.focus.x * meta.width - cw / 2)));
  const top = Math.max(0, Math.min(meta.height - ch, Math.round(plate.focus.y * meta.height - ch / 2)));

  // Two passes for the same reason as the chapter plates: `greyscale` forces a
  // single-channel output colourspace at the end of the pipeline, which would
  // discard the duotone silently. See the note in build-chapter-art.mjs.
  const luminance = await sharp(buffer)
    .extract({ left, top, width: cw, height: ch })
    .resize(WIDTH, HEIGHT)
    .greyscale()
    // A little more contrast before the map, so the plate has somewhere to be
    // dark. A flat photograph mapped onto a wide ramp comes out as a wash.
    .linear(1.12, -16)
    .png({ compressionLevel: 0 })
    .toBuffer();

  const name = `${i + 1}-${plate.slug}.webp`;
  const written = await sharp(luminance)
    .toColourspace("srgb")
    .linear(DUOTONE.slope, DUOTONE.intercept)
    .webp({ quality: 80, effort: 6 })
    .toFile(join(outDir, name));

  console.log(`  ✓ ${name}  ${(written.size / 1024).toFixed(0)} KB  ${WIDTH}×${HEIGHT}`);
}

console.log(`\nCredits are already carried by src/lib/data/chapter-art.ts (same photographs).`);
