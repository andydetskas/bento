// Captures the figures for the Glyph lab and Display settings articles from the running dev server
// (`npm run dev`), in headless Chrome, and writes webp files under public/site/techniques/<slug>/.
//   node scripts/shots.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4321';
const W = 1440, H = 900;
const click = (sel) => `document.querySelector(${JSON.stringify(sel)}).click()`;
const pick = (name, value) => click(`#display-settings input[name="${name}"][value="${value}"]`);

const shots = [
  { out: 'glyph-lab/lab-glyphs', url: '/lab', steps: [] },
  { out: 'glyph-lab/lab-ridgeline', url: '/lab', steps: [click('[data-family="ridgeline"]')] },
  { out: 'display-settings/panel', url: '/site/', steps: [click('[data-display-open]')] },
  { out: 'display-settings/preset-low-vision', url: '/site/', steps: [click('[data-display-open]'), click('[data-preset="low-vision"]')] },
  { out: 'display-settings/dark', url: '/site/', steps: [click('[data-display-open]'), pick('theme', 'dark')] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'shots-chrome-'));
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank',
], { stdio: 'ignore' });

try {
  let info;
  for (let i = 0; i < 50 && !info; i++) { await sleep(100); info = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch(() => null); }
  for (const shot of shots) {
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0; const pending = new Map(); const waiters = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
      else if (msg.method) for (const w of waiters) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.res(msg.params); break; }
    });
    const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
    const once = (method) => new Promise((res) => waiters.push({ method, res }));
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false });
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: ORIGIN + shot.url });
    await loaded;
    await sleep(4000); // the scene's grow-in
    for (const step of shot.steps) {
      const r = await send('Runtime.evaluate', { expression: step });
      if (r.exceptionDetails) throw new Error(`${shot.out}: ${step}: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
      await sleep(2500);
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = resolve(`public/site/techniques/${shot.out}.webp`);
    mkdirSync(resolve(file, '..'), { recursive: true });
    const meta = await sharp(Buffer.from(data, 'base64')).resize({ width: 1600 }).webp({ quality: 82 }).toFile(file);
    console.log(`${shot.out}.webp ${meta.width}x${meta.height} ${Math.round(meta.size / 1024)} KB`);
    await send('Runtime.evaluate', { expression: 'localStorage.clear()' }); // each shot starts from the defaults
    await send('Page.close').catch(() => {});
    ws.close();
  }
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
