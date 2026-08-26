/**
 * Builds the book cover WebP images for the public catalogue.
 *
 *   node scripts/build-covers.mjs                    # every book
 *   node scripts/build-covers.mjs williams-obstetrics  # one, or a few
 *
 * Every cover is page 1 of the book itself, rendered with `pdftoppm` and
 * resized through `sharp`. Not a stock photo, not a scan of a different
 * edition: the cover a reader sees in the grid is the page they land on when
 * they open the file, which is the only way the two can never disagree.
 *
 * The exception is a book that arrived **with its jacket art**: drop it in
 * `private/covers/<slug>.<ext>` and that image is used instead of page 1. The
 * three obstetrics references are like this. Their files are scans that open
 * on a copyright notice, so rendering page 1 would put a wall of small print
 * where the cover should be, and the publisher's jacket is both the truer
 * picture of the book and the one a clinician recognises on a shelf.
 *
 * Naming the source file after the slug is what keeps this honest: there is no
 * mapping table to drift, and a supplied cover for a book that does not exist
 * is a filename nobody will ever read.
 *
 * Passing slugs builds only those, which is how a new book is added without
 * rewriting the sixteen WebPs that were already correct.
 *
 * Output: public/covers/<slug>.webp, 640×900, white ground, q82. Committed to
 * the repo so the build never depends on `private/`, which is gitignored and
 * absent from a deploy.
 *
 * Requires poppler-utils:  sudo apt install poppler-utils
 *
 * The slug is the join. `private/books/<slug>.pdf`, `public/covers/<slug>.webp`
 * and the `slug` in `lib/fixtures/catalogue.ts` are the same string, and
 * nothing maps between them, so a book with no cover is a typo you can see
 * rather than a lookup that silently returns undefined.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdfDir = join(root, "private", "books");
const artDir = join(root, "private", "covers");
const outDir = join(root, "public", "covers");

mkdirSync(outDir, { recursive: true });

/** Slugs named on the command line; empty means every book. */
const only = new Set(process.argv.slice(2));

/**
 * Supplied jacket art for a slug, or null to render page 1 instead.
 *
 * Extensions are tried rather than globbed so the answer is deterministic when
 * someone leaves both a JPEG and a PNG behind.
 */
function suppliedArt(slug) {
  for (const ext of ["jpeg", "jpg", "png", "webp", "tif", "tiff"]) {
    const path = join(artDir, `${slug}.${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
}

/**
 * Which page is the cover, where it is not page 1.
 *
 * Most of these lead with their title page, which is what makes rendering page
 * 1 the right default. The exception in this collection is the preterm birth
 * guideline, whose first page is a landscape spread of the front and back
 * covers together: rendered into a portrait frame it becomes a thin strip of
 * nothing. Page 3 is its title page.
 */
const FIRST_PAGE = {
  "who-recommendations-preterm-birth": 3,
};

/**
 * Books whose cover page is a **spread** (back cover on the left, front on the
 * right, printed as one sheet) where only the right half should be used.
 *
 * This was a detection rule first: "if page 1 renders landscape, take the right
 * half." It is wrong, and wrong on more books than it is right on. Three titles
 * here have a landscape page 1, and only one of them is a spread; the other two
 * are simply front covers laid out landscape, and cropping them cut the title
 * in half. There is no signal in the file that separates the two cases (the
 * page is the same shape either way), so this is a list of names, checked by
 * looking at the output, which is the only thing that can tell them apart.
 */
const COVER_SPREAD = new Set(["who-antenatal-care-recommendations"]);

/** Render one page of a PDF to a JPEG via pdftoppm; returns the path. */
function renderPage(pdfPath, page) {
  const stem = join(tmpdir(), `cover-${process.pid}-${page}`);
  execFileSync(
    "pdftoppm",
    ["-f", String(page), "-l", String(page), "-r", "150", "-jpeg", "-singlefile", pdfPath, stem],
    { stdio: "pipe" },
  );
  const out = `${stem}.jpg`;
  return existsSync(out) ? out : null;
}

const slugs = readdirSync(pdfDir)
  .filter((name) => name.endsWith(".pdf"))
  .map((name) => name.replace(/\.pdf$/, ""))
  .filter((slug) => only.size === 0 || only.has(slug))
  .sort();

for (const slug of only) {
  if (!slugs.includes(slug)) console.error(`  ✗ ${slug}: no such book`);
}

let ok = 0;
let failed = 0;

for (const slug of slugs) {
  const pdfPath = join(pdfDir, `${slug}.pdf`);
  const page = FIRST_PAGE[slug] ?? 1;
  const art = suppliedArt(slug);
  let source = art;

  if (!art) {
    try {
      source = renderPage(pdfPath, page);
    } catch (error) {
      console.error(`  ✗ ${slug}: pdftoppm failed (${error.message})`);
      failed++;
      continue;
    }
    if (!source) {
      console.error(`  ✗ ${slug}: pdftoppm produced nothing`);
      failed++;
      continue;
    }
  }

  try {
    let image = sharp(source);
    const { width, height } = await image.metadata();

    if (COVER_SPREAD.has(slug)) {
      const left = Math.round(width / 2);
      image = sharp(
        await image
          .extract({ left, top: 0, width: width - left, height })
          .toBuffer(),
      );
    }

    const info = await image
      // `contain` rather than `cover`: a title page cropped to fill a 2:2.8
      // frame loses the title, which is the one thing a cover has to carry.
      .resize(640, 900, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 82 })
      .toFile(join(outDir, `${slug}.webp`));
    console.log(
      `  ✓ ${slug}.webp  ${(info.size / 1024).toFixed(0)} KB${art ? "  (supplied art)" : ""}`,
    );
    ok++;
  } catch (error) {
    console.error(`  ✗ ${slug}: sharp failed (${error.message})`);
    failed++;
  } finally {
    // Only the temp render is ours to delete; supplied art is the source.
    if (!art) {
      try {
        unlinkSync(source);
      } catch {
        // A leftover temp file is not worth failing the build over.
      }
    }
  }
}

console.log(`\n${ok} covers written to public/covers/${failed ? `, ${failed} failed` : ""}.`);
