// Glyphs: the Taos icons, extruded into chunky 3D tokens that drift upward and slowly tumble.
// palette.colors    = face colors (1–8; each glyph takes one)
// palette.extrusion = side walls (default True Black 80%); params.contrast darkens the shaded side
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { iconNames, icons } from '../../icons';
import { glyphCount, TRUE_BLACK_80, type GlyphLayout, type ScenePalette, type SceneParams } from '../../presets';
import { Facet, type FacetColors } from '../facet';
import type { Family } from '../types';
import { lerp, settle, shade, TAU } from '../util';

const H = 4.2; // half-height of the field
const W = H * 1.9; // half-width (covers 16:10 plus the composition shift)
const MAX_FACES = 8;
const SLOTS = 840; // divisible by 1–8, so slot % colors.length stays evenly spread

export const GLYPH_NAMES = iconNames;

const CURVE_SEGMENTS = 10;

/**
 * Winding fix. ExtrudeGeometry wants the outline clockwise and holes counter-clockwise, but it
 * only corrects a hole's direction when it also has to flip the outline. A hole drawn in the
 * same direction as its outline (the ladder's lower gap, the sun's center) got inside-out walls,
 * which are culled, so the hole looked flat. Rebuild every shape with the directions it expects.
 */
function orient(shape: THREE.Shape): THREE.Shape {
  const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
  const out = new THREE.Shape(THREE.ShapeUtils.isClockWise(outline) ? outline : outline.reverse());
  out.holes = holes.map((h) => new THREE.Path(THREE.ShapeUtils.isClockWise(h) ? h.reverse() : h));
  return out;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function glyphGeometry(name: string, depth: number): THREE.BufferGeometry {
  const key = `${name}@${depth.toFixed(2)}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const data = new SVGLoader().parse(icons[name]);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p)).map(orient);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 150 * depth,
    bevelEnabled: true,
    bevelThickness: 18,
    bevelSize: 12,
    bevelSegments: 2,
    curveSegments: CURVE_SEGMENTS,
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

/**
 * Even spacing for the grid and checker layouts, at the same visual density as the scatter
 * (the same area per glyph). Checker fills alternate squares: rows are half as far apart as
 * columns, and every other row shifts by half a column.
 * The sheet is taller than the view so it can drift up and wrap without a visible seam.
 */
function lattice(layout: Exclude<GlyphLayout, 'scatter'>, count: number) {
  const area = (2 * W * (2 * H + 2)) / count;
  const sy = layout === 'checker' ? Math.sqrt(area / 2) : Math.sqrt(area);
  const sx = layout === 'checker' ? 2 * sy : sy;
  const cols = Math.ceil((2 * W) / sx) + 1;
  let rows = Math.ceil((2 * (H + 1.2)) / sy);
  if (layout === 'checker' && rows % 2) rows++; // keeps the row pattern intact across the wrap
  return { sx, sy, cols, rows };
}

/** Re-roll a random pick (a few tries) when it matches a neighbour. */
function distinct<T>(roll: () => T, clash: (v: T) => boolean): T {
  let v = roll();
  for (let i = 0; i < 6 && clash(v); i++) v = roll();
  return v;
}

export const glyphs: Family = {
  id: 'glyphs',
  camera: { type: 'persp', az: 90, el: 4, fov: 28 },
  build({ params, palette, rng, shared, glyphs: allowed }) {
    const names = allowed?.length ? allowed.filter((n) => n in icons) : GLYPH_NAMES;
    const pool = names.length ? names : GLYPH_NAMES;
    const layout = params.layout ?? 'scatter';
    const count = glyphCount(params.density, layout);
    const depth = params.depth ?? 1;
    const spread = params.spread ?? 1;
    const jitter = params.jitter ?? 0;
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

    const place = (name: string, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(glyphGeometry(name, depth));
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(0.001);
      root.add(mesh);
      return mesh;
    };

    // A glyph that drifts above `top` drops back by `span`.
    let top = H + 1.2;
    let span = 2 * (H + 1.2);

    if (layout === 'scatter') {
      // Jittered grid so glyphs start spread out. Each drifts at its own speed, so the field
      // loosens over time. (Keep this random sequence as is: saved presets depend on it.)
      const cols = Math.max(3, Math.round(Math.sqrt((count * W) / H)));
      const rows = Math.ceil(count / cols);
      for (let n = 0; n < count; n++) {
        const name = pool[Math.floor(rng() * pool.length)];
        const cx = (n % cols) + 0.5 + (rng() - 0.5) * 0.7;
        const cy = Math.floor(n / cols) + 0.5 + (rng() - 0.5) * 0.7;
        const mesh = place(name, lerp(-W, W, cx / cols), lerp(-H - 1, H + 1, cy / rows), (rng() - 0.5) * 2.4 * spread);
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
    } else {
      // Grid / checker: every glyph on a lattice spot, all drifting at one speed so the spacing
      // never bunches. Neighbours avoid sharing an icon or a face color where the pool allows.
      const checker = layout === 'checker';
      const { sx, sy, cols, rows } = lattice(layout, count);
      span = rows * sy;
      top = span / 2;
      const nColors = Math.min(pal.colors.length, MAX_FACES);
      const taken = new Map<string, { name: string; color: number }>();
      const key = (c: number, r: number) => `${c},${((r % rows) + rows) % rows}`;
      const neighbours = (c: number, r: number) => {
        const keys = [key(c - 1, r), key(c + 1, r)];
        for (const cc of checker ? (r % 2 ? [c, c + 1] : [c - 1, c]) : [c]) keys.push(key(cc, r - 1), key(cc, r + 1));
        return keys.flatMap((k) => taken.get(k) ?? []);
      };
      const offset = jitter * 0.5 * sy;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const near = neighbours(c, r);
          const name = distinct(
            () => pool[Math.floor(rng() * pool.length)],
            (n) => pool.length > 1 && near.some((o) => o.name === n),
          );
          const slot = distinct(
            () => Math.floor(rng() * SLOTS),
            (s) => nColors > 1 && near.some((o) => o.color === s % nColors),
          );
          taken.set(key(c, r), { name, color: slot % nColors });
          const shift = checker ? (r % 2 ? sx / 4 : -sx / 4) : 0;
          const x = (c + 0.5 - cols / 2) * sx + shift + (rng() - 0.5) * offset;
          const y = (r + 0.5 - rows / 2) * sy + (rng() - 0.5) * offset;
          items.push({
            mesh: place(name, x, y, (rng() - 0.5) * 2.4 * spread),
            slot,
            size: lerp(0.7, 1.25, rng()),
            spin: (rng() - 0.5) * 0.7,
            wob: 0.25 + rng() * 0.3,
            phase: rng() * TAU,
            rise: 0.16,
            baseRot: (rng() - 0.5) * 0.9,
            // Grow in as a diagonal wave from the top left.
            delay: 0.1 + (1.1 * (c + rows - 1 - r)) / (cols + rows - 2),
          });
        }
      }
    }
    assign();

    return {
      root,
      fit(_aspect, tilt) {
        return H * 0.8 * (1 + 0.2 * Math.abs(Math.sin(tilt)));
      },
      update(t, dt, dtReal, live: SceneParams) {
        const k = settle(dt, 3.5);
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
          if (m.position.y > top) m.position.y -= span;
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
