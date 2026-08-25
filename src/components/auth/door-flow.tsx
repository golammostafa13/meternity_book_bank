import { Feather, FeatherDefs } from "@/components/auth/feather";

/**
 * The light behind the door.
 *
 * `/` lands on sign-in and there is no way past it, so this is the first thing
 * anyone sees of the library — and until now it was a form on blush paper. The
 * rest of the site opens on a cinema band; the door should read as the same
 * production, and the way to do that without a photograph is light.
 *
 * Two layers, and they are doing different jobs. The **plumes** are the light:
 * six soft ribbons of the brand pink at four depths, which are the room. The
 * **feathers** are the objects in it — see `feather.tsx` for how one is drawn.
 * The light was here first and on its own it was not enough: a wash cannot be
 * watched, and the whole middle of this page is blank space with nothing in it
 * to look at.
 *
 * Three things make the plumes read as a lit room rather than as coloured blobs:
 *
 *   • **The silhouette.** Each plume is an asymmetric leaf (mismatched corner
 *     radii on both axes), not a circle. Blurred hard, a circle stays a bokeh
 *     dot and the leaf's long edge tapers off into nothing — which is what a
 *     feather of light looks like.
 *   • **The depth.** `--z` is a real translation under the container's own
 *     `perspective`, so the far plumes are smaller *because they are further
 *     away*, and they lose contrast and focus to match. Hand-picking a smaller
 *     width instead just gives you a small plume at the same distance.
 *   • **The drift.** Slow, out of phase, and never repeating the same pose at
 *     the same time, so the field never reads as a loop.
 *
 * Server Component, no canvas, no image: the whole field is six spans and a
 * gradient, and it ships nothing to the client but markup. Same argument as
 * `hero-cinematic` — a WebGL aurora would cost a bundle and a main-thread
 * budget to say something CSS can say on the compositor.
 *
 * `aria-hidden`, and `pointer-events: none` in the stylesheet: there is exactly
 * one thing to do on this page and a plume must never be able to swallow the
 * click meant for the password field. (That bug already exists once on this
 * page in the shape of the intro curtain, which is a fixed overlay by design;
 * it does not need a second cause.)
 */

interface Plume {
  /** Stable key; also a note to the reader of what each plume is doing. */
  id: string;
  /** Position and size of the resting box. */
  x: string;
  y: string;
  w: string;
  h: string;
  /** Depth, under the field's shared camera. Negative is further away. */
  z: string;
  /** Resting rotation; the drift rides on top of it. */
  tilt: string;
  /** Blur radius. Further plumes are softer — aerial perspective, in one value. */
  soft: string;
  /** Resting opacity, before the per-theme glow scalar. */
  dim: number;
  /** Which pink. Three tokens rather than one, so the field has warmth in it. */
  tint: string;
  /** Travel and spin at the far end of the drift. */
  dx: string;
  dy: string;
  spin: string;
  /** Timing. Coprime-ish durations, so the six never re-align. */
  dur: string;
  delay: string;
}

/**
 * Read this as a lighting plot, not a list of decorations.
 *
 * The key light is the big plume top-left, because that is where the key light
 * is in every other 3D block on the site (the books, the catalogue tiles, the
 * card bevel below). `fill` warms the foot of the page so the card is not
 * standing on nothing, and the two `far` plumes exist to be out of focus — a
 * field where everything is equally sharp has no depth in it.
 */
const PLUMES: readonly Plume[] = [
  {
    id: "key",
    x: "-14%",
    y: "-22%",
    w: "66vmax",
    h: "20vmax",
    z: "0px",
    tilt: "-16deg",
    soft: "32px",
    dim: 0.92,
    tint: "var(--accent-lit)",
    dx: "5%",
    dy: "6%",
    spin: "6deg",
    dur: "53s",
    delay: "0s",
  },
  {
    id: "sweep",
    x: "36%",
    y: "-30%",
    w: "72vmax",
    h: "17vmax",
    z: "-140px",
    tilt: "24deg",
    soft: "40px",
    dim: 0.72,
    tint: "var(--brand-2)",
    dx: "-7%",
    dy: "9%",
    spin: "-8deg",
    dur: "67s",
    delay: "-11s",
  },
  {
    id: "fill",
    x: "-6%",
    y: "62%",
    w: "76vmax",
    h: "22vmax",
    z: "-60px",
    tilt: "8deg",
    soft: "38px",
    dim: 0.74,
    tint: "var(--brand-1)",
    dx: "6%",
    dy: "-5%",
    spin: "5deg",
    dur: "59s",
    delay: "-23s",
  },
  {
    id: "rim",
    x: "58%",
    y: "44%",
    w: "54vmax",
    h: "15vmax",
    z: "60px",
    tilt: "-30deg",
    soft: "28px",
    dim: 0.62,
    tint: "var(--accent-lit)",
    dx: "-5%",
    dy: "-8%",
    spin: "7deg",
    dur: "47s",
    delay: "-7s",
  },
  {
    id: "far-1",
    x: "12%",
    y: "20%",
    w: "48vmax",
    h: "12vmax",
    z: "-320px",
    tilt: "42deg",
    soft: "54px",
    dim: 0.54,
    tint: "var(--brand-3)",
    dx: "9%",
    dy: "-7%",
    spin: "-11deg",
    dur: "73s",
    delay: "-31s",
  },
  {
    id: "far-2",
    x: "70%",
    y: "-6%",
    w: "52vmax",
    h: "13vmax",
    z: "-260px",
    tilt: "-48deg",
    soft: "48px",
    dim: 0.5,
    tint: "var(--accent-lit)",
    dx: "-8%",
    dy: "10%",
    spin: "9deg",
    dur: "61s",
    delay: "-17s",
  },
];

/**
 * Where the feathers sit, and this list is mostly a map of where the page is
 * empty. The door is a two-column layout with copy hard left and the card hard
 * right, so the band between them is dead space at every width above `lg` —
 * that is where three of these go. The fourth sits under the card, in the strip
 * below the fold that the register form grows into.
 *
 * `--w` is the only size: the instance keeps the symbol's aspect ratio, so a
 * feather cannot be squashed by a bad height.
 *
 * `small: false` drops an instance below `lg`, where the card is the whole page
 * and there is no blank space left to put anything in. The two that survive are
 * the ones clear of it, top and bottom.
 */
const FEATHERS = [
  { id: "high", x: "38%", y: "4%", w: "17rem", tilt: "-8deg", dim: 0.9, dur: "23s", delay: "0s", small: true },
  { id: "mid", x: "47%", y: "40%", w: "12rem", tilt: "166deg", dim: 0.62, dur: "31s", delay: "-9s", small: false },
  // Right of 34%: the sponsor's pack sits in the left column down to about a
  // third of the way across, and a feather over its logo is a feather over
  // somebody's trademark.
  { id: "low", x: "37%", y: "74%", w: "14rem", tilt: "22deg", dim: 0.74, dur: "27s", delay: "-16s", small: true },
  { id: "under", x: "68%", y: "86%", w: "9.5rem", tilt: "-34deg", dim: 0.5, dur: "35s", delay: "-4s", small: false },
] as const;

export function DoorFlow() {
  return (
    <div className="door__flow" aria-hidden="true">
      {/* The room, before anything is moving in it. Even with the drift
          stopped — reduced motion, a print — the page is still lit. */}
      <div className="door__wash" />

      {PLUMES.map((f) => (
        <span
          key={f.id}
          className="door__plume"
          style={
            {
              "--x": f.x,
              "--y": f.y,
              "--w": f.w,
              "--h": f.h,
              "--z": f.z,
              "--tilt": f.tilt,
              "--soft": f.soft,
              "--dim": f.dim,
              "--tint": f.tint,
              "--dx": f.dx,
              "--dy": f.dy,
              "--spin": f.spin,
              "--dur": f.dur,
              "--delay": f.delay,
            } as React.CSSProperties
          }
        />
      ))}

      <FeatherDefs />

      {FEATHERS.map((f) => (
        <Feather
          key={f.id}
          style={
            {
              "--x": f.x,
              "--y": f.y,
              "--w": f.w,
              "--tilt": f.tilt,
              "--dim": f.dim,
              "--dur": f.dur,
              "--delay": f.delay,
              "--small": f.small ? "block" : "none",
            } as React.CSSProperties
          }
        />
      ))}

      {/* A dither over the top. Six overlapping gradients this large band
          visibly on an 8-bit display, and a barely-visible noise is the
          cheapest fix there is. Same trick as the hero's second scrim. */}
      <div className="door__dither" />
    </div>
  );
}
