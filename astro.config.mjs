// @ts-check
import { defineConfig } from 'astro/config';

// Static output for GitHub Pages (custom domain via public/CNAME).
// ASSETS_ORIGIN: serve /_astro/ files (scripts, styles, fonts) from one origin for every page.
// The main site would load its copies from the bento's origin, so a visitor coming from the
// bento already has Three.js, the fonts and the scene code cached (the HTTP cache is shared
// per site, so links. and www. can share entries, but only for the same URL).
/** @type {string | undefined} */
const assetsOrigin = /** @type {any} */ (globalThis).process?.env?.ASSETS_ORIGIN || undefined;

export default defineConfig({
  site: 'https://links.andydetskas.com',
  output: 'static',
  build: { assetsPrefix: assetsOrigin },
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
});
