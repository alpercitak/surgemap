import clsx from 'clsx';
import type { Modifier } from '@/types';
import styles from './index.module.css';

type LegendItemProps = {
  modifier: Modifier;
};

const MAP = {
  idle: '1.0',
  low: '1.2',
  building: '1.5',
  surge: '2.0',
  peak: '3.0',
} as const satisfies Record<Modifier, string>;

export const LegendItem = ({ modifier }: LegendItemProps) => {
  const label = `${MAP[modifier]}x [${modifier}]`;
  return (
    <div className={styles['legend-item']}>
      <div className={clsx(styles['legend-item__swatch'], styles[`legend-item__swatch--${modifier}`])} />
      <span>{label}</span>
    </div>
  );
};
