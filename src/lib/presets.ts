// Concepts = presets. A preset is everything needed to reproduce a look:
// the scene family, its palette, its parameters, and the card treatment.
// The lab edits these live; "Copy preset" exports one as JSON to paste back here.
import { taos } from './tokens';

export type FamilyId = 'pueblo' | 'ridgeline' | 'petal' | 'glyphs';
export type Tone = 'color' | 'neutral';
export type Mode = 'light' | 'dark';

export interface ScenePalette {
  /** Scene background (what shows around the card). */
  bg: string;
  /** Ordered colors; each family documents how it reads them. */
  colors: string[];
  /** Side walls of extruded forms (Glyphs). Defaults to True Black 80%. */
  extrusion?: string;
}

export interface SceneParams {
  /** 0–1. How many forms (columns, ridges, petals, glyphs). Rebuilds the scene. */
  density: number;
  /** Degrees. Rolls the whole scene, for the diagonal Koto-style composition. */
  tilt: number;
  /** Degrees. Which side of each form catches the light. */
  light: number;
  /** 0–2. Ambient motion speed. 0 = still. */
  speed: number;
  /** 0.5–2. Zoom. */
  scale: number;
  /** Random seed for layout. Rebuilds the scene. */
  seed: number;
  /** 0–1. How strongly a hovered link's accent tints the scene. */
  tint?: number;
  // ── Glyphs ──────────────────────────────────────────
  /** 0.5–2. Glyph size multiplier. */
  size?: number;
  /** 0.3–3. Extrusion depth multiplier. Rebuilds. */
  depth?: number;
  /** 0–3. How far glyphs spread in depth (parallax). Rebuilds. */
  spread?: number;
  /** 0–2. Rotation amount. */
  tumble?: number;
  /** 0–1. Shade difference between the lit and shaded side walls. */
  contrast?: number;
  /**
   * Glyph arrangement. Rebuilds.
   * scatter: loose, each glyph drifts at its own speed (the field loosens over time).
   * grid: even rows and columns. checker: alternate squares, so neighbours sit on the diagonals.
   * Grid and checker drift as one sheet, so the spacing stays even.
   */
  layout?: GlyphLayout;
  /** 0–1. Grid and checker only: random offset from each glyph's spot (up to half a row). Rebuilds. */
  jitter?: number;
}

export type GlyphLayout = 'scatter' | 'grid' | 'checker';

/**
 * How many glyphs a density (0–1) means: the count over the whole field, about a third of
 * which is on screen. Grid and checker go about twice as dense, since even spacing has no
 * clumps to fill the view.
 */
export const glyphCount = (density: number, layout: GlyphLayout = 'scatter') =>
  Math.round(14 + ((layout === 'scatter' ? 48 : 96) - 14) * density);

export interface CardStyle {
  mode: Mode;
  /** px */
  radius: number;
}

export interface Preset {
  id: string;
  name: string;
  family: FamilyId;
  tone: Tone;
  palette: ScenePalette;
  params: SceneParams;
  card: CardStyle;
  /** When true, hovering a link tints the scene with that link's accent. */
  sceneAccent: boolean;
  /** Glyphs only: which Taos icons appear. Empty or missing = all. */
  glyphs?: string[];
  /** Which named palette this preset started from (lab bookkeeping). */
  paletteId?: string;
}

const L = (hue: Parameters<typeof taos>[1], step: Parameters<typeof taos>[2]) => taos('light', hue, step);
const D = (hue: Parameters<typeof taos>[1], step: Parameters<typeof taos>[2]) => taos('dark', hue, step);

/** "True Black 80%" in the Taos guide: the 500 step of the True Black ramp. */
export const TRUE_BLACK_80 = L('black', '500');

export const GLYPH_DEFAULTS: SceneParams = {
  density: 0.62,
  tilt: -8,
  light: 40,
  speed: 1,
  scale: 1,
  seed: 5,
  tint: 0.85,
  size: 1,
  depth: 1,
  spread: 1,
  tumble: 1,
  contrast: 0.35,
  layout: 'scatter',
  jitter: 0,
};

export const presets: Preset[] = [
  // ── Pueblo: stepped adobe blocks. colors = [top, lit side, shade side, alt top]
  {
    id: 'pueblo-color',
    name: 'Pueblo · Color',
    family: 'pueblo',
    tone: 'color',
    palette: { bg: D('black', '300'), colors: [L('lavender', '400'), L('fire', '600'), D('fire', '300'), L('alpenglow', '600')] },
    params: { density: 0.55, tilt: -12, light: 315, speed: 1, scale: 1, seed: 7 },
    card: { mode: 'light', radius: 0 },
    sceneAccent: true,
  },
  {
    id: 'pueblo-neutral',
    name: 'Pueblo · Neutral',
    family: 'pueblo',
    tone: 'neutral',
    palette: { bg: L('saddle', '300'), colors: [L('saddle', '200'), L('saddle', '400'), L('saddle', '500'), '#FFFFFF'] },
    params: { density: 0.55, tilt: -12, light: 315, speed: 0.8, scale: 1, seed: 7 },
    card: { mode: 'light', radius: 0 },
    sceneAccent: false,
  },
  // ── Ridgeline: layered ridges, back → front. colors = gradient stops back → front
  {
    id: 'ridgeline-color',
    name: 'Ridgeline · Color',
    family: 'ridgeline',
    tone: 'color',
    palette: {
      bg: L('alpenglow', '200'),
      colors: [L('alpenglow', '400'), L('fire', '400'), L('lavender', '500'), D('lavender', '400'), D('indigo', '300'), L('shadow', '600')],
    },
    params: { density: 0.5, tilt: 0, light: 300, speed: 1, scale: 1, seed: 3 },
    card: { mode: 'light', radius: 22 },
    sceneAccent: true,
  },
  {
    id: 'ridgeline-neutral',
    name: 'Ridgeline · Neutral',
    family: 'ridgeline',
    tone: 'neutral',
    palette: {
      bg: L('saddle', '200'),
      colors: [L('shadow', '200'), L('shadow', '300'), L('shadow', '400'), L('shadow', '500'), L('shadow', '600')],
    },
    params: { density: 0.5, tilt: 0, light: 300, speed: 0.8, scale: 1, seed: 3 },
    card: { mode: 'light', radius: 22 },
    sceneAccent: false,
  },
  // ── Petal: soft folded forms. colors = [shade, mid, highlight, sheen]
  {
    id: 'petal-color',
    name: 'Petal · Color',
    family: 'petal',
    tone: 'color',
    palette: { bg: L('lavender', '600'), colors: [L('fire', '500'), L('coral', '600'), L('verde', '300'), L('sun', '400')] },
    params: { density: 0.45, tilt: 10, light: 210, speed: 1, scale: 1, seed: 11 },
    card: { mode: 'light', radius: 14 },
    sceneAccent: true,
  },
  {
    id: 'petal-neutral',
    name: 'Petal · Neutral (dark)',
    family: 'petal',
    tone: 'neutral',
    palette: { bg: D('black', '400'), colors: [D('shadow', '500'), L('shadow', '200'), L('saddle', '200'), L('lavender', '200')] },
    params: { density: 0.45, tilt: 10, light: 210, speed: 0.8, scale: 1, seed: 11 },
    card: { mode: 'dark', radius: 14 },
    sceneAccent: false,
  },
  // ── Glyphs: extruded Taos icons. colors = face colors (any number), extrusion = side walls
  // Andy's pick (2026-11-05, second round): Adobe palette, loose checker layout, larger glyphs,
  // no depth spread, 16 of the 21 icons.
  {
    id: 'glyphs-color',
    name: 'Glyphs · Adobe',
    family: 'glyphs',
    tone: 'color',
    paletteId: 'adobe',
    palette: {
      bg: '#F8E5D0',
      extrusion: '#754029',
      colors: ['#E49065', '#D74C07', '#9D7F6B', '#836442', '#FECDCA', '#FAB469'],
    },
    params: {
      density: 0.63,
      tilt: 20,
      light: 40,
      speed: 1,
      scale: 1.34,
      seed: 5,
      tint: 0.85,
      size: 1.44,
      depth: 1.45,
      spread: 0,
      tumble: 1,
      contrast: 0.74,
      layout: 'checker',
      jitter: 0.79,
    },
    card: { mode: 'light', radius: 32 },
    sceneAccent: true,
    glyphs: [
      'alpenglow',
      'cactus',
      'cloud',
      'compass',
      'crown',
      'eye',
      'feather',
      'fox',
      'hank',
      'ladder',
      'lightning',
      'mirage',
      'moon',
      'spark',
      'spiral',
      'sun',
    ],
  },
  {
    id: 'glyphs-neutral',
    name: 'Glyphs · Charcoal',
    family: 'glyphs',
    tone: 'neutral',
    paletteId: 'charcoal',
    palette: { bg: L('saddle', '200'), colors: [L('shadow', '600'), L('shadow', '400'), L('shadow', '200')], extrusion: TRUE_BLACK_80 },
    params: { ...GLYPH_DEFAULTS, speed: 0.8 },
    card: { mode: 'light', radius: 22 },
    sceneAccent: true,
  },
];

export const defaultPreset = presets.find((p) => p.id === 'glyphs-color')!;
export const presetById = (id: string) => presets.find((p) => p.id === id) ?? defaultPreset;

/** Swatches the lab's Shuffle/Randomize may draw from, per tone. */
export const swatchPool: Record<Tone, string[]> = {
  color: [
    L('fire', '600'), L('fire', '400'), D('fire', '300'), L('alpenglow', '600'), L('alpenglow', '400'),
    L('lavender', '600'), L('lavender', '400'), L('coral', '600'), L('verde', '600'), L('verde', '300'),
    L('indigo', '600'), D('indigo', '300'), L('sun', '600'), L('sun', '300'), L('shadow', '600'),
  ],
  neutral: [
    L('saddle', '200'), L('saddle', '300'), L('saddle', '400'), L('saddle', '500'), L('saddle', '600'),
    L('shadow', '200'), L('shadow', '300'), L('shadow', '400'), L('shadow', '500'), L('shadow', '600'),
    D('black', '300'), D('black', '400'), '#FFFFFF',
  ],
};

// ── Named palettes (Glyphs) ─────────────────────────────────────────────────────
// Each pairs face colors with an extrusion color chosen to sit under them.
export type PaletteKind = 'color' | 'earth' | 'mono';
export interface NamedPalette {
  id: string;
  name: string;
  kind: PaletteKind;
  palette: ScenePalette;
  /** Card mode that reads best on this background. */
  mode: Mode;
}

export const glyphPalettes: NamedPalette[] = [
  // Color
  { id: 'taos', name: 'Taos', kind: 'color', mode: 'light', palette: { bg: L('sun', '300'), extrusion: TRUE_BLACK_80, colors: [L('fire', '600'), L('verde', '600'), L('indigo', '600'), L('lavender', '600'), L('alpenglow', '600'), L('coral', '600')] } },
  { id: 'pool', name: 'Pool', kind: 'color', mode: 'light', palette: { bg: L('indigo', '200'), extrusion: TRUE_BLACK_80, colors: [L('indigo', '600'), L('verde', '400'), L('lavender', '500'), L('sun', '600'), L('verde', '600')] } },
  { id: 'sunset', name: 'Sunset', kind: 'color', mode: 'light', palette: { bg: L('lavender', '200'), extrusion: D('lavender', '300'), colors: [L('alpenglow', '600'), L('fire', '500'), L('coral', '600'), L('lavender', '600'), L('fire', '600')] } },
  { id: 'night', name: 'Night', kind: 'color', mode: 'dark', palette: { bg: D('black', '400'), extrusion: D('black', '200'), colors: [L('fire', '600'), L('sun', '600'), L('lavender', '600'), L('verde', '400'), L('coral', '600'), L('indigo', '500')] } },
  // Earth
  { id: 'earth', name: 'Earth', kind: 'earth', mode: 'light', palette: { bg: L('saddle', '300'), extrusion: D('fire', '200'), colors: [L('saddle', '600'), L('fire', '500'), D('alpenglow', '400'), D('fire', '300'), D('verde', '400'), D('sun', '500')] } },
  { id: 'adobe', name: 'Adobe', kind: 'earth', mode: 'light', palette: { bg: L('alpenglow', '200'), extrusion: D('fire', '300'), colors: [L('fire', '400'), L('fire', '600'), L('saddle', '600'), D('alpenglow', '300'), L('coral', '600'), L('alpenglow', '500')] } },
  { id: 'sage', name: 'Sage & Clay', kind: 'earth', mode: 'light', palette: { bg: L('saddle', '200'), extrusion: D('verde', '200'), colors: [L('verde', '500'), D('verde', '400'), L('saddle', '500'), L('fire', '400'), D('sun', '400')] } },
  { id: 'mesa', name: 'Mesa Night', kind: 'earth', mode: 'light', palette: { bg: D('fire', '200'), extrusion: L('black', '600'), colors: [L('sun', '400'), L('alpenglow', '600'), L('fire', '500'), L('saddle', '400'), L('verde', '300')] } },
  // Mono
  { id: 'charcoal', name: 'Charcoal', kind: 'mono', mode: 'light', palette: { bg: L('saddle', '200'), extrusion: TRUE_BLACK_80, colors: [L('shadow', '600'), L('shadow', '400'), L('shadow', '200')] } },
  { id: 'paper', name: 'Paper', kind: 'mono', mode: 'light', palette: { bg: L('saddle', '300'), extrusion: TRUE_BLACK_80, colors: ['#FFFFFF', L('saddle', '200')] } },
  { id: 'ink', name: 'Ink', kind: 'mono', mode: 'dark', palette: { bg: D('black', '300'), extrusion: D('black', '500'), colors: [L('saddle', '200'), L('shadow', '300'), L('shadow', '500')] } },
  { id: 'fire', name: 'Fire', kind: 'mono', mode: 'light', palette: { bg: L('fire', '200'), extrusion: D('fire', '300'), colors: [L('fire', '600'), L('fire', '500'), L('fire', '400'), L('fire', '300')] } },
  { id: 'indigo', name: 'Indigo', kind: 'mono', mode: 'light', palette: { bg: L('indigo', '200'), extrusion: D('indigo', '300'), colors: [L('indigo', '600'), L('indigo', '500'), L('indigo', '400'), L('indigo', '300')] } },
  { id: 'verde', name: 'Verde', kind: 'mono', mode: 'light', palette: { bg: L('verde', '200'), extrusion: D('verde', '200'), colors: [L('verde', '600'), L('verde', '500'), L('verde', '400'), L('verde', '300')] } },
  { id: 'lavender', name: 'Lavender', kind: 'mono', mode: 'light', palette: { bg: L('lavender', '200'), extrusion: D('lavender', '300'), colors: [L('lavender', '600'), L('lavender', '500'), L('lavender', '400'), L('lavender', '300')] } },
];
