import { ColumnLayer } from '@deck.gl/layers';
import { COLOR_RANGE } from './constants';
import type { CellState } from './types';

export const getModifierColorRGB = (modifier: number) => {
  if (modifier >= 2.5) return COLOR_RANGE[5];
  if (modifier >= 2.0) return COLOR_RANGE[4];
  if (modifier >= 1.5) return COLOR_RANGE[3];
  if (modifier >= 1.0) return COLOR_RANGE[2];
  return COLOR_RANGE[1];
};

export const getModifierColor = (modifier: number) => {
  const [r, g, b] = getModifierColorRGB(modifier);
  return `rgb(${r},${g},${b})`;
};

export const formatTooltip = (object: CellState) => {
  if (!object) {
    return null;
  }
  const { modifier, demand, supply } = object;

  return {
    html: `
      <div class="sm-tooltip">
        <div style="color: ${getModifierColor(modifier)}">${modifier.toFixed(1)}x surge</div>
        <div>${demand} demand / ${supply} supply</div>
      </div>
    `,
    style: {
      background: 'var(--card-background)',
      border: 'var(--card-border)',
      borderRadius: 'var(--card-border-radius)',
    },
  };
};

export const getLayer = (cells: Array<CellState>) =>
  new ColumnLayer<CellState>({
    id: 'surge',
    data: cells,
    getPosition: (d) => [d.lng, d.lat],
    getElevation: (d) => d.modifier * 200,
    getFillColor: (d) => getModifierColorRGB(d.modifier),
    radius: 350,
    pickable: true,
    extruded: true,
    diskResolution: 6,
    updateTriggers: {
      getElevation: cells,
      getFillColor: cells,
    },
  });
