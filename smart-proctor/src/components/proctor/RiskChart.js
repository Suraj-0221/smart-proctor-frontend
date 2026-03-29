import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function RiskChart({ history = [] }) {
  const data = history.map((r, i) => ({
    t: i,
    risk: Math.round(r * 100),
  }));

  const latest = data[data.length - 1]?.risk ?? 0;
  const color  = latest < 30 ? '#00e676' : latest < 60 ? '#ffb800' : '#ff3b5c';

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.label}>RISK TIMELINE</span>
        <span style={{ ...styles.value, color }}>{latest}%</span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2d47" strokeDasharray="3 3" />
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 100]} tick={{ fill: '#3a4a66', fontSize: 9, fontFamily: 'Space Mono' }} />
          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid #1e2d47',
              borderRadius: 6,
              fontFamily: 'Space Mono',
              fontSize: 11,
            }}
            labelStyle={{ color: '#6b7fa3' }}
            itemStyle={{ color }}
            formatter={(v) => [`${v}%`, 'Risk']}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke={color}
            strokeWidth={2}
            fill="url(#riskGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.12em',
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 20,
    fontWeight: 700,
  },
};
