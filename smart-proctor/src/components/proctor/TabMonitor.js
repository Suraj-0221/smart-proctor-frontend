import React, { useEffect, useRef, useState } from 'react';

export default function TabMonitor({ onTabSwitch }) {
  const [switchCount, setSwitchCount]     = useState(0);
  const [lastSwitchAt, setLastSwitchAt]   = useState(null);
  const [isVisible,    setIsVisible]      = useState(true);
  const hiddenAt = useRef(null);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (!visible) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current) {
        const duration = Date.now() - hiddenAt.current;
        setSwitchCount(c => c + 1);
        setLastSwitchAt(new Date().toLocaleTimeString());
        onTabSwitch?.({ duration, count: switchCount + 1 });
        hiddenAt.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onTabSwitch, switchCount]);

  return (
    <div style={styles.row}>
      <div style={styles.item}>
        <span style={styles.label}>TAB SWITCHES</span>
        <span style={{ ...styles.value, color: switchCount > 0 ? 'var(--red)' : 'var(--green)' }}>
          {switchCount}
        </span>
      </div>
      <div style={styles.item}>
        <span style={styles.label}>WINDOW FOCUS</span>
        <span style={styles.dot(isVisible)} />
        <span style={{ ...styles.value, color: isVisible ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
          {isVisible ? 'ACTIVE' : 'AWAY'}
        </span>
      </div>
      {lastSwitchAt && (
        <div style={styles.item}>
          <span style={styles.label}>LAST SWITCH</span>
          <span style={{ ...styles.value, fontSize: 11 }}>{lastSwitchAt}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '6px 10px',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  dot: (active) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: active ? 'var(--green)' : 'var(--red)',
    boxShadow: active ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
  }),
};
