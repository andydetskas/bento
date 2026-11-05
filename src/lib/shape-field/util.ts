import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const deg = (d: number) => (d * Math.PI) / 180;
/** Frame-rate independent smoothing factor: "fast in, long settle". */
export const settle = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);

/** Small, fast, seedable PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** 2D value noise in [0, 1]. */
export function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

export function fbm(x: number, y: number, octaves = 3) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** A color that eases toward a target. The `value` object is safe to hand to a uniform. */
export class TweenColor {
  readonly value = new THREE.Color();
  readonly target = new THREE.Color();
  constructor(hex: string) {
    this.value.set(hex);
    this.target.set(hex);
  }
  set(hex: string) {
    this.target.set(hex);
  }
  jump(hex: string) {
    this.value.set(hex);
    this.target.set(hex);
  }
  step(k: number) {
    this.value.lerp(this.target, k);
  }
}

/** Sample an ordered list of hex colors as a gradient (t in 0–1). */
export function gradient(colors: string[], t: number): string {
  if (colors.length === 1) return colors[0];
  const x = clamp(t, 0, 1) * (colors.length - 1);
  const i = Math.min(Math.floor(x), colors.length - 2);
  const c = new THREE.Color(colors[i]).lerp(new THREE.Color(colors[i + 1]), x - i);
  return `#${c.getHexString()}`;
}

/** Mix a hex color toward white (amt > 0) or black (amt < 0). */
export function shade(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(amt > 0 ? '#ffffff' : '#000000'), Math.abs(amt));
  return `#${c.getHexString()}`;
}
