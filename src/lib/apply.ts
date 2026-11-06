// Page-level glue shared by the index and the lab: applies a preset's card treatment to the
// document and connects link hovers to the scene accent.
import type { Preset } from './presets';

export function applyCardStyle(preset: Preset, root: HTMLElement = document.documentElement) {
  root.dataset.mode = preset.card.mode;
  root.dataset.preset = preset.id;
  root.style.setProperty('--card-radius', `${preset.card.radius}px`);
  root.style.setProperty('--scene-bg', preset.palette.bg);
  root.style.background = preset.palette.bg; // overscroll and the first frame before CSS
}

/**
 * Composition shift. Wide screens: the card sits left, so push the scene right.
 * Phones: the card is centered, so the scene stays centered around it.
 */
export function focusForViewport(): { x: number; y: number } {
  const w = window.innerWidth;
  if (w < 760) return { x: 0, y: 0 };
  return { x: w >= 1200 ? 0.24 : 0.18, y: 0 };
}
