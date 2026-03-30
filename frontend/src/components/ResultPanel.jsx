import React, { useState } from 'react';

const TYPE_CFG = {
  none:       { color: 'var(--green)',  bg: 'var(--green-dim)',  label: 'CLEAN',       sym: '✓' },
  syntax:     { color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'SYNTAX ERR',  sym: '✕' },
  logical:    { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'LOGIC ERR',   sym: '△' },
  conceptual: { color: 'var(--purple)', bg: 'var(--purple-dim)', label: 'CONCEPT ERR', sym: '◇' },
  runtime:    { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'RUNTIME ERR', sym: '⚡' },
  type:       { color: 'var(--blue)',   bg: 'var(--blue-dim)',   label: 'TYPE ERR',    sym: '⊘' },
  security:   { color: '#ff6b35',       bg: 'rgba(255,107,53,0.1)', label: 'SEC ISSUE', sym: '⚠' },
};

const SEV_CLR = { none: 'var(--green)', low: 'var(--blue)', medium: 'var(--accent)', high: 'var(--red)' };

const LANG_CLR = {
  python: '#e8c547', javascript: '#f7df1e', typescript: '#3178c6', java: '#e87b47',
  c: '#a8b9cc', 'c++': '#00599c', 'c#': '#9b4f96', go: '#00acd7', rust: '#ce412b',
  php: '#7b7fb5', ruby: '#cc342d', swift: '#f05138', kotlin: '#7f52ff', sql: '#4caf78',
  html: '#e34c26', css: '#264de4', bash: '#4eaa25',
};

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
      color, background: color + '18', border: `1px solid ${color}40`,
      borderRadius: 3, padding: '1px 6px', textTransform: 'uppercase',
    }}>{children}</span>
  );
}

function Card({ label, icon, children, accent }) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.5rem 0.8rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: accent ? `${accent}08` : 'transparent',
      }}>
        <span style={{ fontSize: '0.7rem' }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em',
          color: accent || 'var(--text-muted)', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{ padding: '0.75rem 0.9rem' }}>{children}</div>
    </div>
  );
}

function ErrItem({ err, color }) {
  return (
    <div style={{
      padding: '0.55rem 0.7rem', background: `${color}08`,
      border: `1px solid ${color}25`, borderRadius: 'var(--r-sm)', marginBottom: '0.4rem',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
        {err.line && <Tag color="var(--text-secondary)">line {err.line}</Tag>}
        {err.type && <Tag color={color}>{err.type}</Tag>}
      </div>
      <div style={{ fontSize: '0.79rem', color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{err.description}</div>
      {err.fix && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--green)', lineHeight: 1.5, background: 'var(--bg)', padding: '0.3rem 0.5rem', borderRadius: 3, marginTop: '0.25rem' }}>→ {err.fix}</div>
      )}
    </div>
  );
}

function StepItem({ step, index }) {
  return (
    <div style={{
      display: 'flex', gap: '0.7rem', alignItems: 'flex-start',
      padding: '0.6rem 0.7rem', marginBottom: '0.5rem',
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
    }}>
      <div style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
        background: 'var(--accent)', color: '#0d0d0d',
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{index + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.5 }}>
          {step.description}
        </div>
        {(step.before || step.after) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {step.before && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--red)', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>BEFORE</div>
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--red)',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 3, padding: '0.35rem 0.5rem', margin: 0,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
                }}>{step.before}</pre>
              </div>
            )}
            {step.after && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--green)', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>AFTER</div>
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--green)',
                  background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 3, padding: '0.35rem 0.5rem', margin: 0,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
                }}>{step.after}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPanel({ result, loading, onRunCorrected }) {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('errors');

  const copy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    const steps = ['Detecting language...', 'Parsing structure...', 'Checking all error types...', 'Building solution...'];
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', height: '100%' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', animation: `blink 1.2s ${i * 0.2}s ease infinite` }}>
              <span style={{ color: 'var(--accent)' }}>›</span>{s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '100%', color: 'var(--text-muted)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.05em', color: 'var(--border-2)' }}>ANALYZE</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.8, maxWidth: 240 }}>
          Paste code in any language and click ANALYZE to detect all errors with solutions
        </div>
      </div>
    );
  }

  const cfg = TYPE_CFG[result.error_type] || TYPE_CFG.none;
  const sevColor = SEV_CLR[result.severity] || 'var(--text-muted)';
  const additionalErrors = result.additional_errors || [];
  const steps = result.step_by_step_solution || [];
  const ps = result.pedagogical_score;
  const detectedLang = (result.detected_language || '').toLowerCase();
  const langColor = LANG_CLR[detectedLang] || 'var(--text-secondary)';
  const totalErrors = result.has_error ? 1 + additionalErrors.length : 0;

  const tabs = [
    { id: 'errors', label: 'ERRORS', show: result.has_error },
    { id: 'solution', label: 'SOLUTION', show: result.has_error && (steps.length > 0 || result.corrected_full_code) },
    { id: 'explanation', label: 'EXPLAIN', show: !!result.explanation },
    { id: 'clean', label: 'FIXED CODE', show: result.has_error && !!result.corrected_full_code },
  ].filter(t => t.show);

  const tabStyle = (active) => ({
    padding: '0 0.75rem', height: '100%', fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'transparent', border: 'none',
    borderBottom: `2px solid ${active ? cfg.color : 'transparent'}`,
    cursor: 'pointer', flexShrink: 0, transition: '0.15s',
  });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Result header */}
      <div style={{
        padding: '0.75rem 0.9rem', borderBottom: '1px solid var(--border)',
        background: cfg.bg, flexShrink: 0, animation: 'fadeUp 0.3s var(--ease)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--r-sm)', flexShrink: 0,
            background: `${cfg.color}20`, border: `1px solid ${cfg.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '1rem', color: cfg.color,
          }}>{cfg.sym}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: cfg.color, letterSpacing: '0.04em', lineHeight: 1 }}>
              {result.has_error ? cfg.label + ' DETECTED' : 'CODE IS CLEAN'}
            </div>
            {result.error_line && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.12rem' }}>
                primary error at line {result.error_line}
              </div>
            )}
          </div>
          {totalErrors > 0 && (
            <div style={{
              marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: '1.5rem',
              color: cfg.color, opacity: 0.7,
            }}>{totalErrors}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {result.detected_language && <Tag color={langColor}>{result.detected_language}</Tag>}
          {result.error_type !== 'none' && <Tag color={cfg.color}>{result.error_type}</Tag>}
          {result.severity !== 'none' && <Tag color={sevColor}>sev:{result.severity}</Tag>}
          {result.violated_specification && <Tag color="var(--blue)">{result.violated_specification}</Tag>}
          {totalErrors > 1 && <Tag color="var(--orange)">{totalErrors} errors</Tag>}
          <Tag color="var(--text-muted)">{result.mode === 'specification' ? 'spec-guided' : 'zero-shot'}</Tag>
        </div>
      </div>

      {/* Tab navigation (only when there are errors) */}
      {result.has_error && tabs.length > 1 && (
        <div style={{
          height: 36, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'stretch', background: 'var(--surface-2)', flexShrink: 0,
        }}>
          {tabs.map(t => (
            <button key={t.id} style={tabStyle(activeSection === t.id)} onClick={() => setActiveSection(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', animation: 'fadeUp 0.35s 0.05s var(--ease) both' }}>

        {/* ERRORS TAB or single view */}
        {(!result.has_error || activeSection === 'errors' || tabs.length <= 1) && (
          <>
            {result.has_error && (
              <Card label={additionalErrors.length > 0 ? `All Errors (${totalErrors})` : 'Error'} icon="✕" accent={cfg.color}>
                <ErrItem err={{ line: result.error_line, type: result.error_type, description: result.error_description, fix: result.fix_suggestion }} color={cfg.color} />
                {additionalErrors.map((err, i) => {
                  const c = err.type === 'syntax' ? 'var(--red)'
                    : err.type === 'logical' ? 'var(--accent)'
                    : err.type === 'runtime' ? 'var(--orange)'
                    : err.type === 'type' ? 'var(--blue)'
                    : err.type === 'security' ? '#ff6b35'
                    : 'var(--purple)';
                  return <ErrItem key={i} err={err} color={c} />;
                })}
              </Card>
            )}

            {/* Misconception */}
            {result.misconception && (
              <Card label="Misconception" icon="◈" accent="var(--purple)">
                <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.misconception}</p>
              </Card>
            )}

            {!result.has_error && result.explanation && (
              <Card label="Analysis" icon="○" accent="var(--blue)">
                <p style={{ fontSize: '0.79rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>{result.explanation}</p>
              </Card>
            )}

            {/* Learning tip when no tabs */}
            {result.learning_tip && tabs.length <= 1 && (
              <div style={{ padding: '0.7rem 0.85rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.25)', borderRadius: 'var(--r)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>◈ TIP</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.learning_tip}</p>
              </div>
            )}

            {ps && tabs.length <= 1 && (
              <Card label="Quality Score" icon="◎" accent="var(--text-muted)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {[['Correctness', ps.correctness, 'var(--green)'], ['Clarity', ps.clarity, 'var(--blue)'], ['Pedagogical', ps.pedagogical_value, 'var(--purple)']].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.15rem' }}>{label}</div>
                      <div style={{ marginTop: '0.3rem', height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${((val || 0) / 10) * 100}%`, background: color, transition: 'width 0.8s var(--ease)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* SOLUTION TAB */}
        {activeSection === 'solution' && result.has_error && (
          <>
            {steps.length > 0 && (
              <Card label={`Step-by-Step Fix (${steps.length} step${steps.length > 1 ? 's' : ''})`} icon="↗" accent="var(--green)">
                {steps.map((step, i) => (
                  <StepItem key={i} step={step} index={i} />
                ))}
              </Card>
            )}

            {result.learning_tip && (
              <div style={{ padding: '0.7rem 0.85rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.25)', borderRadius: 'var(--r)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>◈ TIP</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.learning_tip}</p>
              </div>
            )}

            {ps && (
              <Card label="Quality Score" icon="◎" accent="var(--text-muted)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {[['Correctness', ps.correctness, 'var(--green)'], ['Clarity', ps.clarity, 'var(--blue)'], ['Pedagogical', ps.pedagogical_value, 'var(--purple)']].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.15rem' }}>{label}</div>
                      <div style={{ marginTop: '0.3rem', height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${((val || 0) / 10) * 100}%`, background: color, transition: 'width 0.8s var(--ease)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* EXPLANATION TAB */}
        {activeSection === 'explanation' && (
          <>
            {result.misconception && (
              <Card label="Misconception" icon="◈" accent="var(--purple)">
                <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.misconception}</p>
              </Card>
            )}
            <Card label="Explanation" icon="○" accent="var(--blue)">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>{result.explanation}</p>
            </Card>
            {result.learning_tip && (
              <div style={{ padding: '0.7rem 0.85rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.25)', borderRadius: 'var(--r)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>◈ TIP</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.learning_tip}</p>
              </div>
            )}
          </>
        )}

        {/* FIXED CODE TAB */}
        {activeSection === 'clean' && result.corrected_full_code && (
          <Card label="Corrected Code" icon="✓" accent="var(--green)">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <button onClick={() => copy(result.corrected_full_code)} style={{
                padding: '0.25rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                background: copied ? 'var(--green-dim)' : 'var(--surface-3)',
                color: copied ? 'var(--green)' : 'var(--text-muted)',
                border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: '0.15s',
              }}>{copied ? '✓ COPIED' : 'COPY'}</button>
              <button onClick={() => onRunCorrected(result.corrected_full_code)} style={{
                padding: '0.25rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                background: 'var(--green-dim)', color: 'var(--green)',
                border: '1px solid var(--green)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              }}>▶ RUN</button>
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.73rem', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              padding: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.65,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto',
            }}>{result.corrected_full_code}</pre>
          </Card>
        )}
      </div>
    </div>
  );
}
