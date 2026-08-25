/**
 * Prepares the sponsor artwork from the two supplied images.
 *
 *   node scripts/build-brand-assets.mjs
 *
 * Writes, both committed:
 *   public/exium-mups-20.png  the pack shot with the studio ground removed
 *   public/courtesy-by.png    the Radiant mark, trimmed
 *
 * The pack shot is used flat: the static composition behind the 3D advert, and
 * the small footer slot where a canvas would be waste. It is deliberately *not*
 * the texture on the 3D carton: the photograph is a three-quarter view, so its
 * own perspective is baked into every pixel, and wrapping that onto a box face
 * gives you the perspective twice. The 3D pack draws its label instead; see
 * `src/lib/exium-canvas.ts`, which is the same approach `lib/cover-canvas.ts`
 * takes for book covers and for the same reason.
 *
 * The interesting part is the alpha cut, and the obvious way to do it is wrong.
 * `exium.png` is a studio photograph on white, and the product is a **white
 * carton**. Thresholding every near-white pixel to transparent punches holes
 * straight through the box, the printed panel and the foil highlights.
 *
 * So the ground is removed by a flood fill inward from the four corners, which
 * stops at the carton's own edge because that edge is a real tonal boundary. A
 * flood fill leaves a pale halo one or two pixels wide along anti-aliased
 * edges, which is invisible on white and very visible on a pink page, so the
 * alpha is then eroded by a pixel and the colour under it is unpremultiplied
 * back toward the object.
 *
 * There is no ImageMagick on the build machine and no need for one: this is a
 * scanline flood fill over a raw RGBA buffer from sharp, which is about thirty
 * lines and has no opinions about anything.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const supplied = join(root, "..");
const out = join(root, "public");
mkdirSync(out, { recursive: true });

/**
 * How far from the seed colour still counts as "the same background".
 *
 * This number is the whole job, and it is narrower than it looks. Measured off
 * the supplied photograph: the studio ground runs 211-227 per channel, and the
 * *white carton* runs 182-205. Six levels of daylight separate the product from
 * the backdrop. The default of 28 anyone would reach for first fills straight
 * through the box and hollows out the printed panel.
 *
 * 11 sits in the gap with room on both sides. Overridable so a re-supplied
 * photograph can be re-tuned without editing this file, but check the result on
 * a dark ground before believing it: a leak into the carton is nearly
 * invisible against white and unmissable against plum.
 */
const TOLERANCE = Number(process.env.GROUND_TOLERANCE ?? 11);

/**
 * Flood fill the background to transparent, starting from the four corners.
 *
 * Scanline fill with an explicit stack rather than recursion: a 567×293 image
 * is 166k pixels and a per-pixel recursive fill overflows the stack on the
 * first large region.
 */
function cutGround(data, width, height) {
  const seen = new Uint8Array(width * height);
  const stack = [];

  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  // The reference colour is the mean of the four corners, so a photograph with
  // a slightly uneven backdrop still reads as one background.
  let r0 = 0;
  let g0 = 0;
  let b0 = 0;
  for (const [x, y] of seeds) {
    const i = (y * width + x) * 4;
    r0 += data[i];
    g0 += data[i + 1];
    b0 += data[i + 2];
  }
  r0 /= seeds.length;
  g0 /= seeds.length;
  b0 /= seeds.length;

  const isGround = (i) =>
    Math.abs(data[i] - r0) <= TOLERANCE &&
    Math.abs(data[i + 1] - g0) <= TOLERANCE &&
    Math.abs(data[i + 2] - b0) <= TOLERANCE;

  for (const [x, y] of seeds) stack.push(x, y);

  while (stack.length > 0) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (seen[p]) continue;
    if (!isGround(p * 4)) continue;

    // Run left and right along this scanline, then seed the rows above and
    // below from the span we just filled.
    let left = x;
    while (left > 0 && !seen[y * width + left - 1] && isGround((y * width + left - 1) * 4)) {
      left -= 1;
    }
    let right = x;
    while (
      right < width - 1 &&
      !seen[y * width + right + 1] &&
      isGround((y * width + right + 1) * 4)
    ) {
      right += 1;
    }

    for (let i = left; i <= right; i++) {
      const q = y * width + i;
      seen[q] = 1;
      data[q * 4 + 3] = 0;
      if (y > 0) stack.push(i, y - 1);
      if (y < height - 1) stack.push(i, y + 1);
    }
  }

  return seen;
}

/**
 * Erode the alpha by one pixel wherever it borders the cut.
 *
 * The halo this removes is the anti-aliased boundary the camera recorded: those
 * pixels are a blend of the product and the white backdrop, so they keep their
 * white content no matter what the alpha says. Cheaper to drop them than to
 * un-blend them, and one pixel off a 567px pack shot is not visible.
 */
function erodeEdge(data, width, height, cut) {
  const doomed = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (cut[p]) continue;
      const neighbours = [
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
      ];
      if (neighbours.some((n) => n >= 0 && cut[n])) doomed.push(p);
    }
  }
  for (const p of doomed) data[p * 4 + 3] = 0;
  return doomed.length;
}

async function buildPackShot() {
  const source = join(supplied, "exium.png");
  const image = sharp(source).ensureAlpha();
  const { width, height } = await image.metadata();
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });

  const cut = cutGround(data, width, height);
  const eroded = erodeEdge(data, width, height, cut);

  const kept = await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Trim what the fill emptied, so the PNG is the pack and not a pack in a
  // field of nothing: the 3D scene and the CSS both want tight bounds.
  const info = await sharp(kept)
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toFile(join(out, "exium-mups-20.png"));

  const cleared = cut.reduce((n, v) => n + v, 0);
  console.log(
    `  exium-mups-20.png  ${info.width}×${info.height}  ` +
      `(${((cleared / (width * height)) * 100).toFixed(1)}% of the frame cut, ` +
      `${eroded} edge pixels eroded)`,
  );
}

async function buildCourtesy() {
  const info = await sharp(join(supplied, "courtesy_by.png"))
    .ensureAlpha()
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toFile(join(out, "courtesy-by.png"));
  console.log(`  courtesy-by.png  ${info.width}×${info.height}`);
}

await buildPackShot();
await buildCourtesy();
console.log("Brand assets written to public/.");
