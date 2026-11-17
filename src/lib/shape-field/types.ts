import type * as THREE from 'three';
import type { FamilyId, ScenePalette, SceneParams } from '../presets';

/** Uniforms every family shares, owned and updated by the engine. */
export interface SharedUniforms {
  [key: string]: THREE.IUniform;
  uLightDir: THREE.IUniform<THREE.Vector3>;
  uAccent: THREE.IUniform<THREE.Color>;
  uAccentAmt: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  /** The scene background (the same tweened color), so forms can fade into it. */
  uBg: THREE.IUniform<THREE.Color>;
  /**
   * Edge fade in world y: (bottom, top, band). A form whose center is within `band` of either
   * edge mixes toward uBg, reaching it at the edge. band 0 = off. Set by families that wrap.
   */
  uFade: THREE.IUniform<THREE.Vector3>;
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
  /** Optional: jump straight to scene time t (as if update() had run from 0). Without it the engine steps there. */
  seek?(t: number, params: SceneParams): void;
  /**
   * Optional: where the middle of the visible area sits in world space (x, y at z = 0), and where
   * the camera is. The middle moves with the composition shift (setFocus), the roll and the aspect.
   * A field that wraps centers its wrap here, so the seam stays off screen; glyphs use the camera
   * to keep their faces readable.
   */
  view?(x: number, y: number, camera?: THREE.Vector3): void;
  setPalette(palette: ScenePalette): void;
  dispose(): void;
}

export interface Family {
  id: FamilyId;
  camera: { type: 'ortho' | 'persp'; az: number; el: number; fov?: number };
  /** Optional warm-up before build(): does the heavy setup in small tasks so taps aren't blocked. */
  prepare?(ctx: Pick<FamilyContext, 'params' | 'glyphs'>): Promise<void>;
  build(ctx: FamilyContext): FamilyInstance;
}
