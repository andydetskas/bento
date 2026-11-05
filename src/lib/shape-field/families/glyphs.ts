// Glyphs: the Taos icons, extruded into chunky 3D tokens that drift upward and slowly tumble.
// palette.colors    = face colors (1–8; each glyph takes one)
// palette.extrusion = side walls (default True Black 80%); params.contrast darkens the shaded side
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { iconNames, icons } from '../../icons';
import { TRUE_BLACK_80, type ScenePalette, type SceneParams } from '../../presets';
import { Facet, type FacetColors } from '../facet';
import type { Family } from '../types';
import { lerp, settle, shade, TAU } from '../util';

const H = 4.2; // half-height of the field
const W = H * 1.9; // half-width (covers 16:10 plus the composition shift)
const MAX_FACES = 8;
const SLOTS = 840; // divisible by 1–8, so slot % colors.length stays evenly spread

export const GLYPH_NAMES = iconNames;

const geoCache = new Map<string, THREE.BufferGeometry>();
function glyphGeometry(name: string, depth: number): THREE.BufferGeometry {
  const key = `${name}@${depth.toFixed(2)}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const data = new SVGLoader().parse(icons[name]);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 150 * depth,
    bevelEnabled: true,
    bevelThickness: 18,
    bevelSize: 12,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.scale(1, -1, -1); // SVG y points down; flip y and z together (a rotation, not a mirror)
  geo.computeBoundingBox();
  const size = new THREE.Vector3();
  geo.boundingBox!.getSize(size);
  geo.center();
  const s = 1 / Math.max(size.x, size.y);
  geo.scale(s, s, s);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

const facetColors = (p: ScenePalette, i: number, contrast: number): FacetColors => {
  const side = p.extrusion ?? TRUE_BLACK_80;
  return { top: p.colors[i % p.colors.length], lit: side, shade: shade(side, -contrast) };
};

export const glyphs: Family = {
  id: 'glyphs',
  camera: { type: 'persp', az: 90, el: 4, fov: 28 },
  build({ params, palette, rng, shared, glyphs: allowed }) {
    const names = allowed?.length ? allowed.filter((n) => n in icons) : GLYPH_NAMES;
    const pool = names.length ? names : GLYPH_NAMES;
    const count = Math.round(lerp(14, 48, params.density));
    const depth = params.depth ?? 1;
    const spread = params.spread ?? 1;
    let contrast = params.contrast ?? 0.35;
    let pal = palette;

    const facets = Array.from({ length: MAX_FACES }, (_, i) => new Facet(shared, facetColors(pal, i, contrast), { primary: 'local-z' }));
    const root = new THREE.Group();
    const items: {
      mesh: THREE.Mesh;
      slot: number;
      spin: number;
      wob: number;
      phase: number;
      rise: number;
      size: number;
      delay: number;
      baseRot: number;
    }[] = [];

    const assign = () => {
      const n = Math.min(pal.colors.length, MAX_FACES);
      for (const it of items) it.mesh.material = facets[it.slot % n].material;
    };

    // Jittered grid so glyphs spread evenly instead of clumping.
    const cols = Math.max(3, Math.round(Math.sqrt((count * W) / H)));
    const rows = Math.ceil(count / cols);
    for (let n = 0; n < count; n++) {
      const name = pool[Math.floor(rng() * pool.length)];
      const mesh = new THREE.Mesh(glyphGeometry(name, depth));
      const cx = (n % cols) + 0.5 + (rng() - 0.5) * 0.7;
      const cy = Math.floor(n / cols) + 0.5 + (rng() - 0.5) * 0.7;
      mesh.position.set(lerp(-W, W, cx / cols), lerp(-H - 1, H + 1, cy / rows), (rng() - 0.5) * 2.4 * spread);
      mesh.scale.setScalar(0.001);
      root.add(mesh);
      items.push({
        mesh,
        slot: Math.floor(rng() * SLOTS),
        size: lerp(0.7, 1.25, rng()),
        spin: (rng() - 0.5) * 0.7,
        wob: 0.25 + rng() * 0.3,
        phase: rng() * TAU,
        rise: 0.1 + rng() * 0.12,
        baseRot: (rng() - 0.5) * 0.9,
        delay: 0.1 + rng() * 1.1,
      });
    }
    assign();

    return {
      root,
      fit(_aspect, tilt) {
        return H * 0.8 * (1 + 0.2 * Math.abs(Math.sin(tilt)));
      },
      update(t, dt, dtReal, live: SceneParams) {
        const k = settle(dt, 3.5);
        const span = 2 * (H + 1.2);
        const sizeMul = live.size ?? 1;
        const tumble = live.tumble ?? 1;
        for (const it of items) {
          const m = it.mesh;
          const goal = it.size * sizeMul;
          // Grow in after a stagger; when the scene is paused (speed 0), size changes apply at once.
          if (dt === 0) m.scale.setScalar(goal);
          else if (t > it.delay) m.scale.setScalar(m.scale.x + (goal - m.scale.x) * k);
          m.rotation.y = it.baseRot * tumble + Math.sin(t * it.spin + it.phase) * 0.9 * tumble;
          m.rotation.x = Math.sin(t * it.wob + it.phase) * 0.35 * tumble;
          m.rotation.z = Math.sin(t * 0.13 + it.phase) * 0.12 * tumble;
          m.position.y += dt * it.rise;
          if (m.position.y > H + 1.2) m.position.y -= span;
        }
        const c = live.contrast ?? 0.35;
        if (c !== contrast) {
          contrast = c;
          facets.forEach((f, i) => f.set(facetColors(pal, i, contrast)));
        }
        const kc = settle(dtReal, 6);
        for (const f of facets) f.step(kc);
      },
      setPalette(p) {
        pal = p;
        facets.forEach((f, i) => f.set(facetColors(pal, i, contrast)));
        assign();
      },
      dispose() {
        for (const f of facets) f.dispose();
        // Geometries are cached across rebuilds on purpose.
      },
    };
  },
};
