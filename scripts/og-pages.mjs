// Share images for the site's detail pages: public/site/og/<section>-<slug>.jpg, 1200 × 630.
// Each closer look's hero figure (its first eager image), or each Techniques article's hero,
// centered on that work's tint. CloserLook.astro picks the file up by path; re-run after a
// hero changes:  npm run og:pages
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

sharp.cache(false);
const root = process.cwd();
const site = JSON.parse(readFileSync(join(root, 'src/content/site.json'), 'utf8'));
const tokensSrc = readFileSync(join(root, 'src/lib/tokens.ts'), 'utf8');
const tokens = JSON.parse(tokensSrc.slice(tokensSrc.indexOf('{'), tokensSrc.lastIndexOf('}') + 1));
const light = tokens.taos.light;
const out = join(root, 'public/site/og');
mkdirSync(out, { recursive: true });

const W = 1200, H = 630, PAD = 48;
async function make(name, src, bg) {
  const file = join(root, 'public', src);
  if (!existsSync(file)) return console.warn('missing', src);
  const fig = await sharp(file).resize({ width: W - PAD * 2, height: H - PAD * 2, fit: 'inside' }).toBuffer();
  const m = await sharp(fig).metadata();
  await sharp({ create: { width: W, height: H, channels: 3, background: bg } })
    .composite([{ input: fig, left: Math.round((W - m.width) / 2), top: Math.round((H - m.height) / 2) }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(join(out, `${name}.jpg`));
  console.log(`site/og/${name}.jpg  ←  ${src}`);
}

// Closer looks: the first eager figure on each page, on the work's tint.
for (const f of readdirSync(join(root, 'src/pages/site/work')).filter((f) => f.endsWith('.astro'))) {
  const slug = f.replace('.astro', '');
  const page = readFileSync(join(root, 'src/pages/site/work', f), 'utf8');
  const hero = page.match(/img\('([^']+)'\)[^>]*loading="eager"/)?.[1];
  const w = site.work.find((x) => x.id === slug);
  if (!hero || !w) continue;
  await make(`work-${slug}`, `/site/work/${slug}/${hero}.webp`, light[w.tint[0]][w.tint[1]]);
}
// Techniques articles: the hero from front matter, on the site's cream.
for (const f of readdirSync(join(root, 'src/content/techniques')).filter((f) => f.endsWith('.md'))) {
  const hero = readFileSync(join(root, 'src/content/techniques', f), 'utf8').match(/^hero:\s*"([^"]+)"/m)?.[1];
  if (hero) await make(`techniques-${f.replace('.md', '')}`, hero, '#F6F2EC');
}
