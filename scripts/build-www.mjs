// Builds the main site for www.andydetskas.com (Cloudflare Pages): `npm run build:www` → dist-www/.
//
// The repo's normal build serves the bento at / and the site under /site/ (links.andydetskas.com,
// GitHub Pages). The site's pages live in src/pages/site/ and its content links are written as
// /site/…, so this script makes the root-level copy instead of moving everything:
//   1. astro build with PUBLIC_SITE_ORIGIN set. That turns noindex off (SITE_LIVE) and points
//      canonicals, structured data, the sitemap, robots.txt and llms.txt at the www origin.
//   2. Promote /site/** to the root (and /site/404/ to /404.html), keep /_astro and the
//      root icons, and leave the bento's own pages and CNAME out.
//   3. Rewrite /site/ → / in every text file.
//   4. Write _redirects: real 301s for the old Framer URLs (src/lib/legacy-urls.ts), replacing the
//      meta-refresh pages GitHub Pages needed.
//   5. Check it: no /site/ left, no noindex on real pages, and every internal link and image
//      resolves to a file. Exits 1 if any check fails, so a bad build never deploys.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';

const ORIGIN = process.env.PUBLIC_SITE_ORIGIN || 'https://www.andydetskas.com';
const RAW = '.www-build';
const OUT = 'dist-www';
const TEXT = new Set(['.html', '.xml', '.txt', '.md', '.js', '.mjs', '.css', '.json', '.webmanifest']);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// 1. Build
rmSync(RAW, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
execSync('npm run tokens', { stdio: 'inherit' });
execSync(`npx astro build --outDir ${RAW}`, { stdio: 'inherit', env: { ...process.env, PUBLIC_SITE_ORIGIN: ORIGIN } });

// 2. Assemble
cpSync(join(RAW, 'site'), OUT, { recursive: true });
cpSync(join(RAW, '_astro'), join(OUT, '_astro'), { recursive: true });
for (const n of readdirSync(RAW)) {
  const p = join(RAW, n);
  if (statSync(p).isFile() && extname(n) !== '.html' && n !== 'CNAME') cpSync(p, join(OUT, n));
}

// Astro only writes a top-level 404.html for src/pages/404.astro; the site's is one folder down.
if (existsSync(join(OUT, '404', 'index.html'))) {
  cpSync(join(OUT, '404', 'index.html'), join(OUT, '404.html'));
  rmSync(join(OUT, '404'), { recursive: true });
}

// The old-URL map, read from the TypeScript source ('from': 'to', or a bare key).
const legacy = [...readFileSync('src/lib/legacy-urls.ts', 'utf8').matchAll(/^\s*(?:'([^']+)'|([\w-]+)):\s*'([^']*)',/gm)].map((m) => [m[1] ?? m[2], m[3]]);
if (legacy.length < 20) throw new Error(`Only ${legacy.length} legacy redirects parsed from src/lib/legacy-urls.ts`);
// Their meta-refresh pages aren't needed here.
for (const [from] of legacy) {
  const dir = join(OUT, from);
  rmSync(join(dir, 'index.html'), { force: true });
  if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

// 3. Rewrite /site/ → /
let rewritten = 0;
for (const f of walk(OUT)) {
  if (!TEXT.has(extname(f))) continue;
  const s = readFileSync(f, 'utf8');
  if (!s.includes('/site/')) continue;
  writeFileSync(f, s.replaceAll('/site/', '/'));
  rewritten++;
}

// 4. Redirects. Each old path with and without its trailing slash (Cloudflare matches exactly),
//    then anything still pointing at the prototype's /site/ address.
const lines = ['# Old Framer URLs → their new homes (from src/lib/legacy-urls.ts). Written by scripts/build-www.mjs.'];
for (const [from, to] of legacy) {
  lines.push(`/${from} /${to} 301`, `/${from}/ /${to} 301`);
}
// Framer's URLs had no trailing slash (/about, /techniques/vibeframing). Cloudflare would send
// those on with a temporary 307; say it's permanent so search engines move the old address over.
lines.push('', '# Pages without their trailing slash.');
for (const f of walk(OUT)) {
  if (!f.endsWith('/index.html') || f === join(OUT, 'index.html')) continue;
  const path = '/' + dirname(f).slice(OUT.length + 1);
  lines.push(`${path} ${path}/ 301`);
}
lines.push('', '# The prototype lived under /site/.', '/site / 301', '/site/* /:splat 301');
writeFileSync(join(OUT, '_redirects'), lines.join('\n') + '\n');

// 5. Checks
const problems = [];
const redirected = new Set(legacy.flatMap(([from]) => [`/${from}`, `/${from}/`]));
const html = walk(OUT).filter((f) => f.endsWith('.html'));
for (const f of walk(OUT)) {
  if (TEXT.has(extname(f)) && readFileSync(f, 'utf8').includes('/site/')) problems.push(`/site/ still in ${f}`);
}
const resolves = (path) => {
  const p = join(OUT, decodeURIComponent(path));
  return (existsSync(p) && statSync(p).isFile()) || existsSync(join(p, 'index.html'));
};
let links = 0;
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  const page = '/' + f.slice(OUT.length + 1);
  const forwarder = /http-equiv="refresh"/.test(s); // /call/ only
  if (/<meta name="robots" content="noindex/.test(s) && !forwarder && page !== '/404.html') problems.push(`noindex on ${page}`);
  if (!forwarder && page !== '/404.html' && !s.includes(`<link rel="canonical" href="${ORIGIN}/`)) problems.push(`canonical not on ${ORIGIN}: ${page}`);
  for (const m of s.matchAll(/(?:href|src|poster)="(\/[^"#?]*)[^"]*"/g)) {
    const path = m[1];
    if (path.startsWith('//') || redirected.has(path)) continue;
    links++;
    if (!resolves(path)) problems.push(`${page} → ${path} (missing)`);
  }
}
for (const need of ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'llms.txt', '_redirects']) {
  if (!existsSync(join(OUT, need))) problems.push(`missing ${need}`);
}
for (const f of ['sitemap.xml', 'robots.txt', 'llms.txt']) {
  const p = join(OUT, f);
  if (existsSync(p) && !readFileSync(p, 'utf8').includes(ORIGIN)) problems.push(`${f} does not mention ${ORIGIN}`);
}

rmSync(RAW, { recursive: true, force: true });
console.log(`\n${OUT}/: ${html.length} pages, ${lines.filter((l) => l.startsWith('/')).length} redirects, ${rewritten} files rewritten, ${links} internal links checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ` + [...new Set(problems)].slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('All checks passed.');
