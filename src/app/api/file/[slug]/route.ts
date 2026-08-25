import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/config";
import { hasLibraryAccess, readSessionToken } from "@/lib/auth/session";
import { getBookFile } from "@/lib/data/books";
import { localePath } from "@/lib/i18n/config";
import { preferredLocale } from "@/lib/i18n/negotiate";

/**
 * The only way to a book file.
 *
 * The PDFs are **not** in `public/`. They were, once, and that made the gate on
 * the pages decoration: the proxy's matcher has to skip anything with a file
 * extension, so anyone with a URL could take a book without ever meeting the
 * password. They live in `private/books/` now, and this route is the only path
 * to them: it checks the same signed cookie the proxy would have, and it checks
 * it before a single byte is read.
 *
 * Two sources, one interface:
 *
 *   • **Locally**, the file is read off disk. `private/` is gitignored and
 *     absent from a deploy, so this path is for development and for a host with
 *     a real filesystem.
 *   • **In production**, `BOOKS_RELEASE_BASE` points at a GitHub Release (or an
 *     R2 bucket) holding the same slug-named files, and the bytes are proxied
 *     rather than redirected to. That is not a preference: GitHub redirects to
 *     `release-assets.githubusercontent.com`, which sends no CORS headers, and
 *     pdf.js reads through `fetch`, so a redirect is blocked by the browser
 *     while a proxy is not. The download button would survive a redirect
 *     (`<a download>` is a navigation and CORS does not apply) but the reader
 *     would not.
 *
 * **Range requests are the point of all this.** `pdf.js` asks for the bytes it
 * needs to draw page one and then fetches more as the reader scrolls. Without
 * `Accept-Ranges` and honest `Content-Range` handling, opening the 15 MB
 * handbook pulls the whole file before anything appears. Both paths below
 * implement it.
 */

export const runtime = "nodejs";

/** Set in production; empty locally, which selects the filesystem path. */
const RELEASE_BASE = process.env.BOOKS_RELEASE_BASE ?? "";

const BOOKS_DIR = join(process.cwd(), "private", "books");

/** `bytes=0-1023`, `bytes=1024-`, `bytes=-512`. Anything else is ignored. */
function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;

  if (rawStart === "" && rawEnd === "") return null;

  // A suffix range: the last N bytes. pdf.js uses this to read the xref table
  // at the end of the file, which is the very first thing it wants.
  if (rawStart === "") {
    const length = Number(rawEnd);
    if (!Number.isFinite(length) || length <= 0) return null;
    return { start: Math.max(0, size - length), end: size - 1 };
  }

  const start = Number(rawStart);
  if (!Number.isFinite(start) || start >= size) return null;
  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (end < start) return null;
  return { start, end };
}

function serveFromDisk(
  storageName: string,
  downloadName: string,
  rangeHeader: string | null,
  download: boolean,
) {
  const path = join(BOOKS_DIR, storageName);

  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${downloadName}"`,
    "Accept-Ranges": "bytes",
    // Behind a password, must never be held by a CDN or a shared cache.
    "Cache-Control": "private, no-store",
  });

  const range = parseRange(rangeHeader, size);
  if (range) {
    const length = range.end - range.start + 1;
    headers.set("Content-Length", String(length));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    const stream = createReadStream(path, { start: range.start, end: range.end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(size));
  return new NextResponse(
    Readable.toWeb(createReadStream(path)) as ReadableStream,
    { status: 200, headers },
  );
}

async function serveFromRelease(
  storageName: string,
  downloadName: string,
  rangeHeader: string | null,
  download: boolean,
) {
  const assetUrl = `${RELEASE_BASE}/${encodeURIComponent(storageName)}`;

  const upstream = await fetch(assetUrl, {
    headers: {
      ...(rangeHeader ? { Range: rangeHeader } : {}),
      // GitHub refuses release asset requests without one.
      "User-Agent": "maternity-book-bank/1.0",
    },
    redirect: "follow",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(null, { status: upstream.status });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${downloadName}"`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });

  // Forwarded so the reader knows the file size and can size its scrollbar.
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) headers.set("Content-Length", contentLength);
  if (contentRange) headers.set("Content-Range", contentRange);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/file/[slug]">,
) {
  // ── The gate ────────────────────────────────────────────────────────────
  // The proxy's matcher skips `/api`, so this route checks the cookie itself.
  // It is not a second line of defence; for this path it is the only one.
  const session = await readSessionToken(
    request.cookies.get(sessionCookieName)?.value,
  );

  if (!hasLibraryAccess(session)) {
    // A navigation gets sent to the door; a fetch gets a 401, because pdf.js
    // would otherwise try to parse the sign-in page as a PDF.
    if (request.headers.get("sec-fetch-mode") === "navigate") {
      const lang = preferredLocale(request.headers.get("accept-language"));
      return NextResponse.redirect(
        new URL(localePath(lang, "/signin"), request.url),
      );
    }
    return new NextResponse(null, { status: 401 });
  }

  // ── Resolve ─────────────────────────────────────────────────────────────
  const { slug } = await params;
  const file = await getBookFile(slug);
  if (!file) return new NextResponse(null, { status: 404 });

  // `storageName` comes from a server-side table keyed by slug, never from the
  // request, so there is no path to traverse. Belt and braces anyway: a name
  // with a separator in it is not a name.
  if (file.storageName.includes("/") || file.storageName.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }

  const rangeHeader = request.headers.get("range");
  const download = request.nextUrl.searchParams.get("download") === "1";

  return RELEASE_BASE
    ? serveFromRelease(file.storageName, file.downloadName, rangeHeader, download)
    : serveFromDisk(file.storageName, file.downloadName, rangeHeader, download);
}
