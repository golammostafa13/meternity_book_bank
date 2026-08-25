/**
 * Cover art, drawn onto a 2D canvas.
 *
 * `components/cover-art.tsx` builds the same five layouts out of DOM and CSS,
 * which is right for a page: the title stays selectable, the type scales in
 * container units, and nothing is baked into pixels. A texture on a WebGL mesh
 * cannot be any of those things, so the same vocabulary is drawn here instead:
 * head panel, diagonal split, disc, rules, frame; heavy grotesk title, hairline
 * accent, author in caps at the foot.
 *
 * It is a *port*, not a second design. Colour still comes from `cover-theme`,
 * the layout is still `coverVariant`, and every measurement below is the same
 * fraction of the cover width that the CSS version uses in `cqw`, so a book in
 * the hero scene and the same book in the catalogue grid are recognisably the
 * one object.
 *
 * Browser-only: it touches `document` and the canvas API, so it is imported
 * from the scene module, which itself is only ever loaded inside an effect.
 */

import { coverTheme, coverVariant, type CoverTheme } from "@/lib/cover-theme";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { bookAuthorName, bookTitle } from "@/lib/i18n/content";
import type { Book } from "@/types";

export type CoverBook = Pick<
  Book,
  | "id"
  | "title"
  | "titleBn"
  | "authorName"
  | "authorNameBn"
  | "coverHue"
  | "coverImage"
>;

/** The proportions every volume in the catalogue is drawn at. */
export const COVER_RATIO = 2 / 2.7;

/**
 * The real family names next/font generated, read off the document once. They
 * are hashed at build time (`__Familjen_Grotesk_a1b2c3`), so they cannot be
 * hard-coded, but they are valid CSS font shorthand, which is all the canvas
 * needs.
 */
let fonts: { display: string; bengali: string } | null = null;

function fontStacks() {
  if (fonts) return fonts;
  const root = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const value = root.getPropertyValue(name).trim();
    return value ? `${value}, ${fallback}` : fallback;
  };
  fonts = {
    display: read("--font-display", "system-ui, sans-serif"),
    bengali: read("--font-bengali", "system-ui, sans-serif"),
  };
  return fonts;
}

/** Invalidate the cached stacks: only needed if fonts swap in after paint. */
export function resetFontStacks() {
  fonts = null;
}

function ctxOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

/**
 * Greedy wrap that also shrinks: a title long enough to need six lines gets a
 * smaller face rather than overflowing the board. Bengali conjuncts stack
 * taller, so it is given fewer lines at the same size.
 */
function layoutTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  lineRatio: number,
  family: string,
  weight: string,
  maxLines: number,
) {
  let size = startSize;
  for (let attempt = 0; attempt < 7; attempt++) {
    ctx.font = `${weight} ${size}px ${family}`;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    let overflowed = false;

    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) {
        // A single word wider than the board still has to go somewhere; it is
        // allowed to sit long rather than be dropped.
        if (!line && ctx.measureText(next).width > maxWidth) overflowed = true;
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);

    if (lines.length <= maxLines && !overflowed) {
      return { lines, size, lineHeight: size * lineRatio };
    }
    size *= 0.86;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  return { lines: [text], size, lineHeight: size * lineRatio };
}

/** `letterSpacing` is recent; setting it where it is missing is a no-op. */
function setTracking(ctx: CanvasRenderingContext2D, value: string) {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      value;
  }
}

/**
 * The printed-paper tooth from the CSS version: a fine dot screen multiplied
 * over the finished art. Without it, flat fills read as WebGL polygons under a
 * specular highlight rather than as ink on stock.
 */
function paperTooth(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const step = Math.max(3, Math.round(w / 128));
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

/**
 * The front board.
 *
 * `width` sets the texture resolution; every other measurement is derived from
 * it, so the hero volume can be drawn at 1024 and the fifteen covers behind it
 * at 384 with no second set of numbers.
 */
export function drawCoverFace(
  book: CoverBook,
  lang: Locale = defaultLocale,
  width = 512,
): HTMLCanvasElement {
  const w = width;
  const h = Math.round(width / COVER_RATIO);
  const { canvas, ctx } = ctxOf(w, h);
  const t = coverTheme(book);
  const variant = coverVariant(book);
  const stacks = fontStacks();

  const displayTitle = bookTitle(book, lang);
  // Whether the *rendered* string is Bengali, not whether the reader is.
  const isBn = displayTitle === book.titleBn;
  const accent = t.light ? t.mid : "#ff7a3d";

  ctx.fillStyle = t.paper;
  ctx.fillRect(0, 0, w, h);

  // --- Layout variants, in the same order as cover-art.tsx ---------------
  if (variant === 0) {
    ctx.fillStyle = t.deep;
    ctx.fillRect(0, 0, w, h * 0.34);
    ctx.fillStyle = accent;
    ctx.fillRect(0, h * 0.34, w, w * 0.015);
  } else if (variant === 1) {
    // The 148° split, expressed as a gradient with hard stops so the bands
    // stay bands rather than blurring into each other.
    const angle = ((148 - 90) * Math.PI) / 180;
    const len = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
    const cx = w / 2;
    const cy = h / 2;
    const dx = (Math.sin(angle) * len) / 2;
    const dy = (-Math.cos(angle) * len) / 2;
    const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    g.addColorStop(0, t.deep);
    g.addColorStop(0.46, t.deep);
    g.addColorStop(0.461, t.mid);
    g.addColorStop(0.52, t.mid);
    g.addColorStop(0.521, t.paper);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (variant === 2) {
    const r = w * 0.29;
    ctx.fillStyle = t.mid;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.26 + r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = t.deep;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = w * 0.009;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.26 + r + r * 2 * 0.13, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (variant === 3) {
    const top = h * 0.46;
    const band = h * 0.54;
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = i === 4 ? 1 : 0.2 + i * 0.15;
      ctx.fillStyle = i === 4 ? accent : t.mid;
      ctx.fillRect(w * 0.09, top + band * i * 0.15, w * 0.82, band * 0.055);
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = t.deep;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = w * 0.007;
    const inset = w * 0.055;
    ctx.strokeRect(
      inset + ctx.lineWidth / 2,
      inset + ctx.lineWidth / 2,
      w - inset * 2 - ctx.lineWidth,
      h - inset * 2 - ctx.lineWidth,
    );
    ctx.globalAlpha = 1;
    // The single orange block, bottom-right, like the reference's bookmark.
    ctx.fillStyle = accent;
    ctx.fillRect(w - w * 0.055 - w * 0.22, h - h * 0.055 - h * 0.09, w * 0.22, h * 0.09);
  }

  // --- Type --------------------------------------------------------------
  const pad = w * 0.075;
  const boxWidth = w - pad * 2;
  const family = isBn ? stacks.bengali : stacks.display;

  const metaSize = w * 0.019 * 1.6;
  const footHeight = metaSize * 2.2;

  setTracking(ctx, isBn ? "0px" : `${-0.02 * (w * 0.084)}px`);
  const title = layoutTitle(
    ctx,
    displayTitle,
    boxWidth,
    w * 0.084,
    isBn ? 1.32 : 1.06,
    family,
    "700",
    isBn ? 4 : 5,
  );

  const ruleGap = boxWidth * 0.06;
  const ruleHeight = w * 0.009;
  const blockHeight =
    title.lines.length * title.lineHeight +
    (variant !== 3 ? ruleGap + ruleHeight : 0);

  // Centred in the space between the head padding and the author line, which
  // is what `flex-1 justify-center` does in the CSS version.
  const regionTop = pad;
  const regionHeight = h - pad - footHeight - regionTop;
  let y = regionTop + Math.max(0, (regionHeight - blockHeight) / 2);

  ctx.fillStyle = t.ink;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  for (const line of title.lines) {
    // Bengali hangs from a headline stroke and needs more room above the
    // baseline than a Latin cap does.
    ctx.fillText(line, pad, y + title.size * (isBn ? 0.88 : 0.78));
    y += title.lineHeight;
  }
  setTracking(ctx, "0px");

  if (variant !== 3) {
    ctx.fillStyle = accent;
    ctx.fillRect(pad, y + ruleGap, boxWidth * 0.26, ruleHeight);
  }

  const author = bookAuthorName(book, lang);
  const authorIsBn = author === book.authorNameBn;
  ctx.font = `500 ${metaSize}px ${authorIsBn ? stacks.bengali : stacks.display}`;
  setTracking(ctx, `${metaSize * 0.14}px`);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = t.ink;
  // Bengali has no case, so upper-casing it would be a no-op at best.
  ctx.fillText(authorIsBn ? author : author.toUpperCase(), pad, h - pad);
  ctx.globalAlpha = 1;
  setTracking(ctx, "0px");

  paperTooth(ctx, w, h);
  return canvas;
}

/**
 * The back board: the same stock, no title. Real books put almost nothing here
 * and neither does this: a deep panel and the one accent mark, so a volume
 * seen from behind still reads as belonging to the set.
 */
export function drawCoverBack(book: CoverBook, width = 256): HTMLCanvasElement {
  const w = width;
  const h = Math.round(width / COVER_RATIO);
  const { canvas, ctx } = ctxOf(w, h);
  const t = coverTheme(book);
  const accent = t.light ? t.mid : "#ff7a3d";

  ctx.fillStyle = t.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = t.deep;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(w * 0.1, h * 0.12, w * 0.8, h * 0.46);
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.1, h - h * 0.12 - h * 0.02, w * 0.24, h * 0.02);
  paperTooth(ctx, w, h);
  return canvas;
}

/**
 * The spine, drawn tall so the title can run up it the way it does on a shelf.
 * The mesh face it lands on is narrow, so this stays deliberately coarse.
 */
export function drawSpine(
  book: CoverBook,
  lang: Locale = defaultLocale,
  height = 512,
): HTMLCanvasElement {
  const h = height;
  const w = Math.round(height * 0.11);
  const { canvas, ctx } = ctxOf(w, h);
  const t = coverTheme(book);
  const stacks = fontStacks();

  ctx.fillStyle = t.spine;
  ctx.fillRect(0, 0, w, h);
  // Bound cloth catches light along its curve; a horizontal ramp is enough to
  // stop the strip reading as a flat rectangle.
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(0,0,0,0.35)");
  g.addColorStop(0.45, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const displayTitle = bookTitle(book, lang);
  const isBn = displayTitle === book.titleBn;
  ctx.save();
  ctx.translate(w / 2, h * 0.9);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = t.spineInk;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let size = w * 0.52;
  const room = h * 0.78;
  for (let i = 0; i < 5; i++) {
    ctx.font = `600 ${size}px ${isBn ? stacks.bengali : stacks.display}`;
    if (ctx.measureText(displayTitle).width <= room) break;
    size *= 0.85;
  }
  ctx.fillText(displayTitle, 0, 0);
  ctx.restore();
  return canvas;
}

/**
 * The page block's exposed edges. Real page edges are hundreds of sheets seen
 * end-on; a few hundred hairlines of varying warmth is what that looks like at
 * this distance, and it is the detail that stops the block reading as a solid
 * cream brick.
 */
export function drawPageEdge(size = 512): HTMLCanvasElement {
  const { canvas, ctx } = ctxOf(size, size);
  ctx.fillStyle = "#efe7d8";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 2) {
    // Deterministic, not random: the same edge every reload, and identical
    // between two volumes lit from different sides.
    const n = (Math.sin(x * 12.9898) * 43758.5453) % 1;
    ctx.globalAlpha = 0.06 + Math.abs(n) * 0.14;
    ctx.fillStyle = n > 0 ? "#b9a988" : "#fffaf0";
    ctx.fillRect(x, 0, 1, size);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

/** Theme colours a mesh needs that are not part of the drawn art. */
export function bookColours(book: CoverBook): CoverTheme {
  return coverTheme(book);
}
