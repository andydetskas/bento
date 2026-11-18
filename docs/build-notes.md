# Build notes

The working notes behind the link card (links.andydetskas.com) and the site (www.andydetskas.com): how each part works and why it's built that way. The public overview is the [README](../README.md).

Both are the first build of the **Taos** design system. The background direction is **Glyphs**: Taos icons extruded into 3D tokens.

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

Pages talk to the scene through `bento:preset` (switch concept). `bento:accent` is still sent on hover (it colors the cursor pill), but the scene no longer tints with it: its color holds on every page (Andy, Nov 16).

**Start-up.** Three.js loads after first paint. `prepareShapeField(preset)` then extrudes the glyphs one per task, and the engine compiles its shaders with `compileAsync` before the first frame. That keeps the main thread free for taps while the scene loads.

Baseline (default preset, Glyphs · Adobe at 34% opacity, checker):
- Mid-range phone (4x CPU): the longest task is about 55–70 ms (it was 285 ms before the split). The scene appears about 2.2 s after opening on slow 4G.
- Low-end phone (6x CPU): the longest task is about 75–90 ms (was 427 ms).
- While it runs: under 1 ms of JS per frame, a steady 60 fps, about 16 draw calls and 55k triangles per frame on a phone (one draw per face color in view; Adobe has six). The camera only sees about a dozen of the ~90 glyphs, and the rest are culled.

**Touch.** Taps get no tooltip and no row dimming. Hover styles sit behind `@media (hover: hover)`.

## Main site prototype and the hand-off (`site` branch)

`/site/` is the bento card grown into a site, over the same scene, and the work leads it (Andy, Nov 16; tried as a demo on `demo/work-first`, after luzcas.com and jessicagracia.com). On desktop:

```
hero (menu)   Selected work: a masonry of six tiles on one white page
              Earlier work ticker
```

The hero is the site's menu (`HeroMenu.astro`): the headline, then Selected work, Techniques, Leadership and About as rows (a filled dot marks the current one), Display settings as the last row, then Email me and Schedule a call. LinkedIn lives on About, in the contact line. The hero's masthead links home (on the home it closes an open section, like Back). The hero stays put while the work scrolls and lets go where the work ends (it and the work share a subgrid row, `.wf-top`). Styles for all of this are in `src/styles/home.css`.

- **Selected work (`WorkGrid.astro`).** Two columns of tall and half-height tiles; a tall tile is as tall as the hero (measured at its opened height, so nothing jumps during the entrance), and the columns end level. Order and which tiles are tall are Andy's (`ORDER`, `TALL`). Each tile has art made for its shape in `public/site/work/home/` (phones and pieces cut from the case-study slides, the code-and-skills panel, Buying Club lifted off its tint), the company in a chip, and the case study and role in the cursor pill (and in the caption for screen readers). Decoration: Strava-orange banner tickers behind the two Strava phones, SuppCo's nutrient pills (re-drawn, not SuppCo code) on its light blue behind StackScore, and a six-second loop of SRAM's Rival AXS film behind the battery card (hosted here, 960×400, 2.4 MB; it plays only on screen and with motion on). Banners crawl at the pills' pace, about 6 px a second.
- **Earlier work (`LogoTicker.astro`).** The Framer home's logo ticker, minus the companies already in the tiles (and Function, which acquired SuppCo): United, Allstate, Intuit, Arity, Pivotal Labs, labeled "Earlier work" (plain text, not a link). Logos are CSS masks from the Figma Brand Assets SVGs, so they follow dark mode.
- **Takeover.** A menu row opens How I lead, Techniques or About onto the right two columns, like Bohdana; the work steps out and the hero stays put while the panel scrolls. A same-document view transition moves everything. Close with the Back pill at the card's top, the browser's Back, Escape, Selected work in the menu, or the card's title. The three section cards don't show until opened.
- **Smaller screens.** Tablet: the hero on the left, the work (one column) on the right. Phones: one column; a menu row opens its section right under the hero.
- **Hover.** Tiles get the cursor pill. The hero card has no mouseovers (no pills, no row dimming); keyboard focus still shows.
- **A URL per section.** `/site/` is Selected work; `/site/leadership/`, `/site/techniques/` and `/site/about/` are real pages (`src/pages/site/[section].astro`, list in `src/lib/site-sections.ts`): the home rendered with that card open, with its own title, description and canonical URL. `/site/work/` forwards to `/site/` (`legacy-urls.ts`). A menu click opens the card in place as a new history entry (`pushState`), so the browser's Back closes it and Forward opens it again. The Back pill steps back through history when the entry behind is the home, and on a section page reached directly it closes the card and adds the home's entry. The page restores scroll itself (`history.scrollRestoration = 'manual'`, a position saved per entry), because the view transition updates the page after the browser would have. A new-tab click loads the section's page. Slugs match the Framer site's paths.
- **Moving between site pages.** Clicking a tile into a closer look (or Back) is a real page load with its own URL, but it doesn't replay the intro: the leaving page stores the scene's clock in sessionStorage on `pagehide`, and `SiteHead.astro` picks it up before first paint (`html.from-site`), so the page shows at once and the scene continues where it was. A cross-document view transition keeps the hero still and morphs the home's white work page into the closer-look card (both `box-portfolio`), while the tiles fade. A reload plays the full entrance.
  The scene gets a layer of its own in that transition (named on `pageswap` in `lib/site-shell.ts` and on `pagereveal` in `SiteHead.astro`, cleared when it finishes). The new page needs a moment to boot its scene, so the last page's frame holds underneath (`scene-hold` in `site.css`) and the new scene fades in over it; then `html.scene-arrived` lets the old frame go. Without this, the background dropped to its flat color for up to half a second. A card that's on both pages crossfades on matching 300 ms curves, so it stays solid while it morphs and the scene never shows through it.
  Back and Forward usually restore the page from the browser's back/forward cache instead of loading it. The restored page's scene would resume from the moment the visitor left, so `rememberScene` (`lib/site-shell.ts`) seeks it to the clock of the page they're coming from (written on `pageswap`, which Chrome fires before the restored page's `pageshow`; `pagehide` comes too late there). Chrome also replays the hover of the click that left (pill, hover styles) at the old pointer spot, so `Pill.astro` clears hover on a restore and keeps it off (`html.hover-paused`) until the mouse really moves.
- **Techniques (open).** Its articles as tiles, each linking to its page.
- **Case-study thumbnails.** `public/site/work/thumbs/tile-<id>.webp` (from 2026 Portfolio › Case Studies › "Selected work thumbnails (from the coded site)", `4158:5170`) are still each case study's `image` in `site.json` and the tiles' fallback. Before any export, check for dates and for brand names in Buying Club club, cart or order views (mask those in the export, not in Figma); brands outside the paywall are approved.
- **How I lead (open).** The stats, then each practice beside its evidence: what happened, by company, with a link to the case study or technique where there is one. The jobs themselves are listed once, on About.
- **A closer look (`/site/work/<slug>/`).** All six: Designing for Trust, Agentic Design System, Surfacing Value, Crushing the Basics, StackScore, and Buying Club as a shorter brief (one figure of pre-login onboarding screens, since club and product views show supplement brands; the shelf diagnosis stays for the call). Figures are Figma Case Studies slide panels in `public/site/work/<slug>/`, checked by OCR for dates and placeholder text. SuppCo pages use the original slides with colleagues' names and dates masked, internal metrics blurred, and call-only numbers off. The public, ungated version of a case study, in the site's shell (`components/site/CloserLook.astro`): the hero on the left, the work as an open card. A sticky Back link at the top (Bohdana) returns to Selected work (the home), through history when that's where the visitor came from (so it comes back exactly as left), otherwise as a link; Escape does the same. Once the visitor scrolls, the hero steps out and the card takes the whole width (after luzcas.com/batch): the text column holds still and the figures grow; a switch beside Back overrides it. Keep to the problem in public terms, my role, the key decisions with their artifacts, what shipped and what I learned, plus at most the one public-safe result line from the facts sheet. Call-only numbers, internal tools, colleagues' details and dates stay off. First one: Designing for Trust.
- **Leadership.** Built only from the facts sheet's public-safe management lines.
- **Techniques articles (`/site/techniques/<slug>/`).** The four live articles (Integrity Compass, Vibeframing, Design Dojo, Haptic patterns), ported from the Framer CMS as Markdown in `src/content/techniques/` and rendered by `pages/site/techniques/[slug].astro` in the closer-look shell (eyebrow "Techniques", morphing out of the Techniques card). Front matter holds the short title, the original long title as the subtitle, the description, the panel icon and the hero image; images live in `public/site/techniques/<slug>/`. No dates. The Techniques card and panel link here, same tab.
- **Old Framer URLs keep working.** `/about`, `/techniques` and the four article slugs are the same paths here, and `/work` forwards to the home (Selected work leads it). Everything else the Framer site had (the passcode case studies, `/contact`, the retired and drafted posts) is listed in `src/lib/legacy-urls.ts` with its new home, and `pages/site/[...legacy].astro` generates a small page at each old path that forwards at once (meta refresh plus `location.replace`, a canonical link, noindex). Folded pages land on their section: Battery on `#battery` in Crushing the Basics, Call-and-Response on `#related` in StackScore. At the cutover the same map works from `/` once `SITE_BASE` changes.
- **For search and answer engines (`lib/schema.ts`, `lib/site-sections.ts`).** Every page carries one JSON-LD block: the Person (a stable `@id` shared with the bento, profiles in `sameAs`), the WebSite, and what the page is (CollectionPage with an item list for Selected work and Techniques, ProfilePage for About, an Article plus breadcrumbs for each closer look and article). A section's own page makes its open card's title the H1. Closer looks and articles share their own 1200 × 630 image (`npm run og:pages` → `public/site/og/`) as `og:type article`. `/site/llms.txt`, `/site/sitemap.xml`, `/site/robots.txt` and a Markdown copy of each article (`/site/techniques/<slug>.md`) are generated from the same content, drafts left out. **For www:** `npm run build:www` (see Deploy) makes the root-level copy: canonicals, structured data, the sitemap, robots.txt and llms.txt point at www.andydetskas.com, `noindex` is off, and the 404 is at the root.
- **Dark mode.** Theme is Light by default (Andy's call); in Display settings the visitor can pick Dark, or System setting to follow the device (`prefers-color-scheme`). Dark sets `data-mode="dark"` on `<html>`, so the semantic tokens switch (`tokens.css`; the card is the Taos Style Guide's dark surface, Shadow 600), and the scene and the page behind it switch to Adobe Night (`presets.ts`, also in the lab): dark-ramp Adobe face colors on the dark page color (True Black 300), with near-black walls, at the light scene's opacity. `SiteHead` decides before first paint and hands the scene its palette (`window.__scenePalette`), so nothing paints light first; with System setting, it follows the device live. The thumbnails and figures stay as they are, lit panels on the dark cards.
- **"Schedule a call" goes through `/site/call/`** (`CALL_PATH`), a small page that forwards to the booking calendar after it loads, so each click counts as a visit in the site's analytics (Cloudflare Web Analytics after the cutover; no Google Analytics). llms.txt keeps the direct calendar link for agents.
- **Display settings.** A row on the hero ("Display settings") opens a native modal `<dialog>` (`components/site/DisplaySettings.astro`, rendered once per page beside the Pill): theme (Light, Dark or System setting), text size, a readable typeface (Atkinson Hyperlegible), WCAG 1.4.12 text spacing, high contrast, highlighted links and focus, motion, and the background (animated, paused or off). Four presets set a few options at once and stay adjustable; pressing one again undoes it. Each choice is a data attribute on `<html>` styled at the end of `site.css`; `lib/display-settings.ts` saves the non-defaults in localStorage (`ad_display`), and `SiteHead.astro` applies them before first paint. Motion follows the system's reduced-motion setting unless turned off here (`motionReduced()`), and "Paused" holds the scene with `shapeField.setPaused()`. It avoids the overlay-widget mistakes on purpose: no screen-reader mode, no single-key shortcuts, nothing that claims to make the site compliant. Fixed pixel font sizes are written `calc(Npx * var(--text-scale, 1))` so they scale too.
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
- Wrap and edge fade: the field is periodic in y, so a glyph that drifts off the top comes back at the bottom. The wrap is centered on the middle of the view (the engine passes it to `view()`; the composition shift and the roll move it off the origin), and each glyph fades into the background over the last ~1 unit before the seam and back in after it (`uFade` in `facet.ts`). Without that, glyphs popped in at the lower left on desktop.
- Readable faces: `tumble` can swing a glyph past 90°, and near the edges of the view the camera already sees glyphs up to ~30° off-axis, so some turned edge-on or showed their mirrored back. Measured against the line of sight to the camera, a face now turns freely to about 43° and eases toward 60°, never past it (`FACE_KNEE`/`FACE_MAX` in `glyphs.ts`).
- Opacity (`params.opacity`, the lab's Opacity slider; missing = 1): dials the whole field down by mixing every form toward the background color, in display (sRGB) values, so a number here matches a Figma or CSS layer at the same opacity. It's a mix, not real transparency, so walls never show through faces. At 1 the shader skips it.
- `layout`: `scatter` (default; each glyph drifts at its own speed, so the field loosens and clumps over time), `grid` (even rows and columns) or `checker` (alternate squares). Grid and checker drift as one sheet, so the spacing stays even. Neighbours avoid repeating an icon or face color, and `jitter` (0–1) loosens the lattice. Count runs about twice as dense in grid and checker.

## Deploy

`.github/workflows/deploy.yml` builds on every push (Node from `.nvmrc`, `npm ci`, `npm run build`) and deploys `dist/` to GitHub Pages from `main` only. Branch pushes are a build check.

**www.andydetskas.com (Cloudflare Workers, static assets).** `npm run build:www` writes `dist-www/` (`scripts/build-www.mjs`). `SITE_BASE` is fixed at `/site/` and the content links are written that way, so the script builds with `PUBLIC_SITE_ORIGIN` set (that turns `noindex` off), promotes `/site/**` to the root, rewrites `/site/` to `/` in every text file, and writes `_redirects` with real 301s for the old Framer URLs from `src/lib/legacy-urls.ts`. It then checks the result (no `/site/` left, no `noindex`, canonicals on www, every internal link resolves) and fails the build if anything is off. Andy set it up as a Worker named `site` (the bento stays on GitHub Pages) (Cloudflare now steers new projects there instead of Pages); `wrangler.jsonc` points it at `dist-www/` and serves `404.html` for unknown URLs. Workers Builds settings: production branch `main`, build command `npm run build:www`, deploy command `npx wrangler deploy`, and `npx wrangler preview` for other branches, which gives `site` a preview at `site-site.andydetskas.workers.dev`. No environment variables; Node comes from `.nvmrc`. Preview it locally with the `www` entry in `.claude/launch.json` (port 4330). Analytics are Cloudflare Web Analytics, turned on for the domain in Cloudflare's Web Analytics once it is proxied (no snippet in the code). The same push to `main` still deploys the bento, with its `noindex` copy of the site under `/site/`, to GitHub Pages.

To launch the bento redesign:

1. Settings → Pages → Source: switch from "Deploy from a branch" to **GitHub Actions**. Do this at merge time: once it's switched, pushes to the current `main` (plain HTML) no longer publish.
2. Merge `redesign` → `main`. The push to `main` runs the deploy.
3. Check https://links.andydetskas.com. The custom domain and HTTPS are Pages settings and carry over.

HTTPS is enforced (Let's Encrypt certificate, valid to Feb 3, 2027).

## Open before shipping

- **Fonts.** DM Sans/DM Mono are free to ship. Apercu would need a web license: the only purchase on record is a Fontdeck hosted subscription (2014–15), and Fontdeck no longer exists.
- `legacy-index.html` is the previous single-file site, kept for reference until launch.
