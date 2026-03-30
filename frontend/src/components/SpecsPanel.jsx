import React, { useState } from 'react';

const TYPE_CLR = { syntax: 'var(--red)', logical: 'var(--accent)', conceptual: 'var(--purple)', runtime: 'var(--orange)', type: 'var(--blue)', security: '#ff6b35' };

export default function SpecsPanel({ specs }) {
  const [open, setOpen] = useState(true);
  const items = (specs?.specifications || []).map(s => {
    const m = s.match(/^(s\d+):\s*(.*)/);
    return m ? { id: m[1], text: m[2] } : { id: '?', text: s };
  });
  const taxonomy = specs?.taxonomy || {};

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        padding: '0.7rem 0.9rem', borderBottom: open ? '1px solid var(--border)' : 'none',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', width: '100%', textAlign: 'left',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', flex: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          ◈ Specifications
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto' }}>
          {items.map(({ id, text }) => (
            <div key={id} style={{
              padding: '0.4rem 0.6rem', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)',
                background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.3)',
                borderRadius: 3, padding: '1px 4px', flexShrink: 0, marginTop: 1,
              }}>{id}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}

          {Object.keys(taxonomy).length > 0 && (
            <div style={{ marginTop: '0.4rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.2rem' }}>
                Error Taxonomy
              </div>
              {Object.entries(taxonomy).map(([type, desc]) => {
                const color = TYPE_CLR[type] || 'var(--text-secondary)';
                return (
                  <div key={type} style={{
                    padding: '0.4rem 0.6rem', background: `${color}08`,
                    border: `1px solid ${color}25`, borderRadius: 'var(--r-sm)', marginBottom: '0.3rem',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{type}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {desc.split(':').slice(1).join(':').trim()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
