# Attic

Working code that is no longer referenced, kept rather than deleted.

Nothing in here is compiled or bundled: `tsconfig.json` excludes the directory,
and Next never sees it because it is outside `src/`. It is here because this
project is not under version control yet, so a deletion would be final.

| file | what it was | why it left |
|---|---|---|
| `hero-3d.tsx` | the scroll-scrubbed hero: a bound volume opening, the collection arriving out of it, settling into a shelf | replaced by `src/components/hero-cinematic.tsx`. The scene worked, but it asked the reader to scroll before the page would say anything, and what it said was "here is a book", which the shelves below say better |
| `hero-scene.ts` | the three.js scene the above drove: ~1,100 lines, every volume built from boxes and planes with `lib/cover-canvas` drawing the boards | same reason. Worth reading before building any new three.js here; the renderer setup, the resize handling and the disposal are all correct in it, and `lib/exium-scene.ts` follows its shape |
| `book-carousel-3d.tsx` | the featured coverflow: a ring of covers turning past the reader | the pinned collection scroll replaced the featured shelf it stood in. Leaving both would have said the same thing twice at two different qualities |
| `book-stack-3d.tsx` | books lying flat, seen from above at an angle: the hero's static fallback | its only caller was the hero's `fallback` prop, and the cinema hero's fallback is a still plate |
| `hero-recent.tsx` | the recently-added list: six rows, each a spine, a title and a download disc | replaced by `src/components/arrivals-scroll.tsx`, which pins the section and gives each arrival a screen of its own. The list was fine at what it did; what it could not do was give a new book any presence |
| `catalogue-filters.tsx` | the /books filter bar: a search field, two select boxes and a row of category chips, all pushing URLs through the router | replaced by the links and the plain GET form inside `src/components/catalogue-cinema.tsx`. Same URLs, same behaviour, no bundle: the filters were the only reason that page shipped client JavaScript |

Delete the lot once the project is in git and you are happy with what replaced
them. If any of it comes back, note that `three` is still a dependency and
`.book3d` is still in `globals.css`. Everything else these files styled is in
`dead.css` beside them, including the `.hero-recent` block.
