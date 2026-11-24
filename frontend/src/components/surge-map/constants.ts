import type { DeckGLProps } from '@deck.gl/react';
import type { Modifier } from '@/types';

// Amsterdam center
export const INITIAL_VIEW: DeckGLProps['initialViewState'] = {
  longitude: 4.9003,
  latitude: 52.3676,
  zoom: 11.5,
  pitch: 45,
  bearing: -10,
} as const;

// Surge levels, highest first: minimum modifier and [r, g, b].
// Must match the legend labels and --color-modifier-* in global.css.
export const MODIFIER_LEVELS: ReadonlyArray<{ level: Modifier; min: number; rgb: [number, number, number] }> = [
  { level: 'peak', min: 3.0, rgb: [230, 30, 80] },
  { level: 'surge', min: 2.0, rgb: [255, 120, 0] },
  { level: 'building', min: 1.5, rgb: [250, 210, 0] },
  { level: 'low', min: 1.2, rgb: [0, 180, 180] },
  { level: 'idle', min: -Infinity, rgb: [0, 100, 220] },
];

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
