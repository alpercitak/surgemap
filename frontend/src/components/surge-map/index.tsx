import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { INITIAL_VIEW, MAP_STYLE } from './constants';
import { formatTooltip, getLayer } from './utils';
import type { SurgeMapProps } from './types';

export const SurgeMap = ({ cells }: SurgeMapProps) => {
  const layer = getLayer(cells);

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
