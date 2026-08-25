/**
 * Builds the raster app icons from the same mark `components/brand.tsx` draws.
 *
 * Run this after editing `BrandArt`: the paths are duplicated here on purpose
 * (a build script cannot import a TSX component) and they will drift silently
 * if only one side is changed.
 *
 *   node scripts/build-icons.mjs
 *
 * Writes `src/app/favicon.ico` (16/32/48) and `src/app/apple-icon.png` (180).
 * `src/app/icon.svg` is authored by hand and is what modern browsers actually
 * use; these two exist for the slots that cannot take an SVG: the legacy
 * favicon request and the iOS home screen.
 *
 * A one-off tool, not part of the build: it leans on the `sharp` that Next
 * already installs rather than adding a dependency for three files that change
 * about as often as the company name. Run it after editing the mark.
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");

/** The tile, as in globals.css `.brand-mark`: light-mode brand tokens. */
const tile = (inner, rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs><linearGradient id="t" x1="4" y1="0" x2="44" y2="48" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fb7185"/><stop offset="0.55" stop-color="#ec4899"/><stop offset="1" stop-color="#a21caf"/>
  </linearGradient></defs>
  <rect width="48" height="48" rx="${rx}" fill="url(#t)"/>${inner}</svg>`;

/** The drawing, as in `icon.svg`. */
const mark = (scale, cy) => `<g transform="translate(24 ${cy}) scale(${scale}) translate(-24 -24)">
  <path d="M22.6 24.6c-1.9-2.7-5-4.3-8.5-4.3H9.2A2.2 2.2 0 0 0 7 22.5v12.2c0 1.2 1 2.2 2.2 2.2h5c3.4 0 6.5 1.6 8.4 4.3z" fill="#fff" fill-opacity="0.96"/>
  <path d="M25.4 24.6c1.9-2.7 5-4.3 8.5-4.3h4.9a2.2 2.2 0 0 1 2.2 2.2v12.2c0 1.2-1 2.2-2.2 2.2h-5c-3.4 0-6.5 1.6-8.4 4.3z" fill="#fff" fill-opacity="0.96"/>
  <path d="M16.5 10.9c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <circle cx="24" cy="11.4" r="3.3" fill="#fff"/>
</g>`;

/**
 * The same idea redrawn for the tab: heavier boards, a wider gutter, and **no
 * arc**.
 *
 * The arms in the full mark clear the boards by 1.9 of the 48 units the drawing
 * is authored in. At 16px those units are three to the pixel, so the channel is
 * two thirds of a pixel wide and closes: the arc fuses with the book and the
 * disc fuses with the arc, and what is left is a pale blob. Downscaling is not
 * the problem and no amount of anti-aliasing fixes it; the shape is simply
 * finer than the medium.
 *
 * So the favicon keeps the two shapes that survive: a solid disc over an open
 * book, which is the same reading (someone with a book) in the two marks a
 * 16px slot can hold. The ancestor of this file needed a separate cut for
 * exactly the same reason, and having to make one is a property of favicons
 * rather than a fault in the mark.
 */
const markSmall = `<g>
  <path d="M22.2 27c-2.1-2.9-5.4-4.6-9.1-4.6H7.8A1.8 1.8 0 0 0 6 24.2v13c0 1 .8 1.8 1.8 1.8h5.3c3.7 0 7 1.7 9.1 4.6z" fill="#fff"/>
  <path d="M25.8 27c2.1-2.9 5.4-4.6 9.1-4.6h5.3c1 0 1.8.8 1.8 1.8v13c0 1-.8 1.8-1.8 1.8h-5.3c-3.7 0-7 1.7-9.1 4.6z" fill="#fff"/>
  <circle cx="24" cy="12.6" r="6.2" fill="#fff"/>
</g>`;

const png = (svg, size) =>
  // A high render density first, then a downscale: rasterising a 48-unit box
  // straight to 16px hands the curves to the SVG renderer's own aliasing,
  // which is worse than sharp's.
  sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toBuffer();

/**
 * A PNG-framed .ico. Every browser and every Windows since Vista reads this;
 * the alternative is a BMP frame with a hand-built AND mask, for the sake of
 * IE 6.
 */
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  let offset = 6 + frames.length * 16;
  const dir = frames.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...dir, ...frames.map((f) => f.data)]);
}

const sizes = [16, 32, 48];
const frames = await Promise.all(
  sizes.map(async (size) => ({
    size,
    // The tile's corner radius is a proportion of the tile, so it scales with it.
    data: await png(tile(markSmall, 9), size),
  })),
);
writeFileSync(join(appDir, "favicon.ico"), ico(frames));

// Full bleed and a wider margin: iOS masks its own corners off the artwork,
// and anything near the edge is what it cuts.
writeFileSync(
  join(appDir, "apple-icon.png"),
  await png(tile(mark(0.84, 24.6), 0), 180),
);

console.log(`favicon.ico (${sizes.join(", ")}) + apple-icon.png (180) written`);
