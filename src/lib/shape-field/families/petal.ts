// Petal: soft, folded forms (intersecting ellipsoids) with a gradient body and an iridescent sheen.
// palette.colors = [shade, mid, highlight, sheen]
import * as THREE from 'three';
import type { ScenePalette } from '../../presets';
import type { Family } from '../types';
import { lerp, settle, TAU, TweenColor } from '../util';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vN;
  varying vec3 vNW;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 2.1 + uTime * 0.6 + uSeed) * sin(p.z * 1.7 - uTime * 0.45 + uSeed * 1.3);
    p += normal * w * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = -mv.xyz;
    vN = normalize(normalMatrix * normal);
    vNW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uLightDir;
  uniform vec3 uAccent;
  uniform float uAccentAmt;
  varying vec3 vN;
  varying vec3 vNW;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    float l = dot(normalize(vNW), normalize(uLightDir)) * 0.5 + 0.5;
    vec3 col = mix(uC0, uC1, smoothstep(0.05, 0.55, l));
    col = mix(col, uC2, smoothstep(0.55, 0.98, l));
    float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);
    vec3 sheen = mix(uC3, uC2, 0.5 + 0.5 * sin(fr * 9.0));
    col = mix(col, sheen, fr * 0.85);
    col = mix(col, uAccent, uAccentAmt * 0.55);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export const petal: Family = {
  id: 'petal',
  camera: { type: 'persp', az: 90, el: 6, fov: 30 },
  build({ params, palette, rng, shared }) {
    const count = Math.round(lerp(4, 12, params.density));
    const c = palette.colors;
    const cols = [0, 1, 2, 3].map((i) => new TweenColor(c[i] ?? c[c.length - 1]));
    const base = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uC0: { value: cols[0].value },
        uC1: { value: cols[1].value },
        uC2: { value: cols[2].value },
        uC3: { value: cols[3].value },
        uSeed: { value: 0 },
        uTime: shared.uTime,
        uLightDir: shared.uLightDir,
        uAccent: shared.uAccent,
        uAccentAmt: shared.uAccentAmt,
      },
    });

    const geo = new THREE.SphereGeometry(1, 128, 96);
    const root = new THREE.Group();
    const cluster = new THREE.Group();
    root.add(cluster);
    const petals: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; scale: THREE.Vector3; phase: number }[] = [];

    for (let i = 0; i < count; i++) {
      // Each petal gets its own material for its own wobble seed, sharing every other uniform.
      const mat = base.clone();
      for (const key of Object.keys(base.uniforms)) if (key !== 'uSeed') mat.uniforms[key] = base.uniforms[key];
      mat.uniforms.uSeed = { value: rng() * TAU };
      const mesh = new THREE.Mesh(geo, mat);
      const size = lerp(0.8, 1.15, rng());
      const scale = new THREE.Vector3(1.55 * size, 0.42 * size, 0.95 * size);
      mesh.scale.copy(scale);
      mesh.rotation.set(rng() * TAU, rng() * TAU, rng() * TAU);
      const r = 0.25 + rng() * 0.3;
      const a = rng() * TAU;
      const b = Math.acos(2 * rng() - 1);
      mesh.position.set(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a));
      cluster.add(mesh);
      petals.push({ mesh, mat, scale, phase: rng() * TAU });
    }
    cluster.scale.setScalar(0.001);

    return {
      root,
      fit(aspect) {
        // Keep the whole cluster in frame on narrow screens too.
        return Math.max(2.5, 2.2 / aspect);
      },
      update(t, dt, dtReal) {
        const grow = t > 0.2 ? settle(dt, 2.6) : 0;
        cluster.scale.setScalar(cluster.scale.x + (1 - cluster.scale.x) * grow);
        cluster.rotation.y = t * 0.12;
        cluster.rotation.x = Math.sin(t * 0.21) * 0.18;
        for (const p of petals) {
          const breathe = 1 + 0.04 * Math.sin(t * 0.8 + p.phase);
          p.mesh.scale.set(p.scale.x * breathe, p.scale.y * (2 - breathe), p.scale.z * breathe);
        }
        const k = settle(dtReal, 6);
        for (const col of cols) col.step(k);
      },
      setPalette(p: ScenePalette) {
        cols.forEach((col, i) => col.set(p.colors[i] ?? p.colors[p.colors.length - 1]));
      },
      dispose() {
        geo.dispose();
        base.dispose();
        for (const p of petals) p.mat.dispose();
      },
    };
  },
};
