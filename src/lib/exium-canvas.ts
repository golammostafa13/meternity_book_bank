/**
 * The Exium MUPS 20 carton's artwork, drawn onto 2D canvases.
 *
 * Six faces of a medicine box, painted rather than photographed, for the same
 * reason `lib/cover-canvas.ts` paints book covers rather than loading images:
 * a texture has to be a flat, square-on view of the surface it wraps, and the
 * supplied photograph is a three-quarter studio shot. Its perspective is baked
 * into every pixel, so mapping it onto a `BoxGeometry` face applies the
 * perspective twice and the box reads as a photograph of a box rather than as a
 * box. The `public/exium-mups-20.png` cutout is still used, as the flat, static
 * composition behind the canvas and in the small footer slot, where a WebGL
 * context would be waste.
 *
 * Everything here is measured off the pack: the cream stock, the black-and-
 * orange wordmark, the strapline, the orange swash sweeping out of the lower
 * right, the tablet-count band. Colours are the product's, not the site's:
 * this is a reproduction of someone's packaging and the one thing it must not
 * do is drift toward our palette.
 *
 * Browser-only: it touches `document` and the canvas API, so it is imported
 * from the scene module, which is itself only ever loaded inside an effect.
 */

/** The pack's own colours, sampled from the supplied photograph. */
const PACK = {
  /** Carton stock. Warm off-white, not paper-white. */
  stock: "#f6f3ec",
  /** The same stock in shadow, for the faces turned away from the light. */
  stockShade: "#e6e1d7",
  ink: "#131313",
  /** The "MUPS" orange and the swash. */
  orange: "#e2601f",
  orangeDeep: "#c94d13",
  /** The pale tint the swash fades through before the solid band. */
  orangePale: "#f0b48c",
  grey: "#5d5a55",
  /** Foil, for the blister. */
  foil: "#c9ccd1",
  foilLit: "#f2f4f6",
  foilShade: "#8e939b",
} as const;

/** Carton proportions: 100 wide × 42 high × 26 deep, in pack units. */
export const PACK_SIZE = { width: 100, height: 42, depth: 26 } as const;

function ctxOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width));
  canvas.height = Math.max(2, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

/** `letterSpacing` is recent; setting it where it is missing is a no-op. */
function setTracking(ctx: CanvasRenderingContext2D, value: string) {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      value;
  }
}

/**
 * The carton stock itself: a flat fill, a soft vertical gradient for the way
 * board catches light along its length, and the fine tooth that stops a flat
 * fill reading as a polygon under a specular highlight.
 */
function stock(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shaded = false,
) {
  ctx.fillStyle = shaded ? PACK.stockShade : PACK.stock;
  ctx.fillRect(0, 0, w, h);

  const sheen = ctx.createLinearGradient(0, 0, 0, h);
  sheen.addColorStop(0, "rgba(255,255,255,0.5)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.06)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  const step = Math.max(3, Math.round(w / 220));
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

/**
 * The swash: a wedge that sweeps in from the right edge, pales as it goes, and
 * lands in a solid band across the bottom right corner. Two filled paths and a
 * gradient: the shape is what identifies the pack at a glance, so it is worth
 * getting the curve right rather than approximating it with a rectangle.
 */
function swash(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bandTop = h * 0.78;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w, h * 0.3);
  ctx.bezierCurveTo(w * 0.72, h * 0.42, w * 0.6, h * 0.72, w * 0.42, h);
  ctx.lineTo(w, h);
  ctx.closePath();
  const wedge = ctx.createLinearGradient(w * 0.42, h, w, h * 0.3);
  wedge.addColorStop(0, PACK.orangePale);
  wedge.addColorStop(0.55, "#f4c9a9");
  wedge.addColorStop(1, "#fae4d3");
  ctx.fillStyle = wedge;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.53, h);
  ctx.bezierCurveTo(w * 0.62, bandTop + h * 0.1, w * 0.72, bandTop, w, bandTop * 0.99);
  ctx.lineTo(w, h);
  ctx.closePath();
  const band = ctx.createLinearGradient(w * 0.5, h, w, bandTop);
  band.addColorStop(0, PACK.orangeDeep);
  band.addColorStop(1, PACK.orange);
  ctx.fillStyle = band;
  ctx.fill();

  // "80 Tablets", reversed out of the band.
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${h * 0.058}px system-ui, sans-serif`;
  setTracking(ctx, `${h * 0.004}px`);
  ctx.fillText("80 Tablets", w * 0.955, h * 0.895);
  setTracking(ctx, "0px");
  ctx.restore();
}

/**
 * The wordmark: "Exium" in heavy roman, a superscript ®, "MUPS" in bold
 * italic orange, then the strength in light roman. Set by hand rather than
 * wrapped, because it is a logo: it has one arrangement and it never reflows.
 *
 * Returns the baseline it used so the strapline can sit under it.
 */
function wordmark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = h * 0.185;
  const baseline = h * 0.52;
  let x = w * 0.075;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = PACK.ink;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  setTracking(ctx, `${-size * 0.02}px`);
  ctx.fillText("Exium", x, baseline);
  x += ctx.measureText("Exium").width;
  setTracking(ctx, "0px");

  ctx.font = `600 ${size * 0.36}px system-ui, sans-serif`;
  ctx.fillText("®", x + size * 0.03, baseline - size * 0.52);
  x += size * 0.28;

  ctx.fillStyle = PACK.orange;
  ctx.font = `italic 700 ${size * 0.94}px system-ui, sans-serif`;
  ctx.fillText("MUPS", x, baseline);
  x += ctx.measureText("MUPS").width;

  ctx.fillStyle = PACK.ink;
  ctx.font = `300 ${size}px system-ui, sans-serif`;
  ctx.fillText(" 20", x, baseline);

  return baseline;
}

/**
 * The front face: the one the pack is recognised by, and the only face that
 * gets drawn at full resolution.
 */
export function drawPackFront(width = 1024): HTMLCanvasElement {
  const h = Math.round(width * (PACK_SIZE.height / PACK_SIZE.width));
  const { canvas, ctx } = ctxOf(width, h);
  const w = width;

  stock(ctx, w, h);
  swash(ctx, w, h);
  const baseline = wordmark(ctx, w, h);

  // The generic name, two lines, in the grey the pack uses for small print.
  ctx.fillStyle = PACK.grey;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${h * 0.062}px system-ui, sans-serif`;
  ctx.fillText("Esomeprazole 20 mg", w * 0.075, baseline + h * 0.145);
  ctx.fillText("as Esomeprazole Magnesium USP", w * 0.075, baseline + h * 0.235);

  // The strength, top right, where the pack puts it.
  ctx.fillStyle = PACK.ink;
  ctx.textAlign = "right";
  ctx.font = `500 ${h * 0.088}px system-ui, sans-serif`;
  ctx.fillText("20 mg", w * 0.945, h * 0.18);

  // The board's own edge. A carton is a folded sheet, and the crease along the
  // top and bottom is the difference between a box and a rendered cuboid.
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = Math.max(1, h * 0.006);
  ctx.beginPath();
  ctx.moveTo(0, ctx.lineWidth / 2);
  ctx.lineTo(w, ctx.lineWidth / 2);
  ctx.moveTo(0, h - ctx.lineWidth / 2);
  ctx.lineTo(w, h - ctx.lineWidth / 2);
  ctx.stroke();

  return canvas;
}

/**
 * The end panel: the narrow face, with the wordmark turned to read up the
 * pack. Drawn in the panel's own orientation and rotated by the scene's UVs
 * rather than here, so the text is never resampled twice.
 */
export function drawPackEnd(width = 512): HTMLCanvasElement {
  const h = Math.round(width * (PACK_SIZE.height / PACK_SIZE.depth));
  const { canvas, ctx } = ctxOf(width, h);
  const w = width;

  stock(ctx, w, h, true);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.5);
  ctx.rotate(-Math.PI / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = w * 0.3;

  ctx.fillStyle = PACK.ink;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  const exium = ctx.measureText("Exium").width;
  ctx.font = `italic 700 ${size * 0.94}px system-ui, sans-serif`;
  const mups = ctx.measureText("MUPS 20").width;
  const total = exium + mups + size * 0.2;

  ctx.textAlign = "left";
  let x = -total / 2;
  ctx.fillStyle = PACK.ink;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.fillText("Exium", x, 0);
  x += exium + size * 0.2;
  ctx.fillStyle = PACK.orange;
  ctx.font = `italic 700 ${size * 0.94}px system-ui, sans-serif`;
  ctx.fillText("MUPS 20", x, 0);

  ctx.restore();

  ctx.fillStyle = PACK.orange;
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
  return canvas;
}

/**
 * The top and bottom flaps: stock, a crease, and the small print nobody reads
 * but whose absence makes a pack look like a prop.
 */
export function drawPackFlap(width = 512): HTMLCanvasElement {
  const h = Math.round(width * (PACK_SIZE.depth / PACK_SIZE.width));
  const { canvas, ctx } = ctxOf(width, h);
  const w = width;

  stock(ctx, w, h, true);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = Math.max(1, h * 0.02);
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.5);
  ctx.lineTo(w * 0.94, h * 0.5);
  ctx.stroke();

  ctx.fillStyle = PACK.grey;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `400 ${h * 0.16}px system-ui, sans-serif`;
  ctx.fillText("Esomeprazole Magnesium USP", w * 0.06, h * 0.24);
  ctx.fillText("Keep out of reach of children", w * 0.06, h * 0.76);
  return canvas;
}

/**
 * The blister strip: foil with ten domed tablets pressed into it.
 *
 * Drawn rather than photographed for the same reason as the carton, and the
 * domes are what sell it: each is a radial gradient with its highlight offset
 * up and left, which is where the scene's key light is. Flat ovals read as
 * printed circles.
 */
export function drawBlister(width = 1024): HTMLCanvasElement {
  const h = Math.round(width * 0.42);
  const { canvas, ctx } = ctxOf(width, h);
  const w = width;

  const foil = ctx.createLinearGradient(0, 0, w * 0.2, h);
  foil.addColorStop(0, PACK.foilLit);
  foil.addColorStop(0.4, PACK.foil);
  foil.addColorStop(0.75, PACK.foilShade);
  foil.addColorStop(1, PACK.foil);
  ctx.fillStyle = foil;
  ctx.fillRect(0, 0, w, h);

  // Rolled-foil grain: fine vertical streaks, not noise. Aluminium is milled.
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < w; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "#ffffff" : "#7c828b";
    ctx.fillRect(x, 0, 1, h);
  }
  ctx.restore();

  const cols = 5;
  const rows = 2;
  const cellW = w / cols;
  const cellH = h / rows;
  const rx = cellW * 0.34;
  const ry = cellH * 0.3;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = cellW * (col + 0.5);
      const cy = cellH * (row + 0.5);

      // The pressed rim: a dark ellipse a shade larger than the dome.
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.1, ry * 1.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(80,86,95,0.5)";
      ctx.fill();

      const dome = ctx.createRadialGradient(
        cx - rx * 0.35,
        cy - ry * 0.4,
        rx * 0.1,
        cx,
        cy,
        rx * 1.05,
      );
      dome.addColorStop(0, "#ffffff");
      dome.addColorStop(0.45, "#e7eaee");
      dome.addColorStop(0.85, "#b9bec6");
      dome.addColorStop(1, "#9aa0a9");
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = dome;
      ctx.fill();
    }
  }

  return canvas;
}
