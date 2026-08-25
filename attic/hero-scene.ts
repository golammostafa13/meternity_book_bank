/**
 * The hero's WebGL scene.
 *
 * Four beats, scrubbed by scroll rather than played on a clock, so scrolling
 * back up runs the whole thing backwards, and the reader is never waiting on an
 * animation to finish:
 *
 *   0.00-0.22  a bound volume, closed, turning slowly on its own
 *   0.22-0.50  it opens: the board swings off the spine and the pages fan
 *   0.50-0.78  the pages let go and become the collection, drawn in from the
 *              dark as a slow helix of covers
 *   0.78-1.00  the helix settles into a shelf, square to the reader
 *
 * There is no downloaded model. Every volume is built here out of boxes and
 * planes, and every board is `lib/cover-canvas` drawing the same five layouts
 * the catalogue uses, which is the whole point: the object in the hero is a
 * book from *this* library, not a stock asset with a library's colours on it.
 *
 * three.js is imported by the module that loads this one, inside an effect, so
 * none of it is in the initial bundle and none of it can run on the server.
 */

import * as THREE from "three";
import {
  COVER_RATIO,
  drawCoverBack,
  drawCoverFace,
  drawPageEdge,
  drawSpine,
  bookColours,
  type CoverBook,
} from "@/lib/cover-canvas";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export type SceneBook = CoverBook & { pages: number };

export interface HeroSceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  hero: SceneBook;
  field: SceneBook[];
  lang?: Locale;

  /** Fired when a settled field book is clicked. */
  onBookClick?: (book: SceneBook) => void;

  /** Fired after textures are drawn and the first frame is on screen. */
  onReady?: () => void;
}

export interface HeroScene {
  setProgress(progress: number): void;
  /** Re-read the design tokens after a light/dark switch. */
  refreshTheme(): void;
  dispose(): void;
}

/* ------------------------------------------------------------------ *
 * Geometry constants, in scene units. One unit ≈ 4cm of book.
 * ------------------------------------------------------------------ */
const BOOK_W = 1.86;
/** The board has to be the cover art's own 2:2.7, or the texture stretches. */
const BOOK_H = BOOK_W / COVER_RATIO;
const BLOCK_T = 0.36;
const BOARD_T = 0.045;
const PAGE_COUNT = 11;

const COVER_W = 1.02;
const COVER_H = COVER_W / COVER_RATIO;
const COVER_T = 0.13;

/* ------------------------------------------------------------------ *
 * Scrub helpers.
 * ------------------------------------------------------------------ */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Progress through one beat of the timeline, eased at both ends. */
const beat = (p: number, from: number, to: number) =>
  smooth(clamp01((p - from) / (to - from)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic scatter. Nothing in the scene may differ between reloads. */
const noise = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface ThemeTokens {
  bg: THREE.Color;
  accent: THREE.Color;
  /** `--accent-lit`: the brand green lifted to something that can act as a
   *  light. `--accent` itself is dark enough to carry white button text, which
   *  makes it far too dark to emit. */
  accentLit: THREE.Color;
  dark: boolean;
}

function readTheme(): ThemeTokens {
  const root = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) =>
    new THREE.Color(root.getPropertyValue(name).trim() || fallback);
  return {
    bg: pick("--bg", "#fdf0f4"),
    accent: pick("--accent", "#be185d"),
    accentLit: pick("--accent-lit", "#f9a8d4"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

function textureFrom(canvas: HTMLCanvasElement, anisotropy: number) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** Where each cover sits once the helix has squared up into a shelf. */
function shelfLayout(count: number, aspect: number) {
  const columns = aspect < 1 ? 3 : aspect < 1.35 ? 4 : 5;
  const rows = Math.ceil(count / columns);
  const gapX = COVER_W * 1.22;
  const gapY = COVER_H * 1.14;
  return Array.from({ length: count }, (_, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    // Short final rows are centred rather than left-aligned, so the shelf
    // reads as a composition instead of a ragged grid.
    const inRow = Math.min(columns, count - row * columns);
    return new THREE.Vector3(
      (col - (inRow - 1) / 2) * gapX,
      ((rows - 1) / 2 - row) * gapY,
      0,
    );
  });
}

export function createHeroScene(options: HeroSceneOptions): HeroScene {
  const { canvas, container, hero, field, lang = defaultLocale } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    // The page's own paper ground shows through; the scene never paints a
    // background of its own, so light and dark cost nothing to support.
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  // VSM rather than PCFSoft, for one reason: `shadow.radius` below is a no-op
  // under PCFSoftShadowMap (its kernel is fixed in the shader), so the only
  // shadow that type can throw off a hard-edged box is a hard-edged slab.
  // VSM blurs the depth map itself, which is what makes the contact shadow
  // read as one.
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  let theme = readTheme();
  scene.fog = new THREE.Fog(theme.bg, 11, 27);

  /* --- Light ------------------------------------------------------- *
   * A window and a lamp: broad sky fill from above, one hard key that
   * throws the contact shadow, and an accent-coloured rim from the left
   * so the boards pick up the brand colour along their edges.
   * ---------------------------------------------------------------- */
  const ambient = new THREE.HemisphereLight(0xffffff, 0x8a7c6c, 1.6);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff4e8, 2.6);
  // Steep rather than raking. A low key throws the volume's shadow a long
  // way across the ground plane, and a long shadow off a hard-edged box is
  // a grey slab lying next to the book rather than a contact shadow under
  // it. Lifting the light shortens the throw to something the volume looks
  // like it is standing on.
  key.position.set(2.4, 11, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  // The frustum has to reach the volume in its new, further-right position.
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.bias = -0.0016;
  // The edge is meant to be a gradient, not a cut line.
  key.shadow.radius = 7;
  key.shadow.blurSamples = 16;
  scene.add(key);

  const rim = new THREE.PointLight(theme.accentLit, 26, 18, 2);
  rim.position.set(-4.4, 1.6, 3.2);
  scene.add(rim);

  const hoverLight = new THREE.PointLight(
    theme.accentLit,
    0,
    4,
    2,
  );

  hoverLight.position.set(0, 1.5, 2.5);
  scene.add(hoverLight);

  const fill = new THREE.DirectionalLight(0xdfe6ef, 0.7);
  fill.position.set(-3, -2, 4);
  scene.add(fill);

  /* --- Shared resources -------------------------------------------- */
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  /**
   * Loads a book's real cover scan as a texture, resolving null on failure so
   * the generated canvas texture can stay in place. The canvas art is drawn
   * first and synchronously, so the board is never blank while the image is in
   * flight: the photo only swaps in over the top when it arrives.
   */
  const imageLoader = new THREE.TextureLoader();
  const pendingCoverImages: Promise<unknown>[] = [];

  function applyCoverImage(
    material: THREE.MeshStandardMaterial,
    book: SceneBook,
  ): void {
    if (!book.coverImage) return;
    const fallback = material.map;
    pendingCoverImages.push(
      new Promise<void>((resolve) => {
        imageLoader.load(
          book.coverImage!,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = anisotropy;
            track(texture);
            // Replacing the map invalidates the material on the next frame; the
            // canvas keeps its generated art until the photo is actually live.
            material.map = texture;
            material.needsUpdate = true;
            fallback?.dispose();
            resolve();
          },
          undefined,
          () => resolve(),
        );
      }),
    );
  }

  const pageEdgeTexture = track(textureFrom(drawPageEdge(512), anisotropy));
  const creamMaterial = track(
    new THREE.MeshStandardMaterial({ color: 0xf3ecdd, roughness: 0.94 }),
  );
  const pageEdgeMaterial = track(
    new THREE.MeshStandardMaterial({ map: pageEdgeTexture, roughness: 0.9 }),
  );

  /** Every material that has to fade when the volume hands over to the field. */
  const bookMaterials: THREE.Material[] = [];

  /* --- The volume --------------------------------------------------- */
  const bookGroup = new THREE.Group();
  scene.add(bookGroup);

  const heroTheme = bookColours(hero);
  const boardMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(heroTheme.spine),
      roughness: 0.72,
    }),
  );
  const faceMaterial = track(
    new THREE.MeshStandardMaterial({
      map: track(textureFrom(drawCoverFace(hero, lang, 1024), anisotropy)),
      roughness: 0.66,
    }),
  );
  applyCoverImage(faceMaterial, hero);
  const backMaterial = track(
    new THREE.MeshStandardMaterial({
      map: track(textureFrom(drawCoverBack(hero, 512), anisotropy)),
      roughness: 0.7,
    }),
  );
  const spineMaterial = track(
    new THREE.MeshStandardMaterial({
      map: track(textureFrom(drawSpine(hero, lang, 768), anisotropy)),
      roughness: 0.68,
    }),
  );
  bookMaterials.push(
    boardMaterial,
    faceMaterial,
    backMaterial,
    spineMaterial,
    creamMaterial,
    pageEdgeMaterial,
  );

  // BoxGeometry material order is [+X, −X, +Y, −Y, +Z, −Z].
  const boardGeometry = track(new THREE.BoxGeometry(BOOK_W, BOOK_H, BOARD_T));

  /** The front board lives in a group hinged on the spine, so it swings. */
  const hinge = new THREE.Group();
  hinge.position.set(-BOOK_W / 2, 0, BLOCK_T / 2 + BOARD_T / 2);
  const frontBoard = new THREE.Mesh(boardGeometry, [
    boardMaterial,
    boardMaterial,
    boardMaterial,
    boardMaterial,
    faceMaterial,
    creamMaterial,
  ]);
  frontBoard.position.x = BOOK_W / 2;
  frontBoard.castShadow = true;
  hinge.add(frontBoard);
  bookGroup.add(hinge);

  const backBoard = new THREE.Mesh(boardGeometry, [
    boardMaterial,
    boardMaterial,
    boardMaterial,
    boardMaterial,
    creamMaterial,
    backMaterial,
  ]);
  backBoard.position.z = -BLOCK_T / 2 - BOARD_T / 2;
  backBoard.castShadow = true;
  bookGroup.add(backBoard);

  const spine = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.1, BOOK_H, BLOCK_T + BOARD_T * 2)),
    [
      boardMaterial,
      spineMaterial,
      boardMaterial,
      boardMaterial,
      boardMaterial,
      boardMaterial,
    ],
  );
  spine.position.x = -BOOK_W / 2 - 0.05;
  spine.castShadow = true;
  bookGroup.add(spine);

  /** The text block. It thins as pages leave it, so the fan has somewhere to
   *  have come from. */
  const block = new THREE.Mesh(
    track(new THREE.BoxGeometry(BOOK_W - 0.07, BOOK_H - 0.08, BLOCK_T)),
    [
      pageEdgeMaterial,
      creamMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      creamMaterial,
      creamMaterial,
    ],
  );
  block.castShadow = true;
  bookGroup.add(block);

  /** The fanning leaves, each hinged on the spine like the board. */
  const pageGeometry = track(
    new THREE.PlaneGeometry(BOOK_W - 0.1, BOOK_H - 0.11),
  );
  const pageMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xf6f0e3,
      roughness: 0.95,
      side: THREE.DoubleSide,
    }),
  );
  bookMaterials.push(pageMaterial);

  const pages: THREE.Group[] = [];
  for (let i = 0; i < PAGE_COUNT; i++) {
    const leaf = new THREE.Group();
    leaf.position.set(
      -BOOK_W / 2 + 0.03,
      0,
      BLOCK_T / 2 - (i / (PAGE_COUNT - 1)) * BLOCK_T * 0.82,
    );
    const mesh = new THREE.Mesh(pageGeometry, pageMaterial);
    mesh.position.x = (BOOK_W - 0.1) / 2;
    leaf.add(mesh);
    leaf.visible = false;
    bookGroup.add(leaf);
    pages.push(leaf);
  }

  const heroMeshes: THREE.Mesh[] = [];
  bookGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) heroMeshes.push(child);
  });

  /* --- Contact shadow ----------------------------------------------- *
   * A shadow-only plane. It catches the key light and nothing else, so
   * the volume sits on something without a floor ever being drawn.
   *
   * `depthWrite: false` is not an optimisation, it is the difference
   * between a shadow and an invisible wall. The plane is 30 units across
   * and sits just under the volume, so by the time the collection has
   * squared up into its shelf the bottom row is *behind* it. Writing
   * depth, it would quietly clip those covers off at the waterline while
   * drawing nothing itself: the shadow has already faded to nothing by
   * then, so there would be no shadow on screen to explain the missing
   * halves. A shadow catcher darkens what is in front of it and occludes
   * nothing.
   * ---------------------------------------------------------------- */
  const shadowMaterial = track(
    new THREE.ShadowMaterial({
      opacity: theme.dark ? 0.3 : 0.18,
      depthWrite: false,
    }),
  );
  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(30, 30)),
    shadowMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  // Tucked close under the volume. Dropped further away the shadow detaches
  // and reads as a separate object lying on a floor, which is the one thing
  // a contact shadow must not do.
  ground.position.y = -BOOK_H / 2 - 0.22;
  ground.receiveShadow = true;
  scene.add(ground);

  /* --- The collection ------------------------------------------------ */
  const fieldGroup = new THREE.Group();
  scene.add(fieldGroup);

  const coverGeometry = track(
    new THREE.BoxGeometry(COVER_W, COVER_H, COVER_T),
  );

 interface FieldItem {
  book: SceneBook;
  object: THREE.Object3D;

  scatter: THREE.Vector3;
  helix: THREE.Vector3;
  shelf: THREE.Vector3;

  scatterSpin: THREE.Euler;
  helixSpin: THREE.Euler;

  materials: THREE.Material[];

  // Smooth hover animation state.
  hover: number;
  hoverTarget: number;

  // Mouse position relative to the book.
  pointerX: number;
  pointerY: number;
}

  const items: FieldItem[] = field.map((book, i) => {
    const colours = bookColours(book);
    const edge = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colours.spine),
      roughness: 0.74,
    });
    const paper = new THREE.MeshStandardMaterial({
      color: 0xf0e9da,
      roughness: 0.93,
    });
    const face = new THREE.MeshStandardMaterial({
      map: track(textureFrom(drawCoverFace(book, lang, 384), anisotropy)),
      roughness: 0.66,
    });
    applyCoverImage(face, book);
    const back = new THREE.MeshStandardMaterial({
      map: track(textureFrom(drawCoverBack(book, 192), anisotropy)),
      roughness: 0.7,
    });
    const materials = [edge, edge, paper, paper, face, back];
    materials.forEach((m) => track(m));

    const mesh = new THREE.Mesh(coverGeometry, materials);
    // Transparency is on from the start: turning it on mid-scroll would
    // recompile every one of these shaders in a single frame.
    materials.forEach((m) => {
      m.transparent = true;
      m.opacity = 0;
    });
    fieldGroup.add(mesh);

    const angle = (i / field.length) * Math.PI * 2 * 1.35;
    const spread = field.length > 1 ? i / (field.length - 1) : 0.5;

    return {
      book,
      object: mesh,
      // Far out in the fog, tumbled, at the edge of the far plane.
      scatter: new THREE.Vector3(
        Math.cos(angle) * 13 + (noise(i, 1) - 0.5) * 5,
        (noise(i, 2) - 0.5) * 13,
        Math.sin(angle) * 13 - 9,
      ),
      helix: new THREE.Vector3(
        Math.cos(angle) * 4.5,
        mix(-2.7, 2.7, spread),
        Math.sin(angle) * 4.5,
      ),
      shelf: new THREE.Vector3(),
      scatterSpin: new THREE.Euler(
        (noise(i, 3) - 0.5) * 3,
        (noise(i, 4) - 0.5) * 6,
        (noise(i, 5) - 0.5) * 2,
      ),
      // Facing outward off the helix, tipped back a little so the boards
      // catch the key light rather than presenting an edge to it.
      helixSpin: new THREE.Euler(-0.12, -angle + Math.PI / 2, 0.05),
      materials,
      hover: 0,
      hoverTarget: 0,
      pointerX: 0,
      pointerY: 0,
    };
  });
/* --- Interactive settled books ------------------------------------ */

  /**
   * The real cover scans are fetched from /covers with a TextureLoader: that
   * is async, so the first painted frame still carries the generated canvas art.
   * `onReady` is held until every photo has loaded (or failed and kept its
   * canvas fallback), which is what keeps the canvas from fading in on
   * generated art and then snapping to the scan a frame later.
   */
  const imagesReady = Promise.allSettled(pendingCoverImages).then(
    () => undefined,
  );

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hoveredItem: FieldItem | null = null;
  let hoveredHero = false;
  let heroHover = 0;

  function updatePointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();

    pointer.x =
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function clearHover() {
    if (hoveredItem) {
      hoveredItem.hoverTarget = 0;
      hoveredItem = null;
    }

    hoveredHero = false;

    items.forEach((item) => {
      item.hoverTarget = 0;
    });

    canvas.style.cursor = "default";
  }

  function findHoveredBook() {
    const heroAvailable = progress >= 0 && progress <= 1.001 && bookGroup.visible;

    raycaster.setFromCamera(pointer, camera);

    let hit: THREE.Intersection | undefined;

    if (heroAvailable) {
      const heroIntersections = raycaster.intersectObjects(heroMeshes, false);
      hit = heroIntersections[0];
    }

    if (!hit) {
      if (progress < 0.86 || progress > 1.001 || !fieldGroup.visible) {
        clearHover();
        return;
      }

      const fieldIntersections = raycaster.intersectObjects(
        items.map((item) => item.object),
        false,
      );
      hit = fieldIntersections[0];
    }

    if (!hit) {
      clearHover();
      return;
    }

    const isHeroHit = heroMeshes.includes(hit.object as THREE.Mesh);

    if (isHeroHit) {
      hoveredHero = true;
      hoveredItem = null;
      items.forEach((item) => {
        item.hoverTarget = 0;
      });
      canvas.style.cursor = "pointer";
      return;
    }

    const item = items.find((entry) => entry.object === hit.object);

    if (!item) {
      clearHover();
      return;
    }

    if (hoveredItem !== item) {
      if (hoveredItem) {
        hoveredItem.hoverTarget = 0;
      }

      hoveredItem = item;
    }

    hoveredHero = false;
    item.hoverTarget = 1;

    // Store where the pointer is relative to the viewport.
    // This is later used to tilt the book toward the cursor.
    item.pointerX = pointer.x;
    item.pointerY = pointer.y;

    canvas.style.cursor = "pointer";
  }

  function onPointerMove(event: PointerEvent) {
    updatePointer(event);
    findHoveredBook();
  }

  function onPointerLeave() {
    clearHover();
  }

  function onPointerDown(event: PointerEvent) {
    updatePointer(event);

    if (progress < 0 || progress > 1.001) {
      return;
    }

    raycaster.setFromCamera(pointer, camera);

    const heroIntersections = raycaster.intersectObjects(heroMeshes, false);
    const heroHit = heroIntersections[0];

    if (heroHit) {
      options.onBookClick?.(hero);
      return;
    }

    const fieldIntersections = raycaster.intersectObjects(
      items.map((item) => item.object),
      false,
    );

    const hit = fieldIntersections[0];

    if (!hit) return;

    const item = items.find((entry) => entry.object === hit.object);

    if (!item) return;

    options.onBookClick?.(item.book);
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);

  /* --- Motes --------------------------------------------------------- *
   * Dust in the light. Three hundred points cost nothing and are the
   * difference between "objects in a void" and "a room".
   * ---------------------------------------------------------------- */
  const moteCount = 280;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (noise(i, 7) - 0.5) * 22;
    motePositions[i * 3 + 1] = (noise(i, 8) - 0.5) * 14;
    motePositions[i * 3 + 2] = (noise(i, 9) - 0.5) * 16 - 2;
  }
  const moteGeometry = track(new THREE.BufferGeometry());
  moteGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(motePositions, 3),
  );
  const moteMaterial = track(
    new THREE.PointsMaterial({
      color: theme.accentLit,
      size: 0.045,
      transparent: true,
      opacity: theme.dark ? 0.5 : 0.32,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  scene.add(motes);

  /* ------------------------------------------------------------------ *
   * Layout. Recomputed on resize, because both the shelf's column count
   * and how far the volume sits off-centre depend on the shape of the
   * viewport, not just its size.
   * ------------------------------------------------------------------ */
  let aspect = 1;
  /** How far right the closed volume sits, leaving the headline its column. */
  let heroOffsetX = 0;
  let heroOffsetY = 0;
  /** Pull the camera back on narrow viewports so nothing leaves the frame. */
  let fitDistance = 1;

  function layout() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    aspect = width / height;

    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Wide: copy left, volume right. Narrow: copy on top, volume below it.
    //
    // Far enough right to sit in the middle of the column the headline
    // leaves it, rather than just clear of the last line of type. At 1.3
    // the volume landed barely right of centre and the outer third of a
    // wide viewport was empty, which read as the whole hero having drifted
    // left rather than as a composition.
    heroOffsetX = aspect >= 1.15 ? 2.6 : 0;
    // Down, not up. A portrait hero stacks (the headline takes the top of the
    // panel and the volume takes what is under it), so the volume has to clear
    // the type rather than sit in it, which is what a positive offset did: on a
    // phone the cover landed dead in the middle of a four-line headline and
    // three lines of lead. The camera takes half of this back (see
    // `cameraTarget` below), so the number is roughly twice the shift wanted,
    // and it grows with how tall the viewport is because a taller panel gives
    // the copy more of the frame to occupy.
    heroOffsetY =
      aspect >= 1.15 ? 0 : -Math.min(6.8, Math.max(2.2, 3.1 / aspect));
    fitDistance = Math.min(1.75, Math.max(1, 1.5 / aspect));

    const shelf = shelfLayout(items.length, aspect);
    items.forEach((item, i) => item.shelf.copy(shelf[i]));

    render();
  }

  /* ------------------------------------------------------------------ *
   * The timeline.
   * ------------------------------------------------------------------ */
  let progress = 0;
  let elapsed = 0;
  const clock = new THREE.Clock();

  const cameraTarget = new THREE.Vector3();
  const scratch = new THREE.Vector3();

  function frame() {
    const p = progress;

    const opening = beat(p, 0.22, 0.5);
    const leaving = beat(p, 0.5, 0.74);
    const arriving = beat(p, 0.46, 0.8);
    const settling = beat(p, 0.78, 1);

    /* --- Camera --------------------------------------------------- */
    // Pushes in for the opening, then pulls back out to take in the shelf.
    const distance =
      mix(9.3, 6.7, opening) + mix(0, 2.5, leaving) + mix(0, 0.5, settling);
    camera.position.set(
      mix(0, 0.5, opening) * (aspect >= 1.15 ? 1 : 0),
      mix(0.35, 0.1, opening) + mix(0, -0.1, settling),
      distance * fitDistance,
    );
    // The camera follows the volume only part of the way: were it to look
    // straight at it, the volume would sit dead centre and the offset above
    // would buy nothing. This fraction is what actually decides how far
    // right it lands on screen (`heroOffsetX` minus what the camera takes
    // back), so the two are tuned together.
    cameraTarget.set(
      mix(heroOffsetX * 0.28, 0, Math.max(leaving, arriving)),
      mix(heroOffsetY * 0.5, 0, Math.max(leaving, arriving)),
      0,
    );
    camera.lookAt(cameraTarget);

    /* --- The volume ----------------------------------------------- */
    const gone = leaving > 0.995;
    bookGroup.visible = !gone;
    if (!gone) {
      const idle = 1 - opening;
      const heroTarget = hoveredHero ? 1 : 0;
      heroHover = mix(heroHover, heroTarget, 0.14);

      const baseY = heroOffsetY * (1 - Math.max(opening * 0.6, leaving));
      const hoverLift = heroHover * 0.12;

      bookGroup.position.set(
        heroOffsetX * (1 - Math.max(opening * 0.55, leaving)),
        baseY + hoverLift,
        mix(0, -7, leaving) + heroHover * 0.15,
      );

      const baseRotY =
        mix(-0.62, -0.16, opening) + Math.sin(elapsed * 0.42) * 0.09 * idle;
      const hoveredRotY = mix(baseRotY, -0.08, heroHover);

      bookGroup.rotation.set(
        mix(-0.14, -0.04, opening) + Math.sin(elapsed * 0.31) * 0.045 * idle,
        hoveredRotY,
        mix(0.04, 0.01, opening),
      );
      bookGroup.scale.setScalar(mix(1, 0.3, leaving) + heroHover * 0.04);

      // The board swings a little past flat, the way a hardback does when it
      // has been opened right back on itself.
      hinge.rotation.y = -opening * Math.PI * 0.97;
      block.scale.z = mix(1, 0.46, opening);

      pages.forEach((leaf, i) => {
        const stagger = (i / PAGE_COUNT) * 0.55;
        const t = smooth(clamp01((opening - stagger) / (1 - stagger)));
        leaf.visible = t > 0.001;
        leaf.rotation.y = -t * (0.62 + (i / (PAGE_COUNT - 1)) * 0.3) * Math.PI;
        // Leaves bow as they turn; a flat plane sweeping through 120° reads
        // as card, not paper.
        leaf.rotation.z = Math.sin(t * Math.PI) * 0.06 * (i % 2 ? 1 : -1);
      });

      const fade = 1 - leaving;
      if (fade < 1) {
        bookMaterials.forEach((m) => {
          m.transparent = true;
          m.opacity = fade;
        });
      } else if (bookMaterials[0].opacity !== 1) {
        bookMaterials.forEach((m) => {
          m.opacity = 1;
          m.transparent = false;
        });
      }
    }

    if (hoveredHero || hoveredItem) {
      const targetIntensity = hoveredHero
        ? mix(0, 2.2, heroHover)
        : hoveredItem!.hover * 2.2;
      hoverLight.intensity = mix(hoverLight.intensity, targetIntensity, 0.12);

      const targetPos = hoveredHero ? bookGroup.position : hoveredItem!.object.position;
      hoverLight.position.lerp(targetPos, 0.12);
      hoverLight.position.z += 1.4;
    } else {
      hoverLight.intensity = mix(
        hoverLight.intensity,
        0,
        0.12,
      );
    }

    shadowMaterial.opacity = (theme.dark ? 0.3 : 0.18) * (1 - leaving);

    /* --- The collection -------------------------------------------- */
    fieldGroup.visible = arriving > 0.001;
    if (fieldGroup.visible) {
      // Spins in on the helix, then squares up to the reader for the shelf.
      fieldGroup.rotation.y =
        mix(0.85, 0, arriving) * (1 - settling) +
        Math.sin(elapsed * 0.12) * 0.05 * (1 - settling);

      const opacity = clamp01(arriving * 1.6) * mix(1, 1, settling);

      items.forEach((item, i) => {
        scratch.copy(item.scatter).lerp(item.helix, arriving);
        scratch.lerp(item.shelf, settling);

        /* ---------------------------------------------------------------
        * Smooth hover
        * --------------------------------------------------------------- */

        const isSettled = settling > 0.88;

        item.hoverTarget =
          isSettled && hoveredItem === item ? 1 : 0;

        // Smooth interpolation: no clock.getDelta() here.
        item.hover = mix(
          item.hover,
          item.hoverTarget,
          0.14,
        );

        /* ---------------------------------------------------------------
        * Very subtle continuous floating
        * --------------------------------------------------------------- */

        const phase = i * 1.73;

        const wave =
          Math.sin(elapsed * 0.9 + phase) *
          0.018 *
          (settling * settling);

        const bob =
          Math.sin(elapsed * 0.65 + phase * 1.7) *
          0.012 *
          settling;

        /* ---------------------------------------------------------------
        * Hover lift
        * --------------------------------------------------------------- */

        scratch.y += bob + item.hover * 0.16;
        scratch.z += item.hover * 0.32;

        item.object.position.copy(scratch);

        /* ---------------------------------------------------------------
        * Base shelf rotation
        * --------------------------------------------------------------- */

        const baseX =
          mix(item.scatterSpin.x, item.helixSpin.x, arriving) *
          (1 - settling);

        const baseY =
          mix(item.scatterSpin.y, item.helixSpin.y, arriving) *
          (1 - settling);

        const baseZ =
          mix(item.scatterSpin.z, item.helixSpin.z, arriving) *
          (1 - settling);

        /* ---------------------------------------------------------------
        * Subtle idle wave
        * --------------------------------------------------------------- */

        const idleX = wave;

        const idleZ =
          Math.cos(elapsed * 0.75 + phase) *
          0.014 *
          settling;

        /* ---------------------------------------------------------------
        * Hover tilt toward cursor
        * --------------------------------------------------------------- */

        const hoverTiltX =
          -item.pointerY * 0.12 * item.hover;

        const hoverTiltY =
          item.pointerX * 0.16 * item.hover;

        item.object.rotation.set(
          baseX + idleX + hoverTiltX,
          baseY + hoverTiltY,
          baseZ + idleZ,
        );

        /* ---------------------------------------------------------------
        * Hover scale
        * --------------------------------------------------------------- */

        item.object.scale.setScalar(
          mix(0.85, 1, settling) *
            (1 + item.hover * 0.045),
        );

        /* ---------------------------------------------------------------
        * Opacity
        * --------------------------------------------------------------- */

        item.materials.forEach((m) => {
          m.opacity = opacity;
        });
      });
    }

    moteMaterial.opacity = (theme.dark ? 0.5 : 0.32) * (0.35 + arriving * 0.65);
    motes.rotation.y = elapsed * 0.012;
    motes.position.y = Math.sin(elapsed * 0.09) * 0.5;
  }

  function render() {
    frame();
    renderer.render(scene, camera);
  }

  /* ------------------------------------------------------------------ *
   * The loop. It reads scroll position itself rather than listening for
   * it, and stops dead the moment the hero leaves the viewport: an
   * idle WebGL context on a page the reader has scrolled past is the
   * fastest way to flatten a laptop battery.
   * ------------------------------------------------------------------ */
  let running = false;
  let handle = 0;
  let ready = false;

  function tick() {
    handle = requestAnimationFrame(tick);
    elapsed += Math.min(clock.getDelta(), 0.05);
    render();
    if (!ready) {
      ready = true;
      // Wait for the real cover scans to land (or fall back to canvas art)
      // before revealing the canvas, so the first frame the reader sees has
      // the right textures rather than a generated-art flash.
      void imagesReady.then(() => options.onReady?.());
    }
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    handle = requestAnimationFrame(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(handle);
  }

  const visibility = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { threshold: 0 },
  );
  visibility.observe(container);

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(container);

  // A backgrounded tab already throttles rAF, but a paused loop also stops
  // the clock advancing, so the scene does not jump on return.
  const onVisibilityChange = () => {
    if (document.hidden) stop();
    else if (container.getBoundingClientRect().bottom > 0) start();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  layout();

  return {
    setProgress(value: number) {
      progress = clamp01(value);
    },
    refreshTheme() {
      theme = readTheme();
      (scene.fog as THREE.Fog).color.copy(theme.bg);
      rim.color.copy(theme.accentLit);
      moteMaterial.color.copy(theme.accentLit);
      ambient.intensity = theme.dark ? 0.9 : 1.6;
      key.intensity = theme.dark ? 1.9 : 2.6;
      render();
    },
    dispose() {
      stop();

      visibility.disconnect();
      resizeObserver.disconnect();

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );

      canvas.removeEventListener(
        "pointermove",
        onPointerMove,
      );

      canvas.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );

      canvas.removeEventListener(
        "pointerdown",
        onPointerDown,
      );

      canvas.style.cursor = "default";

      disposables.forEach((d) => d.dispose());

      renderer.dispose();
    },
  };
}
