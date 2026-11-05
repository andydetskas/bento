// Ridgeline: layered mountain ridges, back to front, drifting at parallax speeds.
// palette.colors = gradient stops from the farthest ridge to the nearest.
import * as THREE from 'three';
import type { ScenePalette } from '../../presets';
import { Facet, type FacetColors } from '../facet';
import type { Family } from '../types';
import { gradient, lerp, settle, shade, TAU } from '../util';

const H = 5; // reference half-height of the view
const P = 40; // profile period (world units). Must exceed the widest view.
const GAP = 1.2; // depth between ridges

const FREQS = [2, 3, 5, 8, 13];
const AMPS = [1, 0.55, 0.32, 0.18, 0.09];

const layerColors = (p: ScenePalette, f: number): FacetColors => {
  const c = gradient(p.colors, f);
  return { top: shade(c, 0.22), lit: c, shade: c, alt: c };
};

export const ridgeline: Family = {
  id: 'ridgeline',
  camera: { type: 'ortho', az: 90, el: 8 },
  build({ params, palette, rng, shared }) {
    const count = Math.round(lerp(4, 10, params.density));
    const root = new THREE.Group();
    const layers: { mesh: THREE.Mesh; facet: Facet; speed: number; f: number; delay: number; geo: THREE.BufferGeometry }[] = [];

    for (let i = 0; i < count; i++) {
      const f = count === 1 ? 1 : i / (count - 1); // 0 = back, 1 = front
      const base = lerp(1.6, -3.0, f);
      const amp = lerp(1.5, 2.1, f);
      const phases = FREQS.map(() => rng() * TAU);
      const norm = AMPS.reduce((a, b) => a + b, 0);
      // Ridged, periodic profile: 1 - |sin| gives sharp peaks; integer frequencies keep it seamless over P.
      const profile = (x: number) => {
        let y = 0;
        for (let k = 0; k < FREQS.length; k++) y += AMPS[k] * (1 - Math.abs(Math.sin((Math.PI * FREQS[k] * x) / P + phases[k])));
        return y / norm;
      };

      const shape = new THREE.Shape();
      const x0 = -2 * P;
      const x1 = 2 * P;
      const steps = 1100;
      shape.moveTo(x0, -H * 4);
      for (let s = 0; s <= steps; s++) {
        const x = lerp(x0, x1, s / steps);
        shape.lineTo(x, base + amp * (profile(x) - 0.5) * 2);
      }
      shape.lineTo(x1, -H * 4);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: GAP * 0.55, bevelEnabled: false, steps: 1, curveSegments: 1 });
      const facet = new Facet(shared, layerColors(palette, f));
      const mesh = new THREE.Mesh(geo, facet.material);
      mesh.frustumCulled = false;
      mesh.position.z = -(count - 1 - i) * GAP;
      mesh.position.y = -H * 2.5; // intro: rise into place
      root.add(mesh);
      layers.push({ mesh, facet, f, geo, speed: lerp(0.05, 0.28, f), delay: 0.15 + f * 0.6 });
    }

    return {
      root,
      fit(_aspect, tilt) {
        return H * (1 + 0.25 * Math.abs(Math.sin(tilt)));
      },
      update(t, dt, dtReal) {
        const k = settle(dt, 3.2);
        const kc = settle(dtReal, 6);
        for (const L of layers) {
          // Drift sideways; wrap by one period (seamless because the profile repeats every P).
          L.mesh.position.x = ((t * L.speed) % P) - P / 2;
          if (t > L.delay) L.mesh.position.y += (0 - L.mesh.position.y) * k;
          L.facet.step(kc);
        }
      },
      setPalette(p) {
        for (const L of layers) L.facet.set(layerColors(p, L.f));
      },
      dispose() {
        for (const L of layers) {
          L.geo.dispose();
          L.facet.dispose();
        }
      },
    };
  },
};
