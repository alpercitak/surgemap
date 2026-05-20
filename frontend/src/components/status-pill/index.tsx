import clsx from 'clsx';
import type { Status } from '@/types';
import styles from './index.module.css';

type StatusPillProps = {
  status: Status;
};

const LABEL_MAP = {
  live: 'live',
  connecting: 'connecting',
  reconnecting: 'reconnecting',
  demo: 'demo',
} as const satisfies Record<Status, string>;

export const StatusPill = ({ status }: StatusPillProps) => {
  const label = LABEL_MAP[status] ?? LABEL_MAP.connecting;

  return (
    <div className={clsx(styles['status-pill'], styles[`status-pill--${status}`])}>
      <span className={styles['status-pill__dot']} />
      <span className={styles['status-pill__label']}>{label}</span>
    </div>
  );
};
