// Taos icon set, exported from the Taos Style Guide (Figma) as currentColor SVGs.
// One import feeds both the 2D components (inline SVG) and the 3D Glyphs scene (extruded paths).
const files = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true });

export const icons: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [path.split('/').pop()!.replace('.svg', ''), svg]),
);

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons).sort();
