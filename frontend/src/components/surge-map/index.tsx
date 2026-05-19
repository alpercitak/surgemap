import { useMemo } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { HexagonLayer, type HexagonLayerProps } from '@deck.gl/aggregation-layers';
import { COLOR_RANGE, INITIAL_VIEW, MAP_STYLE } from './constants';

type SurgeMapProps = {
  cells: HexagonLayerProps['data'];
};

export const SurgeMap = ({ cells }: SurgeMapProps) => {
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

const modifierColor = (modifier: number) => {
  if (modifier >= 2.5) return 'var(--color-modifier-peak)';
  if (modifier >= 2.0) return 'var(--color-modifier-surge)';
  if (modifier >= 1.5) return 'var(--color-modifier-building)';
  return 'var(--color-modifier-low)';
};
