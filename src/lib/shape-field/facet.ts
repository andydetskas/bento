// Flat, three-tone "facet" shading for the isometric look:
// faces pointing along the primary axis get the TOP color, side faces get LIT or SHADE
// depending on which way they face the light. No gradients, no specular: crisp poster color.
import * as THREE from 'three';
import type { SharedUniforms } from './types';
import { TweenColor } from './util';

export interface FacetColors {
  top: string;
  lit: string;
  shade: string;
  /** Alternate top color, used where the per-instance `aSet` attribute is 1. */
  alt?: string;
}

export interface FacetOptions {
  /** 'world' = faces pointing up are tops (blocks, ridges). 'local-z' = front/back caps are tops (extruded glyphs). */
  primary?: 'world' | 'local-z';
}

const vertexShader = /* glsl */ `
  attribute float aSet;
  varying vec3 vNWorld;
  varying vec3 vNLocal;
  varying float vSet;
  void main() {
    vec4 p = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3(instanceMatrix) * n;
    #endif
    vNLocal = normal;
    vNWorld = normalize(mat3(modelMatrix) * n);
    vSet = aSet;
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform vec3 uAlt;
  uniform vec3 uLightDir;
  uniform vec3 uAccent;
  uniform float uAccentAmt;
  uniform float uPrimaryLocal;
  varying vec3 vNWorld;
  varying vec3 vNLocal;
  varying float vSet;
  void main() {
    vec3 nW = normalize(vNWorld);
    float primary = uPrimaryLocal > 0.5 ? abs(normalize(vNLocal).z) : nW.y;

    vec3 top = mix(uTop, uAlt, step(0.5, vSet));
    top = mix(top, uAccent, uAccentAmt);

    float len = length(nW.xz);
    float s = len > 0.001 ? dot(nW.xz / len, normalize(uLightDir.xz)) : 0.0;
    vec3 side = mix(uShade, uLit, smoothstep(-0.3, 0.3, s));

    vec3 col = mix(side, top, smoothstep(0.55, 0.72, primary));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export class Facet {
  readonly material: THREE.ShaderMaterial;
  private top: TweenColor;
  private lit: TweenColor;
  private shade: TweenColor;
  private alt: TweenColor;

  constructor(shared: SharedUniforms, colors: FacetColors, opts: FacetOptions = {}) {
    this.top = new TweenColor(colors.top);
    this.lit = new TweenColor(colors.lit);
    this.shade = new TweenColor(colors.shade);
    this.alt = new TweenColor(colors.alt ?? colors.top);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTop: { value: this.top.value },
        uLit: { value: this.lit.value },
        uShade: { value: this.shade.value },
        uAlt: { value: this.alt.value },
        uPrimaryLocal: { value: opts.primary === 'local-z' ? 1 : 0 },
        uLightDir: shared.uLightDir,
        uAccent: shared.uAccent,
        uAccentAmt: shared.uAccentAmt,
      },
    });
    // Meshes without an aSet attribute read 0 (no alternate color).
    (this.material as THREE.ShaderMaterial & { defaultAttributeValues: Record<string, number[]> }).defaultAttributeValues = {
      ...(this.material as unknown as { defaultAttributeValues: Record<string, number[]> }).defaultAttributeValues,
      aSet: [0],
    };
  }

  set(colors: FacetColors) {
    this.top.set(colors.top);
    this.lit.set(colors.lit);
    this.shade.set(colors.shade);
    this.alt.set(colors.alt ?? colors.top);
  }

  step(k: number) {
    this.top.step(k);
    this.lit.step(k);
    this.shade.step(k);
    this.alt.step(k);
  }

  dispose() {
    this.material.dispose();
  }
}
