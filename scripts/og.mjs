// Captures the share image: renders /og (1200×630) in headless Chrome at 2x and writes
// public/og.png. Needs the dev server running (`npm run dev`) and Google Chrome installed.
//   npm run og
//   OG_URL=http://localhost:4321/og CHROME=/path/to/chrome npm run og
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = new URL(process.env.OG_URL ?? 'http://localhost:4321/og');
url.searchParams.set('settle', '6'); // render a finished frame, no intro animation
const out = resolve('public/og.png');
const profile = mkdtempSync(join(tmpdir(), 'og-chrome-'));

try {
  execFileSync(
    chrome,
    [
      '--headless=new',
      `--user-data-dir=${profile}`,
      '--use-angle=swiftshader', // software WebGL, so the capture doesn't depend on the GPU
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--window-size=1200,630',
      '--force-device-scale-factor=2',
      '--virtual-time-budget=8000',
      `--screenshot=${out}`,
      url.href,
    ],
    { stdio: 'ignore' },
  );
} finally {
  rmSync(profile, { recursive: true, force: true });
}

console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB) from ${url.href}`);
