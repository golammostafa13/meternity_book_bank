# Pediatric Book Bank: a digital library for the Cef 3 collection

A bilingual (বাংলা / English) book catalogue, opened by the two codes printed
in a hard copy, plus a private admin for the one librarian who maintains it.

Built to the design in [`docs/choosen.webp`](docs/choosen.webp) and the
architecture in [`docs/Library_Platform_Brief.pdf`](docs/Library_Platform_Brief.pdf):
warm stone ground, near-black ink, a single hot orange, and books rendered as
physical objects rather than as cards with pictures on them.

```bash
npm install
cp .env.example .env.local   # then fill it in; see "Sign-in" below
npm run dev                  # http://localhost:3000 → /en/signin or /bn/signin
```

The bare domain opens the door rather than the library: `/` lands on sign-in,
and there is no way past it. Nothing on this site opens without an account,
not a book page, not the reader, not a file. See **Getting in** below for the
two ways to get one.

## Languages

Both languages are first-class, and the language is part of the URL:

| | |
|---|---|
| `/en/books` | English catalogue |
| `/bn/books` | the same catalogue in Bengali |
| `/` | redirects to whichever the browser asks for (`Accept-Language`) |

Everything switches: interface strings, book and author names, category
descriptions, dates, and numerals (`40 books` → `৪০টি বই`, `194k downloads` →
`১.৯ লাখ ডাউনলোড`). The switch in the header is a plain link to the same page in
the other language, so it works without JavaScript and can be shared.

- **Interface strings** live in [`src/lib/i18n/dictionaries/`](src/lib/i18n/dictionaries/).
  English is the source of truth; `Dictionary` is derived from it, so a key that
  is missing from Bengali fails `tsc` rather than shipping an English sentence
  into a Bengali page. The files contain no code: interpolation is
  [`fill()`](src/lib/i18n/format.ts).
- **Catalogue content** picks its language in [`src/lib/i18n/content.ts`](src/lib/i18n/content.ts).
  The two sides are not symmetrical: every book has an English title, only
  Bengali books have a Bengali one, so a Bengali page naming a book *Cosmos* is
  correct rather than a gap.
- **Adding a third language** means: add it to `locales`, add a dictionary file,
  and fill in the Bengali-equivalent fields on the data. No page changes.

## Getting in

Three separate questions, deliberately:

**Signing in** is open. Anyone with a Google account can, in one step: Google
returns an ID token, it is verified server-side against Google's published keys
([`src/lib/auth/google.ts`](src/lib/auth/google.ts)), and the verified address
becomes the session. No allowlist, no second factor, nothing to be approved for.
This is the librarians' door; readers come in through the printed codes.

**Registering** is for whoever is holding a hard copy. Two QR codes are printed
in the book. The first goes to `/signup`, which asks for a name, an address and
`SIGNUP_CODE`, and issues a session that can see exactly one page: the one
asking for the second code. The second QR goes to `/api/unlock?k=<UNLOCK_CODE>`,
which finishes the account and lands the reader in the library. One scan,
nothing typed; [`/[lang]/unlock`](src/app/[lang]/(auth)/unlock/page.tsx) has a
form for when the camera will not focus.

Stopping halfway is the point of two codes rather than one: otherwise the
first would be the whole gate and the second would be ceremony. A route handler
does the scan ([`src/app/api/unlock/route.ts`](src/app/api/unlock/route.ts))
because a Server Component cannot set a cookie.

Nothing is stored. There is no users table: the name and address go straight
into the signed cookie, which *is* the account. A reader on a new device
registers again: the codes are in their book.

Be clear-eyed about what those codes are. They are printed, in circulation, and
identical in every copy of the run, so anyone who photographs the page can pass
on what they saw. That is inherent to a static print run, and it is why nothing
that matters hangs on them: a QR account can never administer the library
([`canAdminister`](src/lib/auth/session.ts)) no matter whose address it was
registered with, and `/signup` refuses an address in `ADMIN_EMAILS` outright.

**Administering** is a short list of addresses. `ADMIN_EMAILS` (one or more,
comma-separated) is compared against the signed-in address every time it
matters ([`isAdminEmail`](src/lib/auth/config.ts)): that is the whole
authorisation model. No users table, no roles to assign, no invitations to
revoke; editing the variable moves the admin, and it takes effect on the next
request rather than when an eight-hour cookie expires. That is also why there is no `role` in
the token: a claim stamped into a session outlives the decision that granted it.

The admin account shows as `pediatric-book-bank` wherever it appears: a constant in
[`src/lib/auth/username.ts`](src/lib/auth/username.ts), not a setting. Everyone
else shows the name they signed in with.

Set up in [`.env.example`](.env.example): a Google **Web application** client id
(no secret and no redirect URI needed, this uses Google Identity Services),
`ADMIN_EMAILS`, and an `AUTH_SECRET` for signing the session cookie.

Without a client id, and only outside production, `/[lang]/signin` accepts an
address directly so a fresh clone can sign in. What it cannot do is *prove* the
address belongs to whoever typed it, which is why the branch is compiled out of
a production build.

The guard is layered: [`src/proxy.ts`](src/proxy.ts) turns away anonymous
requests for anything but the three door pages, holds half-finished
registrations at the second code, and keeps everyone who is not the
administrator off admin screens. Every Server Action calls `requireAdmin()`
itself, because a POST never passes through a page. A signed-in reader who asks
for `/admin` is sent to the catalogue rather than to a sign-in form they have
already used.

### The book files

They are not in `public/`. They were, and that made the gate on the pages
decoration: the proxy's matcher has to skip anything with a file extension, so
anyone with a URL could take a PDF without ever meeting the sign-in form.

They live in `private/books/` now, and
[`src/app/api/file/[slug]/route.ts`](src/app/api/file/[slug]/route.ts) is the
only way to them. It checks the same signed cookie the proxy would have, serves
`inline` for the reader and `attachment` for the download button, and supports
range requests, without which opening the 36MB handbook would pull the whole
file before drawing page one.

Because that path is assembled from a slug at runtime, the build's file tracer
cannot see it; `outputFileTracingIncludes` in
[`next.config.ts`](next.config.ts) is what keeps the books in the deployed
bundle.

### Search engines

The catalogue is behind an account, so it is invisible to search: every book,
author and category URL answers a crawler with a redirect to sign-in. The
sitemap lists the sign-in page and nothing else, and `robots.txt` disallows the
rest rather than spending crawl budget rediscovering the same redirect. That is
the cost of gating the shelves, not an oversight.

## How it is put together

| | |
|---|---|
| [`src/lib/data/books.ts`](src/lib/data/books.ts) | the only seam between pages and the catalogue store. Swapping the fixtures for Postgres changes this file and nothing else. |
| [`src/lib/actions/`](src/lib/actions/) | Server Actions: the only writes. Zod-validated, session-checked, narrowly revalidated. |
| [`src/components/book-3d.tsx`](src/components/book-3d.tsx) | a book as five faces of a bound volume: board, spine, fore-edge, head, tail. Pure CSS transforms, no WebGL, no library. |
| [`src/components/shelf-3d.tsx`](src/components/shelf-3d.tsx) | a collection as a row of spines on a plank: spine width tracks page count. |
| [`src/components/book-stack-3d.tsx`](src/components/book-stack-3d.tsx) | the hero: a pile of volumes on a table, seen from above. |
| [`src/lib/cover-theme.ts`](src/lib/cover-theme.ts) | eight hand-mixed cover schemes. Covers are drawn, never uploaded, and can never land outside the palette. |
| [`src/app/globals.css`](src/app/globals.css) | design tokens, the 3D geometry, and one kill-switch that disables every transform under `prefers-reduced-motion`. |

Almost every page is prerendered: 229 static documents across both languages,
which is what lets the whole catalogue be served from cache. The exceptions are
the filtered catalogue, the search page and everything under `/admin`, which are
dynamic by design.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build; also typechecks
npm run lint    # eslint
node probe.mjs <url> [screenshot.png] [waitMs]   # headless-Chrome smoke test
```

## Not done yet

- Books are held in memory ([`src/lib/fixtures/catalogue.ts`](src/lib/fixtures/catalogue.ts)),
  so admin edits last until the server restarts. The brief's plan is Postgres for
  metadata and R2 for files, with uploads presigned straight to R2.
- The contact form validates but posts nowhere.
- The CSP in [`next.config.ts`](next.config.ts) still needs `'unsafe-inline'` for
  scripts; the note there explains how to remove it at the edge.
