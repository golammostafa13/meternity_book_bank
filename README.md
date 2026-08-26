# Maternity Book Bank: a digital library for mothers, midwives and health workers

A bilingual (বাংলা / English) library on pregnancy, birth and newborn care,
opened by the password printed inside the sponsored copy, plus a private admin
for the librarian who maintains it. Sponsored by Radiant Pharmaceuticals
(Exium MUPS 20).

Warm rose ground, near-black ink, a single hot pink, and books rendered as
physical objects rather than as cards with pictures on them.

```bash
npm install
cp .env.example .env.local   # then fill it in; see "Getting in" below
npm run dev                  # http://localhost:3000 → /en/signin or /bn/signin
```

The bare domain opens the door rather than the library: `/` lands on sign-in,
and there is no way past it. Nothing on this site opens without a session,
not a book page, not the reader, not a file.

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
  Bengali books have a Bengali one, so a Bengali page naming a book
  *The Pregnancy Book* is correct rather than a gap.
- **Adding a third language** means: add it to `locales`, add a dictionary file,
  and fill in the Bengali-equivalent fields on the data. No page changes.

## Getting in

The door asks for two things: an **email address** and a **password**. They
answer two different questions, and keeping them apart is the whole model.

**Reading** is the password, and it is printed inside the sponsored copy, so
every reader types the same word (`SITE_PASSWORD`). There are no accounts to
sign up for and nothing to be approved for. The address beside it grants an
ordinary reader nothing at all and is checked against nothing: it is required,
shape-tested, and written down, so the sponsor can see the print run is being
read.

Be clear-eyed about what that password is. It is printed, in circulation, and
identical in every copy of the run, so anyone who photographs the page can pass
on what they saw. That is inherent to a static print run, and it is why nothing
that matters hangs on it: the reader password can never administer the library
no matter who types it, and there is nothing behind it but books that are free
to read anyway.

**Administering** needs *both* halves, and neither is sufficient alone:

- the address must be listed in `ADMIN_EMAILS` (one or more, comma-separated), and
- `ADMIN_PASSWORD` must be typed, not the reader one.

An address on the list that types the *reader* password is an ordinary reader
for that session. An address that is **not** on the list and types the admin
password is turned away outright rather than downgraded to a reader — see the
note on [`doorRole`](src/lib/auth/config.ts). That is deliberate: the admin
password is the reader password plus one character, so "downgrade to reader"
would quietly turn that extra character into no protection at all.

The rejection message is the same sentence for every kind of wrong, including
an unlisted address typing the right admin password, so the form cannot be used
to discover who the administrators are.

Whether a session may administer is recomputed on every request from the live
`ADMIN_EMAILS` rather than stamped into the cookie
([`canAdminister`](src/lib/auth/session.ts)), so removing an address takes
effect on the next request rather than when an eight-hour cookie expires. Only
the fact that the admin *password* was typed is carried in the token, because
the server cannot re-derive that.

The door is rate-limited — ten attempts per address per ten minutes,
successes included ([`src/lib/auth/rate-limit.ts`](src/lib/auth/rate-limit.ts)).
One shared password with no throttle is a password an attacker can simply try
their way into.

The admin account shows as `maternity-book-bank` wherever it appears: a
constant in [`src/lib/auth/username.ts`](src/lib/auth/username.ts), not a
setting. A reader shows the local part of the address they typed.

**Registering** (`/signup`) is a third, separate thing, and it is *not* how
anyone gets in. It records who received a copy and where — District and Thana,
picked from a list of all 64 districts — for the sponsor, and it grants
nothing. Every field is optional except a name and the phone number that keys
the record. A reader who registers still needs the password; a reader who never
registers is not held back by it.

The guard is layered: [`src/proxy.ts`](src/proxy.ts) turns away sessionless
requests for anything but the two door pages and keeps everyone who is not the
administrator off admin screens. Every admin Server Action calls
`requireAdmin()` itself, because a POST never passes through a page.

### Who has been in

`/[lang]/admin/readers` shows two tables, and they are two different facts
rather than two views of one:

- **The register** — readers who chose to fill in `/signup`. Voluntary, so it
  is a sample rather than a census. Keyed on phone number.
- **At the door** — every address that has typed the printed password, written
  without anyone being asked. Close to complete, but it is an address and a
  count and it cannot say where a book landed.

Both live in Upstash Redis in production and in `private/*.json` locally; see
**Deploying** below for why the file is not an option on Vercel. Neither is a
credential — nothing on that screen is consulted to decide who may come in.

### The book files

They are not in `public/`. They were, and that made the gate on the pages
decoration: the proxy's matcher has to skip anything with a file extension, so
anyone with a URL could take a PDF without ever meeting the password.

They live in `private/books/` now, and
[`src/app/api/file/[slug]/route.ts`](src/app/api/file/[slug]/route.ts) is the
only way to them. It checks the same signed cookie the proxy would have —
before a single byte is read — serves `inline` for the reader and `attachment`
for the download button, and supports range requests, without which opening the
15MB *Baby's Best Chance* would pull the whole file before drawing page one.

Two sources behind one interface:

- **Locally**, with `BOOKS_RELEASE_BASE` unset, the file is read off disk from
  `private/books/`. That directory is gitignored and absent from a deploy.
- **In production**, `BOOKS_RELEASE_BASE` points at a GitHub Release holding
  the same slug-named files, and the route **proxies** the bytes rather than
  redirecting to them. That is not a preference: GitHub redirects to
  `release-assets.githubusercontent.com`, which sends no CORS headers, and
  pdf.js reads through `fetch`, so a redirect is blocked by the browser while a
  proxy is not. The download button would survive a redirect (`<a download>` is
  a navigation, and CORS does not apply) but the reader would not.

Publishing a new set of files is one command:

```bash
gh release create v1.0-books private/books/*.pdf \
  --title "Book files v1.0" --notes "PDF assets served by /api/file/[slug]."
```

Adding files to a release that already exists is `gh release upload v1.0-books
private/books/<slug>.pdf`, which matters because the glob above is no longer
the right thing to run unthinkingly — see below.

**A public repository's release assets are public URLs.** The password gates the
reader and the download button, not the underlying asset. That was the whole
story while every title was a freely redistributable WHO/HSE/BC-government
publication: the licence permitted redistribution, so a public asset URL cost
nothing.

It is no longer the whole story. **Fourteen** files must not go into a public
release. Thirteen of them are the clinical textbooks added on 26 August 2026,
and the fourteenth predates them:

| File | Why |
| --- | --- |
| `johns-hopkins-manual-gynecology-obstetrics.pdf` | © 2021 Wolters Kluwer, all rights reserved |
| `obstetric-decisions.pdf` | © 2026 Davies and Sykes / CRC Press, all rights reserved |
| `te-lindes-operative-gynecology.pdf` | © 2020 Lippincott Williams & Wilkins, all rights reserved |
| `clinical-obstetrics-gynecology-osce.pdf` | © 2022 Wolters Kluwer (India), all rights reserved |
| `polycystic-ovary-syndrome.pdf` | © 2022 Springer Nature, all rights reserved |
| `assisted-reproductive-techniques-vol-2.pdf` | © 2024 Gardner and colleagues / CRC Press, all rights reserved |
| `infertility-in-practice.pdf` | © 2023 Adam H. Balen / CRC Press, all rights reserved |
| `100-cases-obstetrics-gynaecology.pdf` | © 2025 Bottomley and colleagues / CRC Press, all rights reserved |
| `endometriosis-diagnosis-management.pdf` | © 2023 Amso and Banerjee / CRC Press, all rights reserved |
| `boston-ivf-handbook-of-infertility.pdf` | © 2018 Taylor & Francis, all rights reserved |
| `bonneys-gynaecological-surgery.pdf` | © 2011 Lopes and colleagues / Wiley-Blackwell, all rights reserved |
| `uterine-fibroids.pdf` | © 2021 Taylor & Francis, all rights reserved |
| `drugs-and-pregnancy.pdf` | © 2022 Taylor & Francis, all rights reserved |
| `who-obstetric-fistula-guiding-principles.pdf` | © WHO 2006, all rights reserved — predates WHO's move to CC BY-NC-SA 3.0 IGO and was never relicensed |

Each one's `license` field in the catalogue says so, and the fistula record
carries the reasoning in a comment beside it. The thirteen textbooks are about
292 MB of copyrighted reference between them; the fistula guide is 0.4 MB, and
being small makes it no more publishable. Putting any of them in a public release
publishes copyrighted material at a guessable URL with no password in front of
it, which is a different act from the one the paragraph above was written about,
and it is a decision for whoever runs the library rather than one this repository
should make quietly.

Because `private/books/*.pdf` now globs fourteen files that should not be
published, the safe form of the command is to name the nineteen that may be.
Those nineteen are exactly the titles whose `license` names WHO, a ministry or a
Crown copyright — every pre-2026-08-26 entry except the fistula guide:

```bash
gh release create v1.0-books \
  $(ls private/books/*.pdf | grep -E 'who-|the-pregnancy-book|my-pregnancy-hse|babys-best-chance|obstetrics-gynaecology-newborn-care-guide' \
    | grep -v 'obstetric-fistula') \
  --title "Book files v1.0" --notes "PDF assets served by /api/file/[slug]."
```

Three honest ways forward for the fourteen:

- **Leave them off the release.** Everything renders — record, cover, metadata —
  and only the reader and the download 404. `BOOKS_RELEASE_BASE` unset locally
  still serves them from `private/books/`, so development is unaffected.
- **Host them somewhere the URL is not public.** `BOOKS_RELEASE_BASE` can point
  at an R2 bucket instead, but note that the route fetches the asset with no
  credentials: anything requiring an `Authorization` header needs that header
  added to `serveFromRelease` first.
- **Publish them anyway**, having decided the risk is the library's to carry.

### Search engines

The catalogue is behind an account, so it is invisible to search: every book,
author and category URL answers a crawler with a redirect to sign-in. The
sitemap lists the sign-in page and nothing else, and `robots.txt` disallows the
rest rather than spending crawl budget rediscovering the same redirect. That is
the cost of gating the shelves, not an oversight.

## Deploying

Vercel, from this repository. Nothing in the deploy is stateful except Redis.

**1. Publish the book files.** `private/` is gitignored, so the PDFs never
reach the deployment; they are served from a GitHub Release. See
**The book files** above for the `gh release create` command.

**2. Set the environment.** In the Vercel project, Settings → Environment
Variables, for Production *and* Preview:

| Variable | Value |
|---|---|
| `SITE_PASSWORD` | the word printed in the sponsored copy |
| `ADMIN_PASSWORD` | the reader password plus one character; printed nowhere |
| `ADMIN_EMAILS` | the administrators, comma-separated |
| `AUTH_SECRET` | `openssl rand -base64 48` — **not** the development value |
| `BOOKS_RELEASE_BASE` | `https://github.com/<owner>/<repo>/releases/download/v1.0-books` |
| `UPSTASH_REDIS_REST_URL` | from the Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | from the Upstash console |

`KV_REST_API_URL` / `KV_REST_API_TOKEN` are read as equivalents, so Vercel's
own Upstash integration works without renaming anything.

**Redis is not optional in production.** Three things use it, and on a
serverless host all three degrade badly without it, because the filesystem is
per-instance and wiped by every deploy:

- the register (`/signup`) falls back to `private/readers.json`;
- the door record falls back to `private/accounts.json`;
- the rate limit falls back to a `Map` inside one lambda, so ten attempts per
  address becomes ten attempts *per instance*.

The admin Readers screen says which store it is actually reading, so a
misconfigured deploy is visible rather than silently forgetting rows.

**3. Deploy.** `vercel --prod`, or connect the repository and push. The build
runs `next build`, which typechecks.

Rotating `AUTH_SECRET` signs everyone out at once, which is the blunt
revocation lever. Removing an address from `ADMIN_EMAILS` revokes that
administrator on the next request without touching anyone else.

## How it is put together

| | |
|---|---|
| [`src/lib/data/books.ts`](src/lib/data/books.ts) | the only seam between pages and the catalogue store. Swapping the fixtures for Postgres changes this file and nothing else. |
| [`src/lib/actions/`](src/lib/actions/) | Server Actions: the only writes. Zod-validated, session-checked, narrowly revalidated. |
| [`src/components/book-3d.tsx`](src/components/book-3d.tsx) | a book as five faces of a bound volume: board, spine, fore-edge, head, tail. Pure CSS transforms, no WebGL, no library. |
| [`src/components/shelf-3d.tsx`](src/components/shelf-3d.tsx) | a collection as a row of spines on a plank: spine width tracks page count. |
| [`src/components/hero-cinematic.tsx`](src/components/hero-cinematic.tsx) | the hero: a slow pan across four chapter plates, with the collection surfacing over it. |
| [`src/lib/cover-theme.ts`](src/lib/cover-theme.ts) | eight hand-mixed cover schemes. Covers are drawn, never uploaded, and can never land outside the palette. |
| [`src/app/globals.css`](src/app/globals.css) | design tokens, the 3D geometry, and one kill-switch that disables every transform under `prefers-reduced-motion`. |

Almost every page is prerendered across both languages,
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
