/**
 * The Exium MUPS 20 advertisement, in WebGL.
 *
 * A carton and a blister strip, lit like a product shot, that tumbles in once
 * and then idles, and that the reader can take hold of and spin. It is an
 * advert, so it has to look expensive; it is an advert on a library for mothers
 * and health workers, so it must not shout. The whole of that tension is in the
 * motion: one entrance, then a rotation slow enough that you notice it only if
 * you look, and no loop point you can catch.
 *
 * Built to the rules this project applies to every WebGL module:
 *
 *   • No downloaded model and no image texture. The carton is a `BoxGeometry`
 *     with six materials, and every face is `lib/exium-canvas` drawing the
 *     pack's own artwork. See the note at the top of that file for why the
 *     supplied photograph is not the texture.
 *   • three.js is imported by the component that loads *this* module, inside an
 *     effect, so none of it is in the initial bundle and none of it can run on
 *     the server.
 *   • Everything created is tracked and disposed. A component that mounts an
 *     advert in four places on one page and leaks a renderer each time is a
 *     component that ends the session.
 */

import * as THREE from "three";
import {
  drawBlister,
  drawPackEnd,
  drawPackFlap,
  drawPackFront,
  PACK_SIZE,
} from "@/lib/exium-canvas";

export interface ExiumSceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  /** Fired once the first frame is on screen, so the fallback can fade out. */
  onReady?: () => void;
}

export interface ExiumScene {
  /** Re-read the design tokens after a light/dark switch. */
  refreshTheme(): void;
  dispose(): void;
}

/** Pack units → scene units. The carton is ~10cm across and sits at ~2.4. */
const SCALE = 0.024;

const W = PACK_SIZE.width * SCALE;
const H = PACK_SIZE.height * SCALE;
const D = PACK_SIZE.depth * SCALE;

/** How long the entrance takes, in seconds. */
const ENTRANCE = 1.6;

/** Radians per second while idling. One turn in ~53 seconds. */
const IDLE_SPIN = 0.118;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function textureFrom(canvas: HTMLCanvasElement, anisotropy: number) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function readAccent(): THREE.Color {
  const root = getComputedStyle(document.documentElement);
  const value = root.getPropertyValue("--accent-lit").trim();
  return new THREE.Color(value || "#f9a8d4");
}

export function createExiumScene(options: ExiumSceneOptions): ExiumScene {
  const { canvas, container, onReady } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    // The card's own surface shows through, so the scene never paints a
    // background and light and dark cost nothing to support.
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  // VSM, for the same reason as the hero: `shadow.radius` is a no-op under
  // PCFSoftShadowMap, so that type cannot throw a soft contact shadow off a
  // hard-edged box, which is the only shadow in this scene.
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0.55, 4.6);
  camera.lookAt(0, -0.05, 0);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  /* --- Light ------------------------------------------------------- *
   * A softbox above and slightly front, one hard key from the upper
   * right to throw the shadow and rake the swash, and a rim in the
   * brand's light-emitting pink from behind left. The rim is the only
   * place the site's own colour touches the product: enough to seat it
   * on the page, not enough to recolour someone's packaging.
   * ---------------------------------------------------------------- */
  const ambient = new THREE.HemisphereLight(0xffffff, 0xb9a3ad, 1.35);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff6ee, 2.1);
  key.position.set(2.4, 3.4, 2.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0009;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -2.5;
  key.shadow.camera.right = 2.5;
  key.shadow.camera.top = 2.5;
  key.shadow.camera.bottom = -2.5;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-2.6, 1.1, 2.2);
  scene.add(fill);

  const rim = new THREE.PointLight(readAccent(), 9, 8, 2);
  rim.position.set(-2.1, 0.7, -1.9);
  scene.add(rim);

  /* --- The carton -------------------------------------------------- *
   * `BoxGeometry`'s material array is ordered +X, −X, +Y, −Y, +Z, −Z.
   * Getting that order wrong puts the wordmark on the bottom flap,
   * which is the kind of bug that survives review because every face
   * is cream and nobody turns the box over.
   * ---------------------------------------------------------------- */
  const frontTexture = track(textureFrom(drawPackFront(1024), anisotropy));
  const endTexture = track(textureFrom(drawPackEnd(512), anisotropy));
  const flapTexture = track(textureFrom(drawPackFlap(512), anisotropy));

  const board = (map: THREE.Texture) =>
    track(
      new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.42,
        metalness: 0,
        // Cartons are printed and then laminated, and clearcoat is what a
        // lamination is: a thin gloss layer with its own highlight over a matt
        // substrate. Without it the box reads as unfinished card.
        clearcoat: 0.55,
        clearcoatRoughness: 0.28,
      }),
    );

  const carton = new THREE.Mesh(
    track(new THREE.BoxGeometry(W, H, D, 1, 1, 1)),
    [
      board(endTexture), // +X, right end panel
      board(endTexture), // −X, left end panel
      board(flapTexture), // +Y, top flap
      board(flapTexture), // −Y, bottom flap
      board(frontTexture), // +Z, the face
      board(frontTexture), // −Z, the back
    ],
  );
  carton.castShadow = true;
  carton.receiveShadow = true;

  /* --- The blister ------------------------------------------------- *
   * A thin slab leaning against the carton, foil side to camera. Its
   * own material is the metallic one in the scene, and a metal with no
   * environment to reflect renders black, so it gets a small
   * procedural environment rather than `metalness: 1` and a surprise.
   * ---------------------------------------------------------------- */
  const blisterTexture = track(textureFrom(drawBlister(1024), anisotropy));
  const blister = new THREE.Mesh(
    track(new THREE.BoxGeometry(W * 0.82, H * 0.62, D * 0.1)),
    track(
      new THREE.MeshPhysicalMaterial({
        map: blisterTexture,
        roughness: 0.3,
        metalness: 0.62,
        clearcoat: 0.2,
      }),
    ),
  );
  blister.castShadow = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(
    new THREE.Scene().add(
      new THREE.Mesh(
        new THREE.SphereGeometry(8, 12, 8),
        new THREE.MeshBasicMaterial({
          color: 0xf3e7ec,
          side: THREE.BackSide,
        }),
      ),
    ),
    0.04,
  );
  scene.environment = environment.texture;
  pmrem.dispose();
  disposables.push(environment.texture);

  /* --- The ground -------------------------------------------------- *
   * A shadow-only plane. `ShadowMaterial` writes nothing but the
   * shadow, so the card's own surface shows through and the pack looks
   * placed on the page rather than floating above a grey disc.
   * ---------------------------------------------------------------- */
  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(9, 9)),
    track(new THREE.ShadowMaterial({ opacity: 0.24 })),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -H * 0.72;
  ground.receiveShadow = true;
  scene.add(ground);

  /** Everything that turns together. */
  const rig = new THREE.Group();
  carton.position.set(0, H * 0.06, 0);
  blister.position.set(W * 0.06, -H * 0.24, D * 0.62);
  blister.rotation.set(-0.36, 0.02, 0.015);
  rig.add(carton, blister);
  scene.add(rig);

  /* --- Interaction ------------------------------------------------- *
   * Drag to spin, with inertia, and the idle rotation resumes from
   * wherever it was let go rather than snapping back. Written by hand
   * rather than with OrbitControls: this needs one axis, no zoom, no
   * pan, and no wheel handler; a control that swallowed the page's
   * scroll inside a sticky section would be a bug, not a feature.
   * ---------------------------------------------------------------- */
  let spin = -0.55;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  /** Set while a drag is in progress, so the idle spin does not fight it. */
  let held = false;

  function onPointerDown(event: PointerEvent) {
    dragging = true;
    held = true;
    lastX = event.clientX;
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    // Scaled by width, so the same swipe turns the pack the same amount on a
    // phone as in a 24rem sidebar.
    const delta = (dx / Math.max(1, container.clientWidth)) * Math.PI * 2.2;
    spin += delta;
    velocity = delta;
  }

  function onPointerUp(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    held = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    canvas.style.cursor = "grab";
  }

  canvas.style.cursor = "grab";
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  /* --- Frame loop -------------------------------------------------- */
  let raf = 0;
  let started = 0;
  let announced = false;
  /** Paused while off screen. Four adverts on one page is four render loops. */
  let visible = true;

  function layout() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull back on narrow cards so the pack never touches the edges: at a
    // fixed distance a 320px card crops the carton, and an advert with the
    // product's name cut off is worse than no advert.
    camera.position.z = 4.6 + Math.max(0, (1.6 - width / height) * 1.15);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(container);
  layout();

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    },
    { rootMargin: "120px" },
  );
  intersectionObserver.observe(container);

  let previous = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!started) started = now;
    const elapsed = (now - started) / 1000;
    const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
    previous = now;

    if (!visible) return;

    // The entrance: the pack falls the last few centimetres onto the page and
    // settles, turning as it goes. `easeOutCubic` on all three at once, so
    // there is one arrival rather than three overlapping ones.
    const t = Math.min(1, elapsed / ENTRANCE);
    const e = easeOutCubic(t);
    rig.position.y = (1 - e) * 0.9;
    rig.rotation.z = (1 - e) * -0.22;
    const entranceSpin = (1 - e) * -1.15;

    if (!held) {
      spin += IDLE_SPIN * dt;
      // Friction on the throw. 0.94 per frame at 60fps decays a flick over
      // about a second, which is long enough to feel like mass.
      spin += velocity;
      velocity *= 0.94;
      if (Math.abs(velocity) < 1e-4) velocity = 0;
    }

    rig.rotation.y = spin + entranceSpin;
    // A slow, unsynchronised bob. The period is deliberately not a multiple of
    // the spin's, so there is no moment the whole thing visibly repeats.
    rig.position.y += Math.sin(elapsed * 0.62) * 0.022;
    rig.rotation.x = Math.sin(elapsed * 0.44) * 0.028;

    renderer.render(scene, camera);

    if (!announced && t > 0.02) {
      announced = true;
      onReady?.();
    }
  }
  raf = requestAnimationFrame(frame);

  return {
    refreshTheme() {
      rim.color = readAccent();
    },
    dispose() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      scene.clear();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
    },
  };
}
