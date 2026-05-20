import { useMemo } from 'react';
import { SurgeMap } from '@/components/surge-map';
import { useData } from '@/hooks/data';
import { LegendPanel } from '@/components/legend-panel';
import { StatsPanel } from '@/components/stats-panel';
import { WordmarkPanel } from '@/components/wordmark-panel';
import type { Stats } from '@/types';
import styles from './index.module.css';

export const App = () => {
  const { cells, status } = useData();

  const stats = useMemo<Stats>(() => {
    if (!cells.length) {
      return null;
    }
    const surging = cells.filter((c) => c.modifier > 1.0).length;
    const maxMod = Math.max(...cells.map((c) => c.modifier));
    const totalDemand = cells.reduce((s, c) => s + c.demand, 0);
    const totalSupply = cells.reduce((s, c) => s + c.supply, 0);
    return { surging, maxMod, totalDemand, totalSupply, total: cells.length };
  }, [cells]);

  return (
    <div className={styles['app']}>
      <SurgeMap cells={cells} />
      <WordmarkPanel status={status} />
      {stats && <StatsPanel stats={stats} />}
      <LegendPanel />
    </div>
  );
};
