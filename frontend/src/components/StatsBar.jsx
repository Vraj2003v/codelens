import React from 'react';

export default function StatsBar({ history }) {
  if (!history.length) return null;
  const total = history.length;
  const clean = history.filter(r => !r.has_error).length;
  const byType = { syntax: 0, logical: 0, conceptual: 0, runtime: 0, type: 0, security: 0 };
  history.forEach(r => {
    if (r.error_type && r.error_type !== 'none') {
      byType[r.error_type] = (byType[r.error_type] || 0) + 1;
    }
  });

  // Only show error types that have > 0
  const errorItems = [
    { label: 'syntax',    val: byType.syntax,    color: 'var(--red)' },
    { label: 'logical',   val: byType.logical,   color: 'var(--accent)' },
    { label: 'conceptual',val: byType.conceptual,color: 'var(--purple)' },
    { label: 'runtime',   val: byType.runtime,   color: 'var(--orange)' },
    { label: 'type',      val: byType.type,      color: 'var(--blue)' },
    { label: 'security',  val: byType.security,  color: '#ff6b35' },
  ].filter(i => i.val > 0);

  const items = [
    { label: 'analyzed', val: total, color: 'var(--text-secondary)' },
    { label: 'clean', val: clean, color: 'var(--green)' },
    ...errorItems,
  ];

  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      padding: '0.45rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1.5rem',
      background: 'var(--surface)', flexShrink: 0, flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SESSION</span>
      {items.map(({ label, val, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color }}>{val}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
