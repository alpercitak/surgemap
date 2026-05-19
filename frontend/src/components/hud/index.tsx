import { useMemo } from 'react';

export const Hud = ({ cells, status }) => {
  const stats = useMemo(() => {
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
    <>
      {/* Top-left — wordmark + status */}
      <div style={styles.wordmark}>
        <span style={styles.logo}>surgemap</span>
        <StatusPill status={status} />
      </div>

      {/* Top-right — live stats */}
      {stats && (
        <div style={styles.statsPanel}>
          <Stat label="active cells" value={stats.total} />
          <Stat label="surging" value={stats.surging} accent="#ff7800" />
          <Stat
            label="peak modifier"
            value={`${stats.maxMod.toFixed(2)}x`}
            accent={stats.maxMod > 2 ? '#e61e50' : '#fad200'}
          />
          <Stat label="demand / supply" value={`${stats.totalDemand} / ${stats.totalSupply}`} />
        </div>
      )}

      {/* Bottom-left — color legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>surge modifier</div>
        <LegendRow color="#0064dc" label="1.0x — idle" />
        <LegendRow color="#00b4b4" label="1.2x — low" />
        <LegendRow color="#fad200" label="1.5x — building" />
        <LegendRow color="#ff7800" label="2.0x — surge" />
        <LegendRow color="#e61e50" label="3.0x — peak" />
      </div>
    </>
  );
};

function StatusPill({ status }) {
  const map = {
    live: { color: '#00e676', label: 'live' },
    connecting: { color: '#fad200', label: 'connecting' },
    reconnecting: { color: '#ff7800', label: 'reconnecting' },
  };
  const { color, label } = map[status] || map.connecting;

  return (
    <div style={{ ...styles.pill, borderColor: color }}>
      <span style={{ ...styles.dot, background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ color, fontSize: 11 }}>{label}</span>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statValue, color: accent || '#e8eaf0' }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function LegendRow({ color, label }) {
  return (
    <div style={styles.legendRow}>
      <div style={{ ...styles.legendSwatch, background: color }} />
      <span>{label}</span>
    </div>
  );
}

const panel = {
  position: 'absolute',
  background: 'rgba(8, 12, 16, 0.82)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 6,
  color: '#a0a8b8',
  fontFamily: "'DM Mono', monospace",
};

const styles = {
  wordmark: {
    ...panel,
    top: 20,
    left: 20,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#e8eaf0',
    letterSpacing: '-0.03em',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 8px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 11,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 2s infinite',
  },
  statsPanel: {
    ...panel,
    top: 20,
    right: 20,
    padding: '12px 16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px 20px',
    minWidth: 200,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 500,
    color: '#e8eaf0',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#505870',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  legend: {
    ...panel,
    bottom: 32,
    left: 20,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  legendTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#505870',
    marginBottom: 4,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  },
};
