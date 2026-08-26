/**
 * Builds the seven subject plates for the subject-wise catalogue.
 *
 *   node scripts/build-subject-art.mjs                 # all seven
 *   node scripts/build-subject-art.mjs obstetrics      # one, or a few
 *
 * Output: `public/subjects/<subject-slug>.webp`, 1600×900, committed.
 *
 * **Why these are drawn rather than photographed.** The chapter backgrounds in
 * `build-chapter-art.mjs` are Creative Commons photographs, and each one costs a
 * credit line the About page has to carry. A subject plate is a smaller job —
 * it sits behind a heading and says "this is the gynaecology shelf" — and seven
 * more people's photographs is seven more licences to keep straight for a panel
 * nobody will look at twice. These are generated from an SVG instead: no
 * licence, no network, no credit, and the same file every time it is built.
 *
 * **They still have to look like the same set as the photographs.** So the
 * treatment is deliberately identical: the composition is drawn in greyscale,
 * blurred, and then mapped through the *same* plum-to-blush duotone ramp
 * (`SHADOW` → `HIGHLIGHT`) that the chapter art uses. A subject plate and a
 * chapter background sitting on the same page are two images from one palette,
 * which is the only reason a drawn panel can sit next to a photographed one
 * without looking like a placeholder.
 *
 * Each subject gets its own motif and its own seeded field of soft forms, so
 * the seven read as variations rather than as one gradient recoloured seven
 * times. The seed is the slug, so the art is deterministic: rebuilding does not
 * produce a diff.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "subjects");
mkdirSync(outDir, { recursive: true });

/** 16:9. Used full-bleed as a hero and cropped as a tile, so it wants headroom. */
const WIDTH = 1600;
const HEIGHT = 900;

/**
 * The duotone ramp, copied deliberately from `build-chapter-art.mjs`.
 *
 * Not imported: that script is a one-off asset build that talks to Wikimedia,
 * and importing it would run its download. Two constants that must agree are
 * cheaper to keep in step than a shared module neither script wants.
 */
const SHADOW = { r: 0x4c, g: 0x1d, b: 0x33 };
const HIGHLIGHT = { r: 0xfb, g: 0xe4, b: 0xec };
const DUOTONE = {
  slope: ["r", "g", "b"].map((c) => (HIGHLIGHT[c] - SHADOW[c]) / 255),
  intercept: ["r", "g", "b"].map((c) => SHADOW[c]),
};

/**
 * Deterministic PRNG (mulberry32) seeded from the slug.
 *
 * `Math.random` here would mean every rebuild rewrites all seven WebPs with
 * visually identical but byte-different art, which turns "add a subject" into a
 * seven-file diff. Seeding from the slug makes the art a pure function of the
 * subject.
 */
function rng(slug) {
  let h = 1779033703 ^ slug.length;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(h ^ slug.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The motifs.
 *
 * Each is a greyscale SVG fragment: light means highlight once the duotone is
 * applied, dark means ink. They are abstractions of the subject rather than
 * pictures of it — a fetal heart trace, a pelvic ring, a helix — because a
 * literal illustration at this size becomes clip-art, and clip-art is worse
 * than a gradient.
 *
 * `next` is the seeded RNG, so a motif can vary without becoming random.
 */
const motifs = {
  /** Nested arcs: the curve of a term abdomen, drawn as contour lines. */
  obstetrics(next) {
    let d = "";
    for (let i = 0; i < 7; i++) {
      const r = 190 + i * 62 + next() * 14;
      d += `<circle cx="1180" cy="470" r="${r.toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${(0.5 - i * 0.055).toFixed(3)}" stroke-width="${(3.5 - i * 0.3).toFixed(2)}"/>`;
    }
    return d;
  },

  /** Overlapping petal forms: the vesica shape a bimanual exam diagram uses. */
  gynecology(next) {
    let d = "";
    for (let i = 0; i < 5; i++) {
      const rot = -28 + i * 14 + next() * 5;
      const rx = 120 + i * 26;
      const ry = 300 + i * 34;
      d += `<ellipse cx="1150" cy="450" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-opacity="${(0.46 - i * 0.07).toFixed(3)}" stroke-width="2.6" transform="rotate(${rot.toFixed(1)} 1150 450)"/>`;
    }
    return d;
  },

  /** A cardiotocograph trace: the one line every MFM clinic is reading. */
  "maternal-fetal-medicine"(next) {
    const baseline = 470;
    let d = "";
    for (let pass = 0; pass < 3; pass++) {
      let path = `M 240 ${baseline}`;
      for (let x = 240; x <= 1460; x += 20) {
        const y =
          baseline +
          Math.sin((x + pass * 90) / 62) * (34 + pass * 12) +
          Math.sin(x / 17) * 9 * next();
      path += ` L ${x} ${y.toFixed(1)}`;
      }
      d += `<path d="${path}" fill="none" stroke="#fff" stroke-opacity="${(0.5 - pass * 0.14).toFixed(3)}" stroke-width="${(3 - pass * 0.7).toFixed(2)}" stroke-linecap="round"/>`;
    }
    return d;
  },

  /** A double helix, dotted: endocrinology's own shorthand. */
  "reproductive-endocrinology-infertility"(next) {
    let d = "";
    for (let i = 0; i <= 74; i++) {
      const t = i / 74;
      const x = 300 + t * 1050;
      const spread = Math.sin(t * Math.PI * 3.1) * 150;
      const y1 = 450 + spread;
      const y2 = 450 - spread;
      const o = 0.16 + Math.abs(Math.cos(t * Math.PI * 3.1)) * 0.34;
      if (i % 6 === 0) {
        d += `<line x1="${x.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-opacity="${(o * 0.5).toFixed(3)}" stroke-width="1.8"/>`;
      }
      const r = 4.5 + next() * 2;
      d += `<circle cx="${x.toFixed(1)}" cy="${y1.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" fill-opacity="${o.toFixed(3)}"/>`;
      d += `<circle cx="${x.toFixed(1)}" cy="${y2.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" fill-opacity="${o.toFixed(3)}"/>`;
    }
    return d;
  },

  /** Concentric cell rings: what a colposcope and a slide both look like. */
  "gynecologic-oncology"(next) {
    let d = "";
    const cells = [
      [1170, 400, 210],
      [860, 610, 130],
      [1400, 660, 95],
      [1010, 235, 78],
    ];
    for (const [cx, cy, r] of cells) {
      for (let i = 0; i < 4; i++) {
        const rr = r * (1 - i * 0.19) + next() * 6;
        d += `<circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${(0.44 - i * 0.08).toFixed(3)}" stroke-width="2.4"/>`;
      }
      d += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.14).toFixed(1)}" fill="#fff" fill-opacity="0.34"/>`;
    }
    return d;
  },

  /** The pelvic ring: interlocking arcs around an open centre. */
  "urogynecology-pelvic-reconstructive-surgery"(next) {
    let d = "";
    for (let i = 0; i < 5; i++) {
      const r = 150 + i * 66;
      const sweep = 150 + next() * 30;
      const start = -sweep / 2 - 90;
      const end = sweep / 2 - 90;
      const rad = (deg) => (deg * Math.PI) / 180;
      const x1 = 1160 + r * Math.cos(rad(start));
      const y1 = 470 + r * Math.sin(rad(start));
      const x2 = 1160 + r * Math.cos(rad(end));
      const y2 = 470 + r * Math.sin(rad(end));
      const o = (0.48 - i * 0.07).toFixed(3);
      d += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="3" stroke-linecap="round"/>`;
      d += `<path d="M ${(2320 - x1).toFixed(1)} ${(940 - y1).toFixed(1)} A ${r} ${r} 0 0 1 ${(2320 - x2).toFixed(1)} ${(940 - y2).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return d;
  },

  /** A calendar field: family planning is, at bottom, a chart of days. */
  "family-planning"(next) {
    let d = "";
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 9; col++) {
        const cx = 840 + col * 78;
        const cy = 250 + row * 78;
        const on = next();
        const r = on > 0.62 ? 15 + next() * 6 : 6.5;
        const o = on > 0.62 ? 0.42 : 0.2;
        d +=
          on > 0.62
            ? `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="2.6"/>`
            : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity="${o}"/>`;
      }
    }
    return d;
  },
};

/**
 * The ground the motif sits on: a soft field of blurred blobs, seeded.
 *
 * Without it a motif floats on a flat wash and reads as a diagram. The blobs
 * give the plate the tonal variation a photograph would have supplied, which is
 * what the duotone needs to have something to interpolate between.
 */
function ground(next) {
  let d = "";
  for (let i = 0; i < 9; i++) {
    const cx = next() * WIDTH;
    const cy = next() * HEIGHT;
    const r = 190 + next() * 330;
    const light = next() > 0.45;
    d += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${light ? "#fff" : "#000"}" fill-opacity="${(0.05 + next() * 0.1).toFixed(3)}"/>`;
  }
  return d;
}

/**
 * The plate, in greyscale.
 *
 * Mid-grey base rather than black or white: the duotone maps 0→ink and
 * 255→blush, so a plate drawn around the middle of the range lands in the
 * middle of the palette, where a heading can sit on it in either theme.
 */
function svg(slug, next) {
  const motif = motifs[slug];
  if (!motif) throw new Error(`No motif for subject: ${slug}`);
  const tilt = (next() * 24 - 12).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6f6f6f"/>
      <stop offset="0.55" stop-color="#9a9a9a"/>
      <stop offset="1" stop-color="#d2d2d2"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
  <g transform="rotate(${tilt} ${WIDTH / 2} ${HEIGHT / 2})">${ground(next)}</g>
  <g>${motif(next)}</g>
</svg>`;
}

const slugs = Object.keys(motifs);
const only = process.argv.slice(2);
const targets = only.length ? only : slugs;

for (const slug of targets) {
  if (!motifs[slug]) {
    console.error(`  ✗ ${slug} — no motif; known: ${slugs.join(", ")}`);
    process.exitCode = 1;
    continue;
  }
  const next = rng(slug);

  // Two passes, and the order matters, exactly as in `build-chapter-art.mjs`:
  // `greyscale()` sets the output colourspace for the whole pipeline whenever it
  // appears, so the duotone has to happen to an already-rendered buffer.
  const grey = await sharp(Buffer.from(svg(slug, next)))
    .greyscale()
    .blur(2.2)
    .png({ compressionLevel: 0 })
    .toBuffer();

  const written = await sharp(grey)
    .toColourspace("srgb")
    .linear(DUOTONE.slope, DUOTONE.intercept)
    .webp({ quality: 80, effort: 6 })
    .toFile(join(outDir, `${slug}.webp`));

  console.log(`  ✓ ${slug}.webp  ${(written.size / 1024).toFixed(0)} KB`);
}

console.log(`\n${targets.length} subject plates written to public/subjects/.`);
