import { clsx } from 'clsx';
import type { Modifier } from '@/types';
import styles from './index.module.css';

type StatsItemProps = {
  label: string;
  value: string | number;
  modifier?: Modifier;
};

export const StatsItem = ({ label, value, modifier }: StatsItemProps) => {
  return (
    <div className={styles['stats-item']}>
      <div className={clsx(styles['stats-item__value'], styles[`stats-item__value--${modifier}`])}>{value}</div>
      <div className={styles['stats-item__label']}>{label}</div>
    </div>
  );
};
