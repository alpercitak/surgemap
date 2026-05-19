import { useMemo } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL, { type DeckGLProps } from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';

// Amsterdam center
const INITIAL_VIEW: DeckGLProps['initialViewState'] = {
  longitude: 4.9003,
  latitude: 52.3676,
  zoom: 11.5,
  pitch: 45,
  bearing: -10,
} as const;

// Surge color ramp: blue (low) → amber → red (surge)
// Each entry: [r, g, b]
const COLOR_RANGE = [
  [0, 100, 220], // idle — cool blue
  [0, 180, 180], // slight demand — teal
  [250, 210, 0], // building — amber
  [255, 120, 0], // surge — orange
  [230, 30, 30], // high surge — red
  [180, 0, 80], // peak surge — deep red
];

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const SurgeMap = ({ cells }) => {
  const layer = useMemo(
    () =>
      new HexagonLayer({
        id: 'surge-hex',
        data: cells,
        getPosition: (d) => [d.lng, d.lat],

        // Weight both color and elevation by the surge modifier (1.0–3.0)
        getColorWeight: (d) => d.modifier,
        getElevationWeight: (d) => d.modifier,

        colorAggregation: 'MAX',
        elevationAggregation: 'MAX',

        radius: 350, // ~matches H3 resolution 7 cell size
        elevationScale: 120,
        extruded: true,
        pickable: true,

        colorRange: COLOR_RANGE,

        // Smooth transitions on update
        transitions: {
          elevationScale: 300,
        },

        // Opacity: slightly transparent so base map bleeds through
        opacity: 0.82,
      }),
    [cells],
  );

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller={true}
      layers={[layer]}
      getTooltip={({ object }) => object && formatTooltip(object)}
    >
      <Map mapStyle={MAP_STYLE} />
    </DeckGL>
  );
};

const formatTooltip = (object) => {
  const { points } = object;
  if (!points?.length) {
    return null;
  }

  // deck.gl HexagonLayer aggregates — sum modifier from all points in cell
  const maxModifier = Math.max(...points.map((p) => p.source.modifier));
  const count = points.length;

  return {
    html: `
      <div style="font-family: 'DM Mono', monospace; font-size: 12px; line-height: 1.6;">
        <div style="font-weight: 500; color: ${modifierColor(maxModifier)}">
          ${maxModifier.toFixed(2)}x surge
        </div>
        <div style="color: #888; font-size: 11px">${count} event${count !== 1 ? 's' : ''} in window</div>
      </div>
    `,
    style: {
      background: '#0d1117',
      border: '1px solid #222',
      borderRadius: '4px',
      padding: '8px 10px',
    },
  };
};

const modifierColor = (modifier) => {
  if (modifier >= 2.5) return '#e61e50';
  if (modifier >= 2.0) return '#ff7800';
  if (modifier >= 1.5) return '#fad200';
  return '#00b4b4';
};
