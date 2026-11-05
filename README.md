# bento: links.andydetskas.com

A link card over a generative 3D background. It is also the first build of the **Taos** design system that may replace the Framer site. The chosen direction is **Glyphs**: Taos icons extruded into 3D tokens.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321  (tokens rebuild first)
```

- `/`: the page. `/?palette=earth` previews a named Glyphs palette. `/?preset=ridgeline-color` previews any scene preset.
- `/lab`: the customizer. Sections: Scene, Palette, Glyphs, Shape, Motion & light, Card & type.
  - Click any swatch to pick a Taos color.
  - Tweaks persist on reload. **H** hides the panel, **G** toggles the baseline grid.
- `?settle=6` on either page renders a finished frame immediately (for captures and share images).

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
| 3D engine | `src/lib/shape-field/` | Framework-free Three.js. `createShapeField(canvas, preset)` returns `{ setPreset, setPalette, setParam, setAccent, setFocus, snapshot, advance, destroy }`. Families: `glyphs`, `pueblo`, `ridgeline`, `petal`. |
| Components | `src/components/` | `LinkCard`, `ShapeField`, `Icon`. |

Pages talk to the scene through two DOM events: `bento:accent` (hover tint) and `bento:preset` (switch concept).

## Glyphs palette model

- `colors`: 1–8 face colors. Each glyph takes one at random, spread evenly.
- `extrusion`: the side walls. The default is **True Black 80%** (Taos True Black 500, `#323131`). `contrast` darkens the shaded side.
- Hovering a link tints every face toward that link's accent. The strength is set by `tint`.

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
