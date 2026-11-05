import type * as THREE from 'three';
import type { FamilyId, ScenePalette, SceneParams } from '../presets';

/** Uniforms every family shares, owned and updated by the engine. */
export interface SharedUniforms {
  [key: string]: THREE.IUniform;
  uLightDir: THREE.IUniform<THREE.Vector3>;
  uAccent: THREE.IUniform<THREE.Color>;
  uAccentAmt: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
}

export interface FamilyContext {
  params: SceneParams;
  palette: ScenePalette;
  rng: () => number;
  shared: SharedUniforms;
  /** Glyphs: which icons to use (empty = all). */
  glyphs?: string[];
}

export interface FamilyInstance {
  root: THREE.Object3D;
  /** Half-height of the view (world units at the origin) that frames the scene for this aspect and roll. */
  fit(aspect: number, tilt: number): number;
  /**
   * t: scene seconds (scaled by speed, 0 when still).
   * dt: scene delta (scaled by speed).
   * dtReal: wall-clock delta, for color easing that should run even when the scene is still.
   * params: the live params (sliders that don't need a rebuild read from here).
   */
  update(t: number, dt: number, dtReal: number, params: SceneParams): void;
  setPalette(palette: ScenePalette): void;
  dispose(): void;
}

export interface Family {
  id: FamilyId;
  camera: { type: 'ortho' | 'persp'; az: number; el: number; fov?: number };
  build(ctx: FamilyContext): FamilyInstance;
}
