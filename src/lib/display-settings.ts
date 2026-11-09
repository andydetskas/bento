// Display settings: preferences a visitor can set for this site, saved on their device. Built to
// avoid the overlay-widget mistakes: no "screen reader mode" (the site works with screen readers as
// built), no single-key shortcuts (they collide with screen readers' quick keys; WCAG 2.1.4), and
// everything starts from the visitor's own system settings. Each choice is a data attribute on
// <html> (site.css styles them); SiteHead applies the saved ones before first paint.

export const DISPLAY_KEY = 'ad_display';

import { defaultPreset, glyphPalettes } from './presets';

/** The scene in dark mode: Adobe Night (presets.ts), the light Adobe scene's counterpart. */
export const DARK_PALETTE = glyphPalettes.find((p) => p.id === 'adobe-night')!.palette;
export const LIGHT_PALETTE = defaultPreset.palette;

export interface DisplaySettings {
  /** Light or dark: "system" follows the device (prefers-color-scheme). */
  theme: 'system' | 'light' | 'dark';
  /** Text size: 100%, 115%, 130%. */
  text: 'default' | 'large' | 'larger';
  /** Atkinson Hyperlegible, designed for low vision, in place of the brand typefaces. */
  font: 'default' | 'readable';
  /** WCAG 1.4.12 text spacing: line height 1.5, letter 0.12em, word 0.16em. */
  spacing: 'default' | 'wide';
  contrast: 'default' | 'high';
  /** Underline every link; a heavy outline on hover and focus. */
  highlight: 'default' | 'on';
  /** "system" follows prefers-reduced-motion; "reduced" turns motion off here regardless. */
  motion: 'system' | 'reduced';
  /** The 3D background: animated, held still, or hidden (a flat color). */
  scene: 'on' | 'paused' | 'off';
}

export const DEFAULTS: DisplaySettings = {
  theme: 'system',
  text: 'default',
  font: 'default',
  spacing: 'default',
  contrast: 'default',
  highlight: 'default',
  motion: 'system',
  scene: 'on',
};

/** Starting points, not modes: each sets a few of the options above, which stay adjustable. */
export const PRESETS: { id: string; label: string; note: string; values: Partial<DisplaySettings> }[] = [
  { id: 'low-vision', label: 'Low vision', note: 'Larger text, high contrast, clear links and focus', values: { text: 'larger', contrast: 'high', highlight: 'on' } },
  { id: 'dyslexia', label: 'Dyslexia-friendly', note: 'Hyperlegible typeface, wider spacing', values: { font: 'readable', spacing: 'wide' } },
  { id: 'motion', label: 'Motion sensitive', note: 'No animation; the background holds still', values: { motion: 'reduced', scene: 'paused' } },
  { id: 'focus', label: 'Fewer distractions', note: 'No animation and no background', values: { motion: 'reduced', scene: 'off' } },
];

export function loadSettings(): DisplaySettings {
  try {
    const saved = JSON.parse(localStorage.getItem(DISPLAY_KEY) || '{}');
    const out = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS) as (keyof DisplaySettings)[]) if (typeof saved[k] === 'string') (out as Record<string, string>)[k] = saved[k];
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

/** Saves only what differs from the defaults (SiteHead sets every saved key as-is). */
export function saveSettings(s: DisplaySettings) {
  const diff: Partial<DisplaySettings> = {};
  for (const k of Object.keys(DEFAULTS) as (keyof DisplaySettings)[]) if (s[k] !== DEFAULTS[k]) (diff as Record<string, string>)[k] = s[k];
  try {
    if (Object.keys(diff).length) localStorage.setItem(DISPLAY_KEY, JSON.stringify(diff));
    else localStorage.removeItem(DISPLAY_KEY);
  } catch {
    // Storage off: the settings still apply for this page.
  }
}

export function applySettings(s: DisplaySettings) {
  const root = document.documentElement;
  for (const k of Object.keys(DEFAULTS) as (keyof DisplaySettings)[]) {
    if (s[k] === DEFAULTS[k]) delete root.dataset[k];
    else root.dataset[k] = s[k];
  }
  window.shapeField?.setPaused?.(s.scene !== 'on');
  applyTheme(s);
}

/** Dark when the visitor chose it, or chose nothing and the device is dark. */
export const isDark = (s: DisplaySettings) =>
  s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

/** The tokens switch on data-mode (tokens.css); the scene and the page behind it change palette. */
export function applyTheme(s: DisplaySettings) {
  const root = document.documentElement;
  const dark = isDark(s);
  const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
  root.dataset.mode = dark ? 'dark' : 'light';
  root.style.setProperty('--scene-bg', palette.bg);
  root.style.background = palette.bg;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.bg);
  const field = window.shapeField;
  if (field && field.preset.palette.bg !== palette.bg) field.setPalette(palette);
}

/** Motion off: the visitor's system asks for it, or they turned it off here. */
export const motionReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
