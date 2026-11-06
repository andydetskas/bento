// Two-origin preview of the bento → main site hand-off.
//   npm run handoff
// Builds once with the Portfolio link pointed at the site prototype, then serves the same build
// on two ports. Different ports are different origins (so no cross-document view transitions,
// like links. and www. in production) but the same site, and cookies ignore ports, so the
// hand-off cookie and the shared HTTP cache behave as they will on andydetskas.com.
// The server sends GitHub Pages' headers (max-age=600, CORS *), so cache behaviour matches too.
//   Bento: http://localhost:4321/        Site: http://localhost:4322/site/
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';

const LINKS = 4321;
const MAIN = 4322;
const DIST = join(process.cwd(), 'dist');

if (!process.argv.includes('--no-build')) {
  // Both pages take /_astro/ files from the bento's origin (see astro.config.mjs).
  const env = { ...process.env, PUBLIC_MAIN_URL: `http://localhost:${MAIN}/site/`, ASSETS_ORIGIN: `http://localhost:${LINKS}` };
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
};

const serve = (port) =>
  createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(DIST, path));
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end('Not found');
    const ext = extname(file);
    const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') && ['.html', '.js', '.css', '.svg', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': types[ext] ?? 'application/octet-stream',
      'Cache-Control': 'max-age=600',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept-Encoding',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
    });
    const body = createReadStream(file);
    (gzip ? body.pipe(createGzip()) : body).pipe(res);
  }).listen(port);

serve(LINKS);
serve(MAIN);
console.log(`\n  Bento  http://localhost:${LINKS}/\n  Site   http://localhost:${MAIN}/site/\n`);
