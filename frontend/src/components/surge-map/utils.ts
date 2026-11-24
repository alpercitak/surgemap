import { ColumnLayer } from '@deck.gl/layers';
import type { Cell, Modifier } from '@/types';
import { MODIFIER_LEVELS } from './constants';

const findLevel = (modifier: number) => MODIFIER_LEVELS.find((l) => modifier >= l.min);

export const getModifierLevel = (modifier: number): Modifier => findLevel(modifier).level;

export const getModifierColorRGB = (modifier: number) => findLevel(modifier).rgb;

export const getModifierColor = (modifier: number) => {
  const [r, g, b] = getModifierColorRGB(modifier);
  return `rgb(${r},${g},${b})`;
};

export const formatTooltip = (object: Cell) => {
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

export const getLayer = (cells: Array<Cell>) =>
  new ColumnLayer<Cell>({
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
