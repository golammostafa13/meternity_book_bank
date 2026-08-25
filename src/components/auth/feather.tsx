/**
 * One feather, drawn once.
 *
 * The door needed something in the blank middle of the page. Light is
 * atmosphere, and atmosphere is not something a reader can watch; this is the
 * object. A feather is the right one for a maternity library — the lightest
 * thing there is, in the same vocabulary as paper and ink, and not a photograph
 * of a baby, which is what a page like this usually reaches for.
 *
 * A **down** feather, not a flight feather, and that is the whole of the
 * drawing problem. A flight feather is a solid vane you can fill with a path. A
 * down feather has no solid anywhere: it is a curved shaft with a few hundred
 * hairs coming off it, and what you are looking at when you look at one is the
 * *density* of those hairs. So it is drawn as hairs — a hundred-odd thin
 * strokes — with one very soft fill underneath to give it mass. Filling the
 * silhouette and drawing texture on top, which is how the flight feather in the
 * first draft of this file worked, gives you a pink leaf.
 *
 * **Everything comes off one curve.** `RACHIS` is a cubic Bézier; the barbs are
 * placed by sampling it, taking the tangent, and stepping off the normal. Which
 * means the shaft, the fringe and the fill can never fall out of register with
 * each other, and the shape is tuned by moving four control points rather than
 * by editing two hundred coordinates.
 *
 * Three envelopes shape it, and they are what make it read as down rather than
 * as a fern:
 *   • **Length** peaks about 60% along and falls to nothing at both ends, so
 *     there is bare quill at one end and a point at the other.
 *   • **Sweep** leans every barb toward the tip. Barbs at right angles to the
 *     shaft read as a comb.
 *   • **Jitter** varies each barb's length by a few percent, deterministically
 *     from its index. A perfectly even fringe reads as a machined object; this
 *     is the difference between down and a hair comb. Deterministic because a
 *     `Math.random()` here would draw a different feather on the server and in
 *     the browser and React would replace the markup on hydration.
 *
 * Rendered once as an SVG `<symbol>`, so the instances on the page are `<use>`
 * elements rather than four copies of two hundred paths.
 */

/** The shaft, quill end first. Move these four points and the feather changes. */
const RACHIS = [
  [304, 30],
  [206, 50],
  [96, 170],
  [22, 116],
] as const;

/**
 * Density is the whole illusion.
 *
 * The first attempt at this drew 58 barbs a side and the result was a comb: at
 * that spacing you see the individual hairs and the gaps between them, and a
 * feather is the one object where seeing the parts destroys the whole. Down is
 * what a few hundred hairs look like when they are too close together to count.
 * These are defined once in a `<symbol>` and referenced, so the cost of the
 * extra paths is paid once for the page rather than once per feather.
 */
const BARB_COUNT = 150;

/** How much of the shaft, from the quill end, is bare. */
const BARE = 0.2;

/**
 * How far the inner side reaches, against the outer.
 *
 * Low, and that is the shape: a down feather hangs, so its barbs are much
 * longer on the upper side of the curve than on the under side, and what you
 * recognise is the crescent that makes. Both sides equal gives a leaf.
 */
const INNER = 0.32;

function bezier(t: number, i: 0 | 1): number {
  const u = 1 - t;
  return (
    u * u * u * RACHIS[0][i] +
    3 * u * u * t * RACHIS[1][i] +
    3 * u * t * t * RACHIS[2][i] +
    t * t * t * RACHIS[3][i]
  );
}

function tangent(t: number, i: 0 | 1): number {
  const u = 1 - t;
  return (
    3 * u * u * (RACHIS[1][i] - RACHIS[0][i]) +
    6 * u * t * (RACHIS[2][i] - RACHIS[1][i]) +
    3 * t * t * (RACHIS[3][i] - RACHIS[2][i])
  );
}

/** Deterministic 0-1 noise from an integer. See the note above on hydration. */
function jitter(i: number): number {
  const x = Math.sin(i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The barb-length envelope, without the per-barb jitter.
 *
 * Nothing at the quill, nothing at the tip, fullest about 60% along. The soft
 * fill is built from *this* rather than from the jittered tips, so the mass of
 * the feather has a smooth edge and only the hairs past it are ragged. Building
 * the fill from the jittered tips — which is what the first version did — gives
 * you a solid shape with a serrated outline, and a serrated outline is the one
 * thing that cannot be softened by drawing more hairs on top of it.
 */
function envelope(t: number): number {
  // The first fifth of the shaft carries nothing. That bare curved quill is
  // most of what identifies the object: without it the fringe closes into a
  // symmetrical teardrop, which is a paisley, not a feather.
  const u = (t - BARE) / (1 - BARE);
  if (u <= 0) return 0;
  return Math.sin(Math.PI * Math.pow(u, 1.2)) ** 0.92;
}

interface Barb {
  d: string;
  /** Distance along the shaft, 0-1. Used for width and opacity. */
  t: number;
  /** Where this barb ends, so the soft fill can be built from the same points. */
  tip: [number, number];
}

/**
 * @param side  1 is the outer (long) side of the curve, -1 the inner one.
 * @param reach how far this pass of barbs goes. Two passes at different reaches
 *              is what gives the fringe its depth: a dense short one for the
 *              body and a sparse long one for the wisps past its edge.
 */
function barbs(side: 1 | -1, reach: number, seed: number): Barb[] {
  const out: Barb[] = [];
  for (let i = 1; i < BARB_COUNT; i++) {
    const t = i / BARB_COUNT;
    const x = bezier(t, 0);
    const y = bezier(t, 1);

    const tx = tangent(t, 0);
    const ty = tangent(t, 1);
    const mag = Math.hypot(tx, ty) || 1;
    const ux = tx / mag;
    const uy = ty / mag;

    // Barely any jitter — a few per cent. At this density a wide spread reads
    // as a torn edge rather than as a soft one; what softens the edge is the
    // hairs being many and thin, not their lengths disagreeing.
    const len =
      108 * envelope(t) * reach * (side === 1 ? 1 : INNER) *
      (0.93 + 0.14 * jitter(i * 3 + seed));
    if (len < 1.4) continue;

    // Off the normal, leaned toward the tip. Outer barbs lean harder, which is
    // what curls the fringe round the end of the shaft.
    const lean = side === 1 ? 0.66 : 0.46;
    const nx = (-uy * side) * Math.cos(lean) + ux * Math.sin(lean);
    const ny = (ux * side) * Math.cos(lean) + uy * Math.sin(lean);

    const ex = x + nx * len;
    const ey = y + ny * len;
    // Bowed, not straight: a hair under its own weight is a curve. The amount
    // varies per barb, because a hundred and fifty identical arcs interfere
    // into visible concentric rings.
    const bow = len * (0.11 + 0.13 * jitter(i * 7 + seed)) * side;
    const cx = x + nx * len * 0.5 - uy * bow;
    const cy = y + ny * len * 0.5 + ux * bow;

    out.push({
      d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      t,
      tip: [ex, ey],
    });
  }
  return out;
}

/** The smooth outer edge of one vane, from the un-jittered envelope. */
function edge(side: 1 | -1, reach: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= BARB_COUNT; i++) {
    const t = i / BARB_COUNT;
    const x = bezier(t, 0);
    const y = bezier(t, 1);
    const tx = tangent(t, 0);
    const ty = tangent(t, 1);
    const mag = Math.hypot(tx, ty) || 1;
    const ux = tx / mag;
    const uy = ty / mag;
    const len = 108 * envelope(t) * reach * (side === 1 ? 1 : INNER);
    const lean = side === 1 ? 0.66 : 0.46;
    const nx = -uy * side * Math.cos(lean) + ux * Math.sin(lean);
    const ny = ux * side * Math.cos(lean) + uy * Math.sin(lean);
    pts.push(`${(x + nx * len).toFixed(1)} ${(y + ny * len).toFixed(1)}`);
  }
  return pts.join("L");
}

const BODY_OUT = barbs(1, 1, 0);
const BODY_IN = barbs(-1, 1, 11);
const WISP_OUT = barbs(1, 1.3, 5);
const WISP_IN = barbs(-1, 1.26, 23);

/**
 * The mass under the fringe.
 *
 * Two of them: an inner one at 68% of full reach, which is dense enough in the
 * real thing to be opaque, and the full silhouette at a fraction of the
 * opacity. Down is not uniform — it is solid at the shaft and thins to nothing
 * at the edge — and two nested fills plus the hairs is the cheapest thing that
 * has a gradient of density rather than one flat blob with fur on it.
 */
function fill(reach: number): string {
  return `M${edge(1, reach)}L${edge(-1, reach).split("L").reverse().join("L")}Z`;
}

const SILHOUETTE = fill(1);
const CORE = fill(0.68);

const SHAFT = `M${RACHIS[0][0]} ${RACHIS[0][1]} C${RACHIS[1][0]} ${RACHIS[1][1]} ${RACHIS[2][0]} ${RACHIS[2][1]} ${RACHIS[3][0]} ${RACHIS[3][1]}`;

export const FEATHER_SYMBOL_ID = "mbb-feather";
/** The symbol's own box, so instances can size themselves by width alone. */
export const FEATHER_RATIO = 320 / 200;

/**
 * The definition. Rendered once, `aria-hidden`, draws nothing by itself.
 */
export function FeatherDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute" }}
    >
      <defs>
        {/* Across the feather rather than along it: the light is above, so the
            gradient runs from the lit crown down into the shaded underside. Two
            tokens, both defined on `.door` — a near-white pink and the page's
            own blush — so the feather is pale in both themes without a
            per-theme override. */}
        <linearGradient id={`${FEATHER_SYMBOL_ID}-fill`} x1="0.34" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="var(--feather-lit)" />
          <stop offset="100%" stopColor="var(--feather-shade)" />
        </linearGradient>

        <symbol id={FEATHER_SYMBOL_ID} viewBox="0 0 320 200">
          {/* The mass, outer then inner. Low opacities: these are there so the
              middle of the feather is not see-through, not to be seen as
              shapes. */}
          <path
            d={SILHOUETTE}
            fill={`url(#${FEATHER_SYMBOL_ID}-fill)`}
            opacity="0.3"
          />
          <path
            d={CORE}
            fill={`url(#${FEATHER_SYMBOL_ID}-fill)`}
            opacity="0.4"
          />

          {/* The wisps, under the body barbs and reaching past them. */}
          <g
            stroke="var(--feather-lit)"
            strokeWidth="0.35"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
          >
            {WISP_OUT.map((b, i) => (
              <path key={`wo${i}`} d={b.d} />
            ))}
            {WISP_IN.map((b, i) => (
              <path key={`wi${i}`} d={b.d} />
            ))}
          </g>

          {/* The body of the fringe. The inner side is drawn a shade deeper:
              it is the half turned away from the light. */}
          <g strokeLinecap="round" fill="none">
            <g stroke="var(--feather-lit)" strokeWidth="0.5" opacity="0.62">
              {BODY_OUT.map((b, i) => (
                <path key={`bo${i}`} d={b.d} />
              ))}
            </g>
            <g stroke="var(--feather-shade)" strokeWidth="0.45" opacity="0.4">
              {BODY_IN.map((b, i) => (
                <path key={`bi${i}`} d={b.d} />
              ))}
            </g>
          </g>

          {/* The shaft, twice: the round quill and the highlight running down
              it. One stroke reads as a crease in the paper; the pair reads as a
              tube with a light on it. */}
          <path
            d={SHAFT}
            stroke="var(--feather-shade)"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
          />
          <path
            d={SHAFT}
            stroke="var(--feather-lit)"
            strokeWidth="1.05"
            strokeLinecap="round"
            fill="none"
            opacity="1"
          />
        </symbol>
      </defs>
    </svg>
  );
}

/**
 * One drifting instance. Everything that varies arrives as a custom property,
 * so this holds no styling; see `.door__feather` in the stylesheet.
 */
export function Feather({ style }: { style: React.CSSProperties }) {
  return (
    <span className="door__feather" aria-hidden="true" style={style}>
      <svg viewBox="0 0 320 200" focusable="false">
        <use href={`#${FEATHER_SYMBOL_ID}`} />
      </svg>
    </span>
  );
}
