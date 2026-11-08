# bento: links.andydetskas.com

A link card over a generative 3D background. It is also the first build of the **Taos** design system that may replace the Framer site. The chosen direction is **Glyphs**: Taos icons extruded into 3D tokens.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321  (tokens rebuild first)
```

- `/`: the page. `/?palette=earth` previews a named Glyphs palette. `/?layout=checker` (or `grid`, `scatter`) previews a glyph layout. `/?preset=ridgeline-color` previews any scene preset.
- `/lab`: the customizer. Sections: Scene, Palette, Glyphs, Shape, Motion & light, Card & type.
  - Click any swatch to pick a Taos color.
  - Tweaks persist on reload. **H** hides the panel, **G** toggles the baseline grid.
- `?settle=6` on either page renders a finished frame immediately (for captures and share images).
- `/og`: the share-image template (1200×630). With the dev server running, `npm run og` captures it at 2x to `public/og.png`. Re-run it when the default preset, the profile or the links change, then commit the PNG. The Open Graph tags in `src/layouts/Base.astro` add a content hash to the image URL, so LinkedIn and others fetch the new one.

- `npm run perf`: a phone performance check. Run `npm run build && npm run preview` first. It emulates a mid-range and a low-end phone (CPU slowed 4x and 6x, slow 4G) plus a desktop, then reports load timings, long tasks (anything over 50 ms holds up a tap), JS time per frame, and draw calls and triangles per frame. `--touch` taps a row on phones, and hovers then Tabs on desktop, to check the row states. Run it after changing the default preset (count, layout, glyph set or depth).

- `/site/`: the main-site prototype (andydetskas.com, "full" treatment), `site` branch only. Not linked, `noindex`.
- `npm run handoff`: the bento → main-site hand-off across two origins. It builds once and serves the bento at http://localhost:4321/ and the site at http://localhost:4322/site/ with GitHub Pages' headers (`max-age=600`, CORS `*`, gzip). Tap Portfolio on the bento. Throttle the network in DevTools to feel it on a slow phone.

Node 22.14 is installed, so this uses Astro 6. Astro 7 needs Node ≥ 22.23.

## How it's built

| Layer | Where | Notes |
|---|---|---|
| Tokens | `tokens/taos.tokens.json` → `npm run tokens` → `src/styles/tokens.css`, `src/lib/tokens.ts` | W3C design-tokens format. Palette sampled from the Taos Style Guide (Figma `JrqclJqDkOD0I4oc22cnVx`). Components use the role tokens (`--color-*`), never raw palette values. |
| Type & grid | `scale`, `baseline`, `leading` in the token file | 4px baseline unit. Fluid type steps `--step--2…5` (Utopia method, built by the token script). Line-heights snap up to 4px with CSS `round()`. Spacing tokens are multiples of 4. |
| Fonts | `src/styles/global.css` | DM Sans (variable, optical sizes) + DM Mono, by Colophon Foundry, SIL OFL, self-hosted via Fontsource. `[data-font="apercu"]` swaps to a locally installed Apercu for comparison. |
| Icons | `src/icons/*.svg`, `src/icons/marks/*.svg` | Taos icons, recolored to `currentColor`: one source for the inline icons and the extruded 3D glyphs. `marks/` holds one-off site icons (the technique marks from the 2026 Portfolio file's blog heroes), kept out of the scene's glyph pool. `Icon` looks in both. |
| Content | `src/content/links.json` | Profile + links (label, eyebrow, url, icon, tooltip). Accents live in tokens under `accent.*`. |
| Presets & palettes | `src/lib/presets.ts` | A concept is a preset: scene family + palette + params + card style. `glyphPalettes` holds the 15 named Glyphs palettes (color, earth, mono), each with its own extrusion color. Paste "Copy preset" output from the lab here. |
| 3D engine | `src/lib/shape-field/` | Framework-free Three.js. `prepareShapeField(preset)` warms up the heavy assets, then `createShapeField(canvas, preset)` returns `{ time, seek, setPreset, setPalette, setParam, setAccent, setFocus, snapshot, advance, destroy }`. `seek(t)` jumps to scene time t (the glyph family has a closed form). Families: `glyphs`, `pueblo`, `ridgeline`, `petal`. |
| Components | `src/components/` | `LinkCard`, `ShapeField`, `Icon`, plus the parts both pages share: `CardHead` (globe, name, role) and `Pill` (cursor pill and scene tint for any `[data-pill]` / `[data-accent]`). Site parts are in `site/`. The card surface (`.card`) and the line reveal live in `global.css`. |
| Site content | `src/content/site.json` | Main-site prototype copy. Card copy from andydetskas.com. Roles and outcomes from the public-safe column of the facts sheet (Master Profile §2.2). No years. |

Pages talk to the scene through two DOM events: `bento:accent` (hover tint) and `bento:preset` (switch concept).

**Start-up.** Three.js loads after first paint. `prepareShapeField(preset)` then extrudes the glyphs one per task, and the engine compiles its shaders with `compileAsync` before the first frame. That keeps the main thread free for taps while the scene loads.

Baseline (default checker preset):
- Mid-range phone (4x CPU): the longest task is about 55 ms (it was 285 ms before the split). The scene appears about 2.1 s after opening on slow 4G.
- Low-end phone (6x CPU): the longest task is about 85 ms (was 427 ms).
- While it runs: about 0.4 ms of JS per frame, a steady 60 fps, 12 draw calls and 66k triangles per frame on a phone. The camera only sees about a dozen of the ~90 glyphs, and the rest are culled.

**Touch.** Taps get no tooltip, no scene tint and no row dimming. Hover styles sit behind `@media (hover: hover)`, and the tint follows keyboard focus (`:focus-visible`) only.

## Main site prototype and the hand-off (`site` branch)

`/site/` is the bento card grown into a site: cards over the same scene. On desktop:

```
hero    portfolio   leadership
        techniques  about
```

The left column below the hero stays open, so the scene shows there as you scroll. The hero's masthead links home (on the grid it closes an open card, like Back). The hero links to LinkedIn and Figma, and its Schedule a call button sits at the bottom of the card when the row is taller than its content, on one row with the Open for opportunities status (which folds onto two short lines where the hero is narrow). Leadership's card lists four practices (the numbers are in its panel). About leads with the photo from the old About page, and My working kit lives there: one line on the card, and the full kit beside the experience list when it's open. The experience list matches the live About page's, without years or the sabbatical. Cards carry no item counts.

- **Takeover.** Opening Portfolio, Leadership, Techniques or About takes over the right two columns, like Bohdana. The other cards step out, and the hero stays put while the panel scrolls. A same-document view transition moves everything. Close with the Back pill at the card's top (the same one the closer looks use; it stays in reach while a long panel scrolls), the browser's Back, Escape, or the card's title.
- **Smaller screens.** Tablet: the hero on the left, the other cards stacked on the right, and the takeover fills the right column. Phones: one column, and cards open in place.
- **Hover.** Hovering a card fades the others; keyboard focus does the same. Off while a card is open. The hero card has no mouseovers (no pills, no scene tint, no row dimming); keyboard focus still shows.
- **Panels show everything.** Portfolio opens to all eight case studies and Techniques to all six techniques, so nothing hides behind a "see all" link.
- **A URL per section.** `/site/work/`, `/site/leadership/`, `/site/techniques/` and `/site/about/` are real pages (`src/pages/site/[section].astro`, list in `src/lib/site-sections.ts`): the same grid rendered with that card open, with its own title, description and canonical URL, so search engines and AI answer engines see a page per section. Each card is a link to its page; on the page, a click opens the card in place as a new history entry (`pushState`), so the browser's Back closes it and Forward opens it again. The Back pill steps back through history when the entry behind is the grid, and on a section page reached directly it closes the card and adds the grid's entry. The page restores scroll itself (`history.scrollRestoration = 'manual'`, a position saved per entry), because the view transition updates the page after the browser would have. A new-tab click loads the section's page. Slugs match the Framer site's paths. Old hash links (`/site/#portfolio`) still open their card and move to its URL.
- **Moving between site pages.** Clicking from Selected work into a closer look (or Back) is a real page load with its own URL, but it doesn't replay the intro: the leaving page stores the scene's clock in sessionStorage on `pagehide`, and `SiteHead.astro` picks it up before first paint (`html.from-site`), so the page shows at once and the scene continues where it was. A cross-document view transition keeps the hero still and morphs the open Selected work card into the closer-look card. A reload plays the full entrance.
  The scene gets a layer of its own in that transition (named on `pageswap` in `lib/site-shell.ts` and on `pagereveal` in `SiteHead.astro`, cleared when it finishes). The new page needs a moment to boot its scene, so the last page's frame holds underneath (`scene-hold` in `site.css`) and the new scene fades in over it; then `html.scene-arrived` lets the old frame go. Without this, the background dropped to its flat color for up to half a second. A card that's on both pages crossfades on matching 300 ms curves, so it stays solid while it morphs and the scene never shows through it.
  Back and Forward usually restore the page from the browser's back/forward cache instead of loading it. The restored page's scene would resume from the moment the visitor left, so `rememberScene` (`lib/site-shell.ts`) seeks it to the clock of the page they're coming from (written on `pageswap`, which Chrome fires before the restored page's `pageshow`; `pagehide` comes too late there). Chrome also replays the hover of the click that left (pill, tint, hover styles) at the old pointer spot, so `Pill.astro` clears hover on a restore and keeps it off (`html.hover-paused`) until the mouse really moves.
- **Techniques link out.** Each technique on the card links to its article (new tab), above the card's own link. Hovering one brings in an arrow and a cursor pill with its one-line note; a long pill flips to the pointer's left near the edge.
- **Portfolio card.** One screen, close up (StackScore's score ring, `public/site/work/stackscore-screen.webp`, cut from the StackScore tile image), centered on its tint; the panel grows to fill the card. Swap it in `site.json` → `portfolio.feature`.
- **Portfolio panel.** Thumbnails sit centered in their tint with equal margins (a single bare screenshot gets screen corners: `fit: "screen"`). Six case studies: Battery UI is to fold into the SRAM closer look and Call-and-Response into StackScore's (their images stay in `public/site/work/` for that). Each shows my role in its eyebrow (company · role) and the public outcome. Tiles side by side share their rows (CSS subgrid), and summaries and outcomes are kept to about the same length (~100 and ~115 characters), so the grid stays even. It links to the work's closer-look page if it has one, otherwise to the full, passcode-protected case study.
- **A closer look (`/site/work/<slug>/`).** The public, ungated version of a case study, in the site's shell (`components/site/CloserLook.astro`): the hero on the left, the work as an open card. A sticky Back link at the top (Bohdana) returns to Selected work, through history when that's where the visitor came from (so it comes back exactly as left), otherwise as a link; Escape does the same. Keep to the problem in public terms, my role, the key decisions with their artifacts, what shipped and what I learned, plus at most the one public-safe result line from the facts sheet. Call-only numbers, internal tools, colleagues' details and dates stay off. First one: Designing for Trust.
- **Leadership.** Built only from the facts sheet's public-safe management lines.
- **Widths.** Column one is `--site-col` (`global.css`). The hero card fills it, and the bento's exit narrows its card to it.
- **Entrance: background first.** Your name reveals on the masthead over the scene color, as on the bento. The scene boots right away (`<ShapeField eager />`). If it arrives within 1.2 s, its glyphs get 0.9 s to grow in before the hero opens and the cards land. If it's late (a slow phone), the work lands at about 1.2–1.5 s and the scene fades in behind it. After a hand-off the bento has already shown the scene, so the site follows straight on. `ShapeField` fires `shapefield:firstframe` when the scene is on screen (or `live: false` without WebGL).

**Hand-off (`src/lib/handoff.ts`).** `links.` and `www.` are different origins, so the browser can't morph one page into the other. Cross-document view transitions are same-origin only. They are the same site, though:
1. **Exit.** Tapping Portfolio opens the site in the same tab. The card folds up to its masthead at the top-left and narrows to the site's first column, and the scene dissolves into the background color (440 ms). That is the hero card's first frame. The site then opens the hero and lands the other cards.
2. **Scene clock.** A 20-second cookie (`Domain=andydetskas.com` in production) carries the scene time. The site reads it before first paint, boots the scene right away, and `seek()`s to the same moment, so the glyph field continues instead of restarting.
3. **Cache.** The bento preconnects to the site. Chrome prefetches the page from a speculation rule when a pointer lands on Portfolio. Elsewhere (Safari, in-app browsers) a `fetch()` on pointerdown warms the HTTP cache. With `ASSETS_ORIGIN` set at build time, every page takes `/_astro/` files from one origin. A visitor coming from the bento then already has Three.js, the fonts and the scene code cached: the HTTP cache is shared per site, but only for the same URL.
4. **Back button.** A bfcache restore puts the bento back as it was. Cmd/Ctrl-click opens a new tab with no exit.

Measured (`npm run handoff`, emulated mid-range phone, 4x CPU, slow 4G):
- The site paints its first frame about 0.85 s after the tap, down from 1.17 s before the shared cache.
- The HTML, Three.js, both fonts and the scene code come from cache. The site's own stylesheet and the box images come over the network.
- Scrolling the site holds 60 fps on both emulated phones (p95 frame 16.8 ms).

Not verified yet: Safari and in-app browsers. The `fetch()` warm-up and cross-origin cache reuse were only measured in Chrome.

## Glyphs palette model

- `colors`: 1–8 face colors. Each glyph takes one at random, spread evenly.
- `extrusion`: the side walls. The default is **True Black 80%** (Taos True Black 500, `#323131`). `contrast` darkens the shaded side.
- Hovering a link tints every face toward that link's accent. The strength is set by `tint`.
- `layout`: `scatter` (default; each glyph drifts at its own speed, so the field loosens and clumps over time), `grid` (even rows and columns) or `checker` (alternate squares). Grid and checker drift as one sheet, so the spacing stays even. Neighbours avoid repeating an icon or face color, and `jitter` (0–1) loosens the lattice. Count runs about twice as dense in grid and checker.

## Deploy

`.github/workflows/deploy.yml` builds on every push (Node from `.nvmrc`, `npm ci`, `npm run build`) and deploys `dist/` to GitHub Pages from `main` only. Branch pushes are a build check.

To launch the redesign:

1. Settings → Pages → Source: switch from "Deploy from a branch" to **GitHub Actions**. Do this at merge time: once it's switched, pushes to the current `main` (plain HTML) no longer publish.
2. Merge `redesign` → `main`. The push to `main` runs the deploy.
3. Check https://links.andydetskas.com. The custom domain and HTTPS are Pages settings and carry over.

HTTPS is enforced (Let's Encrypt certificate, valid to Feb 3, 2027).

## Open before shipping

- **Fonts.** DM Sans/DM Mono are free to ship. Apercu would need a web license: the only purchase on record is a Fontdeck hosted subscription (2014–15), and Fontdeck no longer exists.
- `legacy-index.html` is the previous single-file site, kept for reference until launch.
