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

Node 22.14 is installed, so this uses Astro 6. Astro 7 needs Node ≥ 22.23.

## How it's built

| Layer | Where | Notes |
|---|---|---|
| Tokens | `tokens/taos.tokens.json` → `npm run tokens` → `src/styles/tokens.css`, `src/lib/tokens.ts` | W3C design-tokens format. Palette sampled from the Taos Style Guide (Figma `JrqclJqDkOD0I4oc22cnVx`). Components use the role tokens (`--color-*`), never raw palette values. |
| Type & grid | `scale`, `baseline`, `leading` in the token file | 4px baseline unit. Fluid type steps `--step--2…5` (Utopia method, built by the token script). Line-heights snap up to 4px with CSS `round()`. Spacing tokens are multiples of 4. |
| Fonts | `src/styles/global.css` | DM Sans (variable, optical sizes) + DM Mono, by Colophon Foundry, SIL OFL, self-hosted via Fontsource. `[data-font="apercu"]` swaps to a locally installed Apercu for comparison. |
| Icons | `src/icons/*.svg` | Exported from Taos, recolored to `currentColor`. One source for the inline icons and the extruded 3D glyphs. |
| Content | `src/content/links.json` | Profile + links (label, eyebrow, url, icon, tooltip). Accents live in tokens under `accent.*`. |
| Presets & palettes | `src/lib/presets.ts` | A concept is a preset: scene family + palette + params + card style. `glyphPalettes` holds the 15 named Glyphs palettes (color, earth, mono), each with its own extrusion color. Paste "Copy preset" output from the lab here. |
| 3D engine | `src/lib/shape-field/` | Framework-free Three.js. `prepareShapeField(preset)` warms up the heavy assets, then `createShapeField(canvas, preset)` returns `{ setPreset, setPalette, setParam, setAccent, setFocus, snapshot, advance, destroy }`. Families: `glyphs`, `pueblo`, `ridgeline`, `petal`. |
| Components | `src/components/` | `LinkCard`, `ShapeField`, `Icon`. |

Pages talk to the scene through two DOM events: `bento:accent` (hover tint) and `bento:preset` (switch concept).

**Start-up.** Three.js loads after first paint. `prepareShapeField(preset)` then extrudes the glyphs one per task, and the engine compiles its shaders with `compileAsync` before the first frame. That keeps the main thread free for taps while the scene loads.

Baseline (default checker preset):
- Mid-range phone (4x CPU): the longest task is about 55 ms (it was 285 ms before the split). The scene appears about 2.1 s after opening on slow 4G.
- Low-end phone (6x CPU): the longest task is about 85 ms (was 427 ms).
- While it runs: about 0.4 ms of JS per frame, a steady 60 fps, 12 draw calls and 66k triangles per frame on a phone. The camera only sees about a dozen of the ~90 glyphs, and the rest are culled.

**Touch.** Taps get no tooltip, no scene tint and no row dimming. Hover styles sit behind `@media (hover: hover)`, and the tint follows keyboard focus (`:focus-visible`) only.

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
