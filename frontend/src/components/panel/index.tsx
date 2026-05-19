import styles from './index.module.css';

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

export const Panel = ({ children, className }: PanelProps) => {
  return <div className={`${styles['panel']} ${className ?? ''}`}>{children}</div>;
};
