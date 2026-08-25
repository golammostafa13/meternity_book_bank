/**
 * Renders the background film that plays behind the book detail page.
 *
 *   node scripts/build-atmosphere.mjs
 *
 * Writes, committed:
 *   public/atmosphere.webm   ~10 s, VP9, silent, seamless
 *
 * ## Why a generated film rather than a stock clip
 *
 * The page wanted motion behind it. A stock clip of a nursery would be a
 * second photograph competing with the one already there, would need its own
 * licence recorded, and would cost megabytes. What the page actually needs is
 * *light that moves*: a defocused field of blush and plum that drifts across
 * the plate so the still underneath stops reading as a still. That is a dozen
 * blurred discs, which is arithmetic, so it is drawn here instead of filmed.
 *
 * It is composited with `mix-blend-mode: screen`, and that is what decides
 * everything below: black is the identity for screen, so the ground is black
 * and only the light in the frame lands on the page. There is no alpha channel
 * to encode and no matte to get wrong.
 *
 * ## Why it loops seamlessly
 *
 * Every blob moves on a closed path: `sin`/`cos` of an INTEGER multiple of the
 * cycle, so frame 240 is frame 0 exactly. Not approximately, and not by
 * cross-fading the last frame into the first: a cross-fade shows as a pulse
 * every ten seconds, which is far more noticeable on a slow field than a cut.
 *
 * ## Why it is drawn small and then enlarged
 *
 * The subject is out of focus, so it has no detail above about four cycles per
 * screen. Drawing it at 240x135 and letting `sharp` enlarge with a Gaussian on
 * top is both faster than drawing it at full size and *softer* than any blur
 * radius applied to a sharp render: the interpolation is doing half the optics.
 * There is no ffmpeg on this machine; GStreamer's `vp9enc` does the encode.
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");
mkdirSync(out, { recursive: true });

/* --- The film ------------------------------------------------------------
   Ten seconds at twenty-four frames. Twenty-four rather than thirty because
   the subject is soft and slow: the extra six frames a second are six more
   frames of the same gradient, and they are 25% of the file.
   ---------------------------------------------------------------------- */
const FPS = 24;
const SECONDS = 10;
const FRAMES = FPS * SECONDS;

/** The drawing grid. Enlarged to this on the way out. */
const W = 240;
const H = 135;
const OUT_W = 960;
const OUT_H = 540;

/**
 * The blobs.
 *
 * `k` is the integer harmonic that makes the loop close: 1 is one lap of the
 * path per cycle, 2 is two. Mixed harmonics are what stop the field from
 * reading as a single object sliding about, and keeping them small keeps
 * everything slower than the reader's own scroll.
 *
 * `rgb` are the palette's own three pinks plus one near-white, at the
 * intensity they are wanted *on the page*: this is a screen blend over
 * somebody's photograph, so a saturated pink at full strength would flatten
 * the picture into a pink rectangle. Nothing here goes above 40%.
 */
const BLOBS = [
  { x: 0.16, y: 0.28, r: 0.22, ax: 0.10, ay: 0.06, k: 1, phase: 0.00, rgb: [249, 168, 212], gain: 0.15 },
  { x: 0.80, y: 0.22, r: 0.19, ax: 0.08, ay: 0.07, k: 1, phase: 0.42, rgb: [251, 113, 133], gain: 0.11 },
  { x: 0.54, y: 0.78, r: 0.24, ax: 0.07, ay: 0.05, k: 1, phase: 0.71, rgb: [162,  28, 175], gain: 0.15 },
  { x: 0.92, y: 0.68, r: 0.15, ax: 0.09, ay: 0.08, k: 2, phase: 0.18, rgb: [249, 168, 212], gain: 0.08 },
  { x: 0.06, y: 0.82, r: 0.13, ax: 0.06, ay: 0.07, k: 2, phase: 0.55, rgb: [253, 238, 244], gain: 0.05 },
  { x: 0.34, y: 0.08, r: 0.11, ax: 0.12, ay: 0.05, k: 2, phase: 0.90, rgb: [251, 207, 232], gain: 0.06 },
  { x: 0.66, y: 0.46, r: 0.08, ax: 0.15, ay: 0.10, k: 3, phase: 0.31, rgb: [253, 238, 244], gain: 0.05 },
  { x: 0.24, y: 0.58, r: 0.07, ax: 0.12, ay: 0.13, k: 3, phase: 0.64, rgb: [249, 168, 212], gain: 0.04 },
  { x: 0.44, y: 0.34, r: 0.06, ax: 0.17, ay: 0.12, k: 4, phase: 0.12, rgb: [251, 207, 232], gain: 0.04 },
  { x: 0.72, y: 0.90, r: 0.09, ax: 0.14, ay: 0.06, k: 4, phase: 0.77, rgb: [162,  28, 175], gain: 0.06 },
];

const TAU = Math.PI * 2;

/** One frame, as a raw RGB buffer on the small grid. */
function drawFrame(t) {
  const buf = Buffer.alloc(W * H * 3);
  const placed = BLOBS.map((b) => {
    const a = TAU * (b.k * t + b.phase);
    return {
      cx: (b.x + b.ax * Math.sin(a)) * W,
      cy: (b.y + b.ay * Math.cos(a)) * H,
      /* The radius breathes a little, on the same closed path, which is what
         a defocused highlight does as it drifts through the depth of field. */
      s2: 2 * Math.pow(b.r * (1 + 0.12 * Math.sin(a + 1.2)) * H, 2),
      rgb: b.rgb,
      gain: b.gain,
    };
  });

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0;
      let g = 0;
      let bl = 0;
      for (const p of placed) {
        const dx = x - p.cx;
        const dy = y - p.cy;
        const f = p.gain * Math.exp(-(dx * dx + dy * dy) / p.s2);
        r += f * p.rgb[0];
        g += f * p.rgb[1];
        bl += f * p.rgb[2];
      }
      const i = (y * W + x) * 3;
      buf[i] = Math.min(255, r);
      buf[i + 1] = Math.min(255, g);
      buf[i + 2] = Math.min(255, bl);
    }
  }
  return buf;
}

const work = mkdtempSync(join(tmpdir(), "atmosphere-"));
try {
  process.stdout.write(`Drawing ${FRAMES} frames at ${W}x${H}\n`);
  for (let n = 0; n < FRAMES; n++) {
    const raw = drawFrame(n / FRAMES);
    await sharp(raw, { raw: { width: W, height: H, channels: 3 } })
      .resize(OUT_W, OUT_H, { kernel: "lanczos3" })
      .blur(9)
      .png({ compressionLevel: 6 })
      .toFile(join(work, `f${String(n).padStart(4, "0")}.png`));
  }

  const file = join(out, "atmosphere.webm");
  process.stdout.write(`Encoding ${file}\n`);
  execFileSync(
    "gst-launch-1.0",
    [
      "-q",
      "multifilesrc",
      `location=${join(work, "f%04d.png")}`,
      "index=0",
      `stop-index=${FRAMES - 1}`,
      `caps=image/png,framerate=(fraction)${FPS}/1`,
      "!",
      "pngdec",
      "!",
      "videoconvert",
      "!",
      /* Two-pass would buy a little, but the subject is a gradient: the
         encoder's problem here is banding, not bitrate allocation. `deadline`
         is microseconds per frame; this is the "good" preset. */
      "vp9enc",
      "target-bitrate=240000",
      "deadline=1000000",
      "cpu-used=2",
      "keyframe-max-dist=48",
      "!",
      "webmmux",
      "!",
      "filesink",
      `location=${file}`,
    ],
    { stdio: "inherit" },
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
