import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { hasLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * A proof sheet for the QR code printed in the sponsored copy.
 *
 * The register is the one page a reader can reach without a password, and the
 * only way anybody learns it exists is the code printed on the inside cover.
 * This page draws that code, on screen, at the address it will actually point
 * at, so it can be checked with a phone before it is checked by a print run.
 *
 * **Development only**, and enforced rather than merely documented: in a
 * production build the route answers 404. Two reasons. It would otherwise be a
 * page anyone could reach without a session (see `OPEN_ROUTES` in `proxy.ts`),
 * and a QR code is a picture of a URL — there is nothing here a visitor to the
 * live site should need and no reason to serve it to them.
 *
 * The code is drawn from the request's own origin, which in development is
 * localhost — useless for print. Pass `?base=https://…` to draw it for the
 * real domain instead: `/en/qr?base=https://maternitybookbank.org`.
 */

export const metadata: Metadata = {
  title: "QR proof sheet",
  robots: { index: false, follow: false },
};

/** The origin is a request header and the base a query string: never static. */
export const dynamic = "force-dynamic";

/**
 * `x-forwarded-*` first, because behind Cloudflare `host` is the proxy's idea
 * of the host and the scheme is always the one the tunnel terminated.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * The `?base=` override, or null if it is not a plausible origin. Anything
 * typed here ends up encoded in an image, so it is parsed rather than trusted:
 * a `javascript:` scheme in a QR code is exactly the thing not to print.
 */
function overrideBase(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Error correction level Q (25%) rather than the M this URL would otherwise
 * need. The extra redundancy costs a slightly denser grid and buys back a code
 * that still scans through a fold, a thumbprint and cheap paper — which is the
 * only environment this one will ever be read in.
 */
const options = { errorCorrectionLevel: "Q", margin: 2 } as const;

/** Pure black on pure white: the theme has no say in what a scanner reads. */
const color = { dark: "#000000", light: "#ffffff" } as const;

function svg(text: string): Promise<string> {
  return QRCode.toString(text, { ...options, color, type: "svg" });
}

/**
 * 1200px square, which is a 100mm code at 300dpi — larger than it will be
 * printed, so the printer scales down rather than up.
 */
function png(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    ...options,
    color,
    type: "image/png",
    width: 1200,
  });
}

/** For layout software that will not place a PNG. Same pixels, worse edges. */
function jpg(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    ...options,
    color,
    type: "image/jpeg",
    width: 1200,
  });
}

export default async function QrProofPage(props: PageProps<"/[lang]/qr">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const { base: raw } = await props.searchParams;
  const override = overrideBase(typeof raw === "string" ? raw : undefined);
  const base = override ?? (await requestOrigin());

  /**
   * One code, and it points at the bare `/signup` rather than at any of the
   * routes underneath it. `proxy.ts` takes it from there, so what is printed
   * stays the shortest address the register has and the redirect is the site's
   * problem rather than the printer's.
   */
  const url = `${base}/signup`;
  const [art, pngHref, jpgHref] = await Promise.all([
    svg(url),
    png(url),
    jpg(url),
  ]);

  return (
    <div className="paper-grain min-h-dvh px-5 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-danger">
          Development only · not in a production build
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
          QR proof sheet
        </h1>

        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-mute">
          The code printed in the {site.nameLead} copy. Scan it with a phone
          before the artwork goes anywhere near a printer.
        </p>

        <p className="mt-4 max-w-2xl text-[0.9rem] leading-relaxed text-ink-mute">
          {override ? (
            <>
              Drawn for <span className="font-mono text-ink">{base}</span>, from
              the <code className="font-mono">base</code> parameter.
            </>
          ) : (
            <>
              Drawn for <span className="font-mono text-ink">{base}</span>, this
              request&rsquo;s own origin — which is a development address. Add{" "}
              <code className="font-mono text-ink">
                ?base=https://your-domain
              </code>{" "}
              to draw the code for the live site.
            </>
          )}
        </p>

        <section className="mt-10 rounded-3xl border border-line bg-surface p-7 shadow-e2">
          <h2 className="text-xl font-bold tracking-tight text-ink">Sign up</h2>
          <p className="mt-2 text-sm text-ink-mute">
            Scanning opens the register.
          </p>

          {/* The SVG is generated here, from a URL this file built: the only
              thing `dangerouslySetInnerHTML` is being trusted with is the
              qrcode library's own output. */}
          <div
            className="mx-auto mt-6 w-full max-w-[15rem] overflow-hidden rounded-2xl border border-line bg-white [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: art }}
          />

          <p className="mt-4 break-all text-center font-mono text-[0.72rem] leading-relaxed text-ink-faint">
            {url}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={pngHref}
              download="qr-signup.png"
              className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-surface"
            >
              Download PNG
            </a>
            <a
              href={jpgHref}
              download="qr-signup.jpg"
              className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-surface"
            >
              Download JPG
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
