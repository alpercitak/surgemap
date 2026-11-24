import DeckGL from '@deck.gl/react';
import { Map as MapView } from 'react-map-gl/maplibre';
import { INITIAL_VIEW, MAP_STYLE } from './constants';
import type { SurgeMapProps } from './types';
import { formatTooltip, getLayer } from './utils';

export const SurgeMap = ({ cells }: SurgeMapProps) => {
  const layer = getLayer(cells);

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller={true}
      layers={[layer]}
      getTooltip={({ object }) => object && formatTooltip(object)}
    >
      <MapView mapStyle={MAP_STYLE} />
    </DeckGL>
  );
};
