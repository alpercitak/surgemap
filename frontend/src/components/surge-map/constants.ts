import type { DeckGLProps } from '@deck.gl/react';

// Amsterdam center
export const INITIAL_VIEW: DeckGLProps['initialViewState'] = {
  longitude: 4.9003,
  latitude: 52.3676,
  zoom: 11.5,
  pitch: 45,
  bearing: -10,
} as const;

// Surge color ramp: blue (low) → amber → red (surge)
// Each entry: [r, g, b]
export const COLOR_RANGE: Array<[number, number, number]> = [
  [0, 100, 220], // idle — cool blue
  [0, 180, 180], // slight demand — teal
  [250, 210, 0], // building — amber
  [255, 120, 0], // surge — orange
  [230, 30, 30], // high surge — red
  [180, 0, 80], // peak surge — deep red
] as const;

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
