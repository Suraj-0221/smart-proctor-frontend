import React from 'react';

const ICONS = {
  NO_FACE:        '👤',
  MULTIPLE_FACES: '👥',
  TAB_SWITCH:     '🔄',
};

const LABELS = {
  NO_FACE:        'Face Left Frame',
  MULTIPLE_FACES: 'Multiple Faces',
  TAB_SWITCH:     'Tab Switch',
};

const COLORS = {
  NO_FACE:        { bg: 'var(--red-glow)',   border: 'rgba(255,59,92,0.35)',   text: 'var(--red)'   },
  MULTIPLE_FACES: { bg: 'var(--amber-glow)', border: 'rgba(255,184,0,0.35)',  text: 'var(--amber)' },
  TAB_SWITCH:     { bg: 'var(--amber-glow)', border: 'rgba(255,184,0,0.35)',  text: 'var(--amber)' },
};

export default function WarningBadges({ violations = [] }) {
  // Aggregate counts
  const counts = violations.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(counts).length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyDot} />
        <span style={styles.emptyText}>No violations detected</span>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {Object.entries(counts).map(([type, count]) => {
        const c = COLORS[type] || COLORS.NO_FACE;
        return (
          <div key={type} style={{ ...styles.badge, background: c.bg, border: `1px solid ${c.border}` }}>
            <span style={styles.icon}>{ICONS[type] || '⚠️'}</span>
            <div style={styles.info}>
              <span style={{ ...styles.name, color: c.text }}>{LABELS[type] || type}</span>
              <span style={styles.count}>{count}×</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    fontWeight: 600,
  },
  count: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    display: 'inline-block',
  },
  emptyText: {},
};
