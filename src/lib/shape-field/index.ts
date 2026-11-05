// shape-field: the generative 3D background.
// Framework-free on purpose: the Astro component wraps it today, and a thin React wrapper
// can make it a Framer code component later. Everything visual comes from a Preset.
import * as THREE from 'three';
import type { Preset, ScenePalette, SceneParams } from '../presets';
import { glyphs } from './families/glyphs';
import { petal } from './families/petal';
import { pueblo } from './families/pueblo';
import { ridgeline } from './families/ridgeline';
import type { Family, FamilyInstance, SharedUniforms } from './types';
import { deg, mulberry32, settle, TweenColor } from './util';

export const families: Record<Preset['family'], Family> = { pueblo, ridgeline, petal, glyphs };

export interface ShapeField {
  readonly preset: Preset;
  setPreset(preset: Preset): void;
  setPalette(palette: ScenePalette): void;
  setParam<K extends keyof SceneParams>(key: K, value: SceneParams[K]): void;
  /** Tint the scene toward a link's accent (only in presets with sceneAccent). null clears it. */
  setAccent(hex: string | null): void;
  /** Shift the composition: x as a fraction of width (positive = right), y of height (positive = up). */
  setFocus(x: number, y?: number): void;
  /** PNG of the scene at the given pixel ratio. */
  snapshot(pixelRatio?: number): Promise<Blob | null>;
  /** Step the scene forward by `seconds` and render once (posters, tests, background tabs). */
  advance(seconds: number): void;
  destroy(): void;
}

export interface ShapeFieldOptions {
  reducedMotion?: boolean;
  maxPixelRatio?: number;
  onFirstFrame?: () => void;
}

const REBUILD_KEYS: (keyof SceneParams)[] = ['density', 'seed', 'depth', 'spread'];
const sameList = (a?: string[], b?: string[]) => (a ?? []).join() === (b ?? []).join();

export function createShapeField(canvas: HTMLCanvasElement, initial: Preset, opts: ShapeFieldOptions = {}): ShapeField | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch {
    return null; // No WebGL: the page keeps its flat background color.
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxPR = opts.maxPixelRatio ?? 1.5;
  const basePR = () => Math.min(window.devicePixelRatio || 1, maxPR);
  renderer.setPixelRatio(basePR());

  const reduced = opts.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let preset: Preset = structuredClone(initial);

  const scene = new THREE.Scene();
  const bg = new TweenColor(preset.palette.bg);
  scene.background = bg.value;

  const accent = new TweenColor('#000000');
  const shared: SharedUniforms = {
    uLightDir: { value: new THREE.Vector3(1, 0.6, 0) },
    uAccent: { value: accent.value },
    uAccentAmt: { value: 0 },
    uTime: { value: 0 },
  };
  let accentTarget = 0;

  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  const persp = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  let camera: THREE.OrthographicCamera | THREE.PerspectiveCamera = ortho;

  let family: Family = families[preset.family];
  let inst: FamilyInstance | null = null;
  let width = 1;
  let height = 1;
  let focusX = 0;
  let focusY = 0;
  let t = 0;
  let dirty = 2; // frames to render even when nothing moves
  let raf = 0;
  let last = performance.now();
  let firstFrame = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function setLight() {
    const a = deg(preset.params.light);
    shared.uLightDir.value.set(Math.cos(a), 0.6, Math.sin(a)).normalize();
  }

  function build() {
    if (inst) {
      scene.remove(inst.root);
      inst.dispose();
    }
    family = families[preset.family];
    inst = family.build({ params: preset.params, palette: preset.palette, rng: mulberry32(preset.params.seed), shared, glyphs: preset.glyphs });
    scene.add(inst.root);
    t = 0;
    if (reduced) {
      // Static frame: jump straight to a settled state.
      t = 12;
      inst.update(t, t, t, preset.params);
    }
    dirty = 120;
  }

  const dir = new THREE.Vector3();
  function layoutCamera() {
    if (!inst) return;
    const aspect = width / height;
    const tilt = deg(preset.params.tilt);
    // Frame a rectangle big enough to cover the shifted view, then crop back to the viewport.
    const growX = 1 + 2 * Math.abs(focusX);
    const growY = 1 + 2 * Math.abs(focusY);
    const halfH = inst.fit((aspect * growX) / growY, tilt) / growY / preset.params.scale;
    const az = deg(family.camera.az) + pointer.x * 0.04;
    const el = deg(family.camera.el) + pointer.y * 0.03;
    dir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    if (family.camera.type === 'ortho') {
      ortho.left = -halfH * aspect;
      ortho.right = halfH * aspect;
      ortho.top = halfH;
      ortho.bottom = -halfH;
      ortho.position.copy(dir).multiplyScalar(150);
      camera = ortho;
    } else {
      const fov = family.camera.fov ?? 30;
      const dist = halfH / Math.tan(deg(fov) / 2);
      persp.fov = fov;
      persp.aspect = aspect;
      persp.near = dist * 0.05;
      persp.far = dist * 20;
      persp.position.copy(dir).multiplyScalar(dist);
      camera = persp;
    }
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.rotateZ(tilt);
    camera.setViewOffset(width, height, -focusX * width, focusY * height, width, height);
    camera.updateProjectionMatrix();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    dirty = Math.max(dirty, 2);
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dtReal = Math.min((now - last) / 1000, 0.1);
    last = now;
    const moving = !reduced && preset.params.speed > 0;
    const dt = moving ? dtReal * preset.params.speed : 0;
    t += dt;
    shared.uTime.value = t;

    const k = settle(dtReal, 6);
    bg.step(k);
    accent.step(k);
    shared.uAccentAmt.value += (accentTarget - shared.uAccentAmt.value) * settle(dtReal, 5);
    pointer.x += (pointer.tx - pointer.x) * settle(dtReal, 2.5);
    pointer.y += (pointer.ty - pointer.y) * settle(dtReal, 2.5);

    inst?.update(t, dt, dtReal, preset.params);
    if (moving || dirty > 0) {
      layoutCamera();
      renderer.render(scene, camera);
      dirty = Math.max(0, dirty - 1);
      if (firstFrame) {
        firstFrame = false;
        opts.onFirstFrame?.();
      }
    }
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  const onVisibility = () => (document.hidden ? stop() : start());
  const onPointer = (e: PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse') return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    dirty = Math.max(dirty, 60);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointermove', onPointer, { passive: true });

  setLight();
  resize();
  build();
  start();

  return {
    get preset() {
      return structuredClone(preset);
    },
    setPreset(next) {
      const prev = preset;
      preset = structuredClone(next);
      bg.set(preset.palette.bg);
      setLight();
      const rebuild =
        prev.family !== preset.family ||
        REBUILD_KEYS.some((key) => prev.params[key] !== preset.params[key]) ||
        !sameList(prev.glyphs, preset.glyphs);
      if (rebuild) build();
      else inst?.setPalette(preset.palette);
      if (!preset.sceneAccent) accentTarget = 0;
      dirty = 120;
    },
    setPalette(palette) {
      preset.palette = structuredClone(palette);
      bg.set(palette.bg);
      inst?.setPalette(palette);
      dirty = 120;
    },
    setParam(key, value) {
      preset.params[key] = value;
      if (REBUILD_KEYS.includes(key)) build();
      if (key === 'light') setLight();
      if (key === 'tint' && accentTarget > 0) accentTarget = Number(value);
      dirty = Math.max(dirty, 30);
    },
    setAccent(hex) {
      if (hex && preset.sceneAccent) {
        accent.set(hex);
        if (shared.uAccentAmt.value < 0.02) accent.jump(hex);
        accentTarget = preset.params.tint ?? 0.85;
      } else {
        accentTarget = 0;
      }
      dirty = 90;
    },
    setFocus(x, y = 0) {
      focusX = x;
      focusY = y;
      dirty = Math.max(dirty, 2);
    },
    async snapshot(pixelRatio = 2) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      layoutCamera();
      renderer.render(scene, camera);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      renderer.setPixelRatio(basePR());
      renderer.setSize(width, height, false);
      dirty = 2;
      return blob;
    },
    advance(seconds) {
      const step = 1 / 30;
      for (let s = 0; s < seconds; s += step) {
        t += step;
        shared.uTime.value = t;
        bg.step(settle(step, 6));
        accent.step(settle(step, 6));
        shared.uAccentAmt.value += (accentTarget - shared.uAccentAmt.value) * settle(step, 5);
        inst?.update(t, step, step, preset.params);
      }
      layoutCamera();
      renderer.render(scene, camera);
    },
    destroy() {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      if (inst) {
        scene.remove(inst.root);
        inst.dispose();
      }
      renderer.dispose();
    },
  };
}
