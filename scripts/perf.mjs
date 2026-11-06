// Performance check for the bento, in headless Chrome over CDP. Emulates phones (viewport, DPR,
// touch, CPU throttle, slow 4G) and a desktop. Reports load timings, long tasks (anything that
// would hold up a tap), JS time per frame, frame intervals, and WebGL draw calls and triangles.
// It can't slow the GPU, so treat draws/triangles as the GPU-cost signal.
//   npm run build && npm run preview     (in another terminal)
//   npm run perf                          → load + steady-state table
//   npm run perf -- --runs=3 --only=phone-mid,phone-low
//   npm run perf -- --touch               → tap a row (phones) / hover + Tab (desktop), print row state
//   npm run perf -- --swiftshader         → software WebGL (slower, steadier between machines)
//   PERF_URL=https://links.andydetskas.com/ npm run perf
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) ?? process.env.PERF_URL ?? 'http://localhost:4321/';
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d}`).split('=')[1];
const RUNS = Number(opt('runs', 1));
const ONLY = opt('only', '');
const SWIFT = args.includes('--swiftshader');
const SAMPLE_MS = Number(opt('sample', 6000));
const TOUCH = args.includes('--touch');

const SLOW_4G = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const scenarios = [
  { name: 'phone-mid', width: 390, height: 844, dpr: 3, mobile: true, cpu: 4, net: SLOW_4G },
  { name: 'phone-low', width: 360, height: 780, dpr: 2, mobile: true, cpu: 6, net: SLOW_4G },
  { name: 'desktop', width: 1440, height: 900, dpr: 2, mobile: false, cpu: 1, net: null },
].filter((s) => !ONLY || ONLY.split(',').includes(s.name));

const instrument = `(() => {
  const P = (window.__perf = { longTasks: [], frames: [], recording: false, draws: 0, tris: 0, firstDraw: null, ready: null, fcp: null, lcp: null, gl: null });
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => P.longTasks.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (P.lcp = e.startTime))).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === 'first-contentful-paint' && (P.fcp = e.startTime))).observe({ type: 'paint', buffered: true });
  } catch {}
  document.addEventListener('shapefield:ready', () => (P.ready = performance.now()));
  const hit = (tris) => { P.draws++; P.tris += tris; if (P.firstDraw == null) P.firstDraw = performance.now(); };
  const wrap = (gl) => {
    if (!gl || gl.__wrapped) return gl;
    gl.__wrapped = true;
    try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); P.gl = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch {}
    const de = gl.drawElements.bind(gl), da = gl.drawArrays.bind(gl);
    gl.drawElements = (m, c, t, o) => (hit(c / 3), de(m, c, t, o));
    gl.drawArrays = (m, f, c) => (hit(c / 3), da(m, f, c));
    if (gl.drawElementsInstanced) { const f = gl.drawElementsInstanced.bind(gl); gl.drawElementsInstanced = (m, c, t, o, n) => (hit((c / 3) * n), f(m, c, t, o, n)); }
    if (gl.drawArraysInstanced) { const f = gl.drawArraysInstanced.bind(gl); gl.drawArraysInstanced = (m, a, c, n) => (hit((c / 3) * n), f(m, a, c, n)); }
    return gl;
  };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) { const ctx = gc.call(this, type, ...rest); return /webgl/.test(type) ? wrap(ctx) : ctx; };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => {
    const t0 = performance.now(), d0 = P.draws, r0 = P.tris;
    cb(ts);
    if (P.recording) P.frames.push([ts, performance.now() - t0, P.draws - d0, P.tris - r0]);
  });
})();`;

const collect = `(() => {
  const P = window.__perf;
  const res = performance.getEntriesByType('resource');
  const nav = performance.getEntriesByType('navigation')[0];
  const bytes = res.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav?.transferSize || 0);
  const three = res.find((r) => /\\/_astro\\/index\\.[\\w-]{8}\\.js$/.test(r.name));
  const c = document.querySelector('canvas.scene');
  return JSON.stringify({ ...P, bytes, threeEnd: three?.responseEnd ?? null, canvas: c ? [c.width, c.height] : null, live: c?.classList.contains('is-live') });
})()`;



const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : NaN; };
const r1 = (n) => (n == null || Number.isNaN(n) ? '–' : Math.round(n * 10) / 10);

async function main() {
  const profile = mkdtempSync(join(tmpdir(), 'perf-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    ...(SWIFT ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
    'about:blank',
  ], { stdio: 'ignore' });
  try {
    let info;
    for (let i = 0; i < 50 && !info; i++) {
      await new Promise((r) => setTimeout(r, 100));
      info = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch(() => null);
    }
    const results = [];
    for (const sc of scenarios) {
      for (let run = 0; run < RUNS; run++) results.push({ sc: sc.name, run, ...(await measure(port, sc)) });
    }
    report(results);
  } finally {
    chrome.kill();
    await new Promise((r) => setTimeout(r, 300));
    rmSync(profile, { recursive: true, force: true });
  }
}

async function measure(port, sc) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
    else if (msg.method) for (const w of waiters) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.res(msg.params); break; }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const once = (method) => new Promise((res) => waiters.push({ method, res }));
  const evalJSON = async (expr) => JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  if (sc.net) await send('Network.emulateNetworkConditions', sc.net);
  await send('Emulation.setDeviceMetricsOverride', { width: sc.width, height: sc.height, deviceScaleFactor: sc.dpr, mobile: sc.mobile });
  if (sc.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setCPUThrottlingRate', { rate: sc.cpu });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: instrument });

  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  // Wait for the scene's first frame, then let the grow-in finish before sampling.
  for (let i = 0; i < 100; i++) { if ((await evalJSON('JSON.stringify(window.__perf.firstDraw)')) != null) break; await sleep(100); }
  await sleep(2500);

  if (TOUCH) {
    // Tap the second row (navigation blocked), then read what a returning visitor would see.
    await send('Runtime.evaluate', { expression: `window.__accents = []; document.addEventListener('bento:accent', (e) => __accents.push(e.detail.hex)); document.addEventListener('click', (e) => e.preventDefault(), true);` });
    const box = await evalJSON(`(() => { const r = document.querySelectorAll('.row')[1].getBoundingClientRect(); return JSON.stringify([r.x + r.width / 2, r.y + r.height / 2]); })()`);
    const pt = { x: box[0], y: box[1] };
    let hoverState = null;
    if (sc.mobile) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
      await sleep(80);
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      // Desktop: hover the row, read the state, then move off and Tab to the first row.
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
      await sleep(600);
      hoverState = await evalJSON(`JSON.stringify({ accents: [...__accents], opacities: [...document.querySelectorAll('.row')].map((r) => getComputedStyle(r).opacity), pill: document.querySelector('.pill')?.className + ' ' + document.querySelector('.pill')?.textContent })`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
      await sleep(300);
      await send('Runtime.evaluate', { expression: '__accents.length = 0' });
      for (let i = 0; i < 2; i++) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); }
    }
    await sleep(1200);
    const r = await evalJSON(`JSON.stringify({ accents: __accents, active: document.activeElement?.className, opacities: [...document.querySelectorAll('.row')].map((r) => getComputedStyle(r).opacity), hovered: [...document.querySelectorAll('.row')].map((r) => r.matches(':hover')), pill: document.querySelector('.pill')?.className })`);
    ws.close();
    return { touch: JSON.stringify(hoverState ? { hover: hoverState, keyboard: r } : r) };
  }
  await send('Runtime.evaluate', { expression: 'window.__perf.recording = true' });
  await sleep(SAMPLE_MS);
  const data = await evalJSON(collect);
  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});

  const frames = data.frames;
  const intervals = frames.slice(1).map((f, i) => f[0] - frames[i][0]);
  const after = (t) => data.longTasks.filter(([s]) => s >= (t ?? 0));
  const tbt = after(data.fcp).reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
  return {
    gl: data.gl,
    canvas: data.canvas?.join('×'),
    kb: Math.round(data.bytes / 1024),
    fcp: data.fcp, lcp: data.lcp, threeEnd: data.threeEnd, ready: data.ready, firstDraw: data.firstDraw,
    tbt, longest: Math.max(0, ...data.longTasks.map(([, d]) => d)), nLong: data.longTasks.length,
    longTasks: data.longTasks.map(([s, d]) => `${Math.round(s)}+${Math.round(d)}`).join(' '),
    fps: frames.length / (SAMPLE_MS / 1000),
    jsAvg: frames.reduce((s, f) => s + f[1], 0) / Math.max(1, frames.length), jsP95: pct(frames.map((f) => f[1]), 95),
    intP50: pct(intervals, 50), intP95: pct(intervals, 95), janky: intervals.filter((d) => d > 25).length,
    draws: pct(frames.map((f) => f[2]), 50), tris: pct(frames.map((f) => f[3]), 50),
  };
}

function report(rows) {
  if (TOUCH) { for (const r of rows) console.log(r.sc, r.run, r.touch); return; }
  const cols = ['sc', 'run', 'canvas', 'kb', 'fcp', 'threeEnd', 'ready', 'firstDraw', 'tbt', 'longest', 'nLong', 'fps', 'jsAvg', 'jsP95', 'intP50', 'intP95', 'janky', 'draws', 'tris'];
  console.log(`GL: ${rows[0]?.gl}`);
  console.log(cols.join('\t'));
  for (const r of rows) console.log(cols.map((c) => (typeof r[c] === 'number' ? r1(r[c]) : r[c] ?? '–')).join('\t'));
  for (const r of rows) console.log(`${r.sc}#${r.run} long tasks (start+ms): ${r.longTasks}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
