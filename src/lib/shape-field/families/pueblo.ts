// Pueblo: a field of stepped adobe blocks seen in isometric, always rebuilding.
// palette.colors = [top, lit side, shade side, alt top]
import * as THREE from 'three';
import type { ScenePalette } from '../../presets';
import { Facet, type FacetColors } from '../facet';
import type { Family } from '../types';
import { clamp, deg, fbm, lerp, settle } from '../util';

const EL = 30; // camera elevation (degrees)

const toFacet = (p: ScenePalette): FacetColors => ({
  top: p.colors[0],
  lit: p.colors[1] ?? p.colors[0],
  shade: p.colors[2] ?? p.colors[1] ?? p.colors[0],
  alt: p.colors[3] ?? p.colors[0],
});

export const pueblo: Family = {
  id: 'pueblo',
  camera: { type: 'ortho', az: 45, el: EL },
  build({ params, palette, rng, shared }) {
    const N = Math.round(lerp(14, 34, params.density));
    const levels = 5;
    const stepH = 0.8;
    const minH = 0.12;
    const maxH = minH + levels * stepH;
    const count = N * N;

    const facet = new Facet(shared, toFacet(palette));

    const aSet = new Float32Array(count);
    const target = new Float32Array(count);
    const height = new Float32Array(count);
    const delay = new Float32Array(count);
    const ox = rng() * 100;
    const oz = rng() * 100;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const idx = i * N + j;
        const v = fbm((i + ox) * 0.17, (j + oz) * 0.17, 3);
        // Bias toward low terraces with open courtyards.
        const level = Math.floor(clamp(v * 1.6 - 0.3, 0, 0.999) * levels);
        target[idx] = minH + level * stepH;
        aSet[idx] = rng() < 0.16 ? 1 : 0;
        // Intro: the pueblo builds in a wave from the back corner.
        delay[idx] = ((i + j) / (2 * N)) * 1.4 + rng() * 0.15;
      }
    }
    // One merged heightfield mesh: a top per cell, and side walls only where a neighbor is lower.
    // No hidden interior faces means no depth-fighting seams between blocks.
    const maxQuads = count * 5;
    const pos = new Float32Array(maxQuads * 6 * 3);
    const nrm = new Float32Array(maxQuads * 6 * 3);
    const set = new Float32Array(maxQuads * 6);
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
    const nrmAttr = new THREE.BufferAttribute(nrm, 3).setUsage(THREE.DynamicDrawUsage);
    const setAttr = new THREE.BufferAttribute(set, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('normal', nrmAttr);
    geo.setAttribute('aSet', setAttr);
    const mesh = new THREE.Mesh(geo, facet.material);
    mesh.frustumCulled = false;

    const half = N / 2;
    const h = (i: number, j: number) => (i < 0 || j < 0 || i >= N || j >= N ? 0 : height[i * N + j]);
    let v = 0; // vertex cursor
    const q = new Float32Array(12); // scratch: 4 corners (CCW from outside)
    const order = [0, 1, 2, 0, 2, 3];
    const quad = (nx: number, ny: number, nz: number, s: number) => {
      for (const c of order) {
        pos[v * 3] = q[c * 3];
        pos[v * 3 + 1] = q[c * 3 + 1];
        pos[v * 3 + 2] = q[c * 3 + 2];
        nrm[v * 3] = nx;
        nrm[v * 3 + 1] = ny;
        nrm[v * 3 + 2] = nz;
        set[v] = s;
        v++;
      }
    };
    // prettier-ignore
    const corners = (a: number, b: number, c: number, d: number, e: number, f: number, g: number, hh: number, i: number, j: number, k: number, l: number) => {
      q[0] = a; q[1] = b; q[2] = c; q[3] = d; q[4] = e; q[5] = f; q[6] = g; q[7] = hh; q[8] = i; q[9] = j; q[10] = k; q[11] = l;
    };
    const rebuild = () => {
      v = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const y = height[i * N + j];
          if (y < 0.002) continue;
          const x0 = i - half, x1 = x0 + 1, z0 = j - half, z1 = z0 + 1;
          corners(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
          quad(0, 1, 0, aSet[i * N + j]);
          let n = h(i + 1, j);
          if (y > n + 1e-4) (corners(x1, n, z0, x1, y, z0, x1, y, z1, x1, n, z1), quad(1, 0, 0, 0));
          n = h(i - 1, j);
          if (y > n + 1e-4) (corners(x0, n, z1, x0, y, z1, x0, y, z0, x0, n, z0), quad(-1, 0, 0, 0));
          n = h(i, j + 1);
          if (y > n + 1e-4) (corners(x1, n, z1, x1, y, z1, x0, y, z1, x0, n, z1), quad(0, 0, 1, 0));
          n = h(i, j - 1);
          if (y > n + 1e-4) (corners(x0, n, z0, x0, y, z0, x1, y, z0, x1, n, z0), quad(0, 0, -1, 0));
        }
      }
      geo.setDrawRange(0, v);
      posAttr.needsUpdate = true;
      nrmAttr.needsUpdate = true;
      setAttr.needsUpdate = true;
    };
    rebuild();

    let nextEvent = 2.2;

    return {
      root: mesh,
      fit(aspect, tilt) {
        // Largest screen rectangle (rolled by tilt) that stays inside the grid's isometric diamond.
        const a = (N / Math.SQRT2) * 0.92; // horizontal half-diagonal
        const b = a * Math.sin(deg(EL)); // vertical half-diagonal
        const c = Math.abs(Math.cos(tilt));
        const s = Math.abs(Math.sin(tilt));
        return (1 / ((aspect * c + s) / a + (aspect * s + c) / b)) * 0.9;
      },
      update(t, dt, dtReal) {
        // "Always in build": a few blocks step up or down at a time.
        while (t > nextEvent) {
          nextEvent += 0.28 + rng() * 0.3;
          const n = 1 + Math.floor(rng() * 3);
          for (let m = 0; m < n; m++) {
            const idx = Math.floor(rng() * count);
            const dir = rng() < 0.5 ? -1 : 1;
            target[idx] = clamp(target[idx] + dir * stepH, minH, maxH);
          }
        }
        const k = settle(dt, 4.5);
        let changed = false;
        for (let idx = 0; idx < count; idx++) {
          const goal = t < delay[idx] ? 0 : target[idx];
          const d = goal - height[idx];
          if (Math.abs(d) > 1e-4) {
            height[idx] += d * k;
            changed = true;
          }
        }
        if (changed) rebuild();
        facet.step(settle(dtReal, 6));
      },
      setPalette(p) {
        facet.set(toFacet(p));
      },
      dispose() {
        geo.dispose();
        facet.dispose();
      },
    };
  },
};
