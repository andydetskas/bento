// @ts-check
import { defineConfig } from 'astro/config';

// Static output for GitHub Pages (custom domain via public/CNAME).
export default defineConfig({
  site: 'https://links.andydetskas.com',
  output: 'static',
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
});
