import { Panel } from '@/components/panel';
import { StatsItem } from '@/components/stats-item';
import type { Stats } from '@/types';
import styles from './index.module.css';

type StatsPanelProps = {
  stats: Stats;
};

export const StatsPanel = ({ stats }: StatsPanelProps) => {
  return (
    <Panel className={styles['stats-panel']}>
      <StatsItem label="active cells" value={stats.total} />
      <StatsItem label="surging" value={stats.surging} modifier="surge" />
      <StatsItem
        label="peak modifier"
        value={`${stats.maxMod.toFixed(1)}x`}
        modifier={stats.maxMod > 2 ? 'peak' : 'building'}
      />
      <StatsItem label="demand / supply" value={`${stats.totalDemand} / ${stats.totalSupply}`} />
    </Panel>
  );
};
