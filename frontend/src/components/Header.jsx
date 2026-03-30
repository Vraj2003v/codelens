import React from 'react';

const LANG_COLORS = {
  python: '#e8c547', javascript: '#f7df1e', typescript: '#3178c6',
  java: '#e87b47', c: '#a8b9cc', cpp: '#00599c', csharp: '#9b4f96',
  go: '#00acd7', rust: '#ce412b', php: '#7b7fb5', ruby: '#cc342d',
  swift: '#f05138', kotlin: '#7f52ff', sql: '#4caf78', html: '#e34c26',
  css: '#264de4', bash: '#4eaa25',
};

export default function Header({ language, detectedLanguage }) {
  const displayLang = detectedLanguage || language || null;
  const langColor = displayLang ? (LANG_COLORS[displayLang.toLowerCase()] || 'var(--text-secondary)') : null;

  return (
    <header style={{
      height: 52,
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 200,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4l3 3-3 3M7 10h5" stroke="#0d0d0d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          letterSpacing: '0.06em', color: 'var(--text-primary)',
          lineHeight: 1,
        }}>CODELENS</span>
        <span style={{
          fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
          color: 'var(--accent)', border: '1px solid var(--accent)',
          borderRadius: 3, padding: '1px 5px', letterSpacing: '0.08em',
        }}>v5</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {displayLang && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: langColor }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: langColor, textTransform: 'capitalize',
            }}>{displayLang}</span>
          </div>
        )}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          color: 'var(--text-muted)', letterSpacing: '0.04em',
        }}>Llama-3.3-70B · Groq</span>
      </div>
    </header>
  );
}
