import { Panel } from '@/components/panel';
import { StatusPill } from '@/components/status-pill';
import type { Status } from '@/types';
import styles from './index.module.css';

type WordmarkPanelProps = {
  status: Status;
};

export const WordmarkPanel = ({ status }: WordmarkPanelProps) => {
  return (
    <Panel className={styles['wordmark-panel']}>
      <span className={styles['wordmark-panel__logo']}>surgemap</span>
      <StatusPill status={status} />
    </Panel>
  );
};
