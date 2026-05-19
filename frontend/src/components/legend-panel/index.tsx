import { LegendItem } from '@/components/legend-item';
import { Panel } from '@/components/panel';
import type { Modifier } from '@/types';
import styles from './index.module.css';

const MODIFIERS: ReadonlyArray<Modifier> = ['idle', 'low', 'building', 'surge', 'peak'];

export const LegendPanel = () => {
  return (
    <Panel className={styles['legend-panel']}>
      <div className={styles['legend-panel__title']}>surge modifier</div>
      {MODIFIERS.map((m) => (
        <LegendItem key={m} modifier={m} />
      ))}
    </Panel>
  );
};
