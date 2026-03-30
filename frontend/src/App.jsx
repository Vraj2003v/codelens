import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import ResultPanel from './components/ResultPanel';
import SpecsPanel from './components/SpecsPanel';
import StatsBar from './components/StatsBar';
import { analyzeCode, runCode, fetchExamples, fetchSpecifications } from './utils/api';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [examples, setExamples] = useState([]);
  const [specs, setSpecs] = useState(null);
  const [history, setHistory] = useState([]);
  const [language, setLanguage] = useState('python');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'ok' });

  useEffect(() => {
    fetchExamples().then(setExamples).catch(() => {});
    fetchSpecifications().then(setSpecs).catch(() => {});
  }, []);

  const showToast = (msg, type = 'ok') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  const handleAnalyze = async (code, mode, lang) => {
    if (!code.trim()) { showToast('No code provided', 'err'); return; }
    setLoading(true); setResult(null);
    try {
      const data = await analyzeCode(code, mode, lang);
      setResult(data);
      setHistory(h => [data, ...h].slice(0, 50));
      if (data.detected_language) setDetectedLanguage(data.detected_language);
      if (data.error) showToast(data.error, 'err');
      else showToast(data.has_error ? `${data.detected_language || ''} · ${data.error_type} error detected` : 'No errors found', data.has_error ? 'err' : 'ok');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Analysis failed', 'err');
    } finally { setLoading(false); }
  };

  const handleRun = async (code, stdin, lang) => {
    if (!code.trim()) { showToast('No code to run', 'err'); return; }
    setRunLoading(true);
    try {
      const data = await runCode(code, stdin, lang);
      setRunResult(data);
      if (!data.language_unsupported && !data.needs_input)
        showToast(data.success ? 'Executed successfully' : 'Runtime error', data.success ? 'ok' : 'err');
    } catch (err) {
      setRunResult({ success: false, error: err.message });
      showToast('Could not connect to backend', 'err');
    } finally { setRunLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header language={language} detectedLanguage={detectedLanguage} />
      <StatsBar history={history} />

      {/* Hero strip */}
      <div style={{
        padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
            letterSpacing: '0.04em', lineHeight: 1,
            background: 'linear-gradient(90deg, var(--text-primary) 60%, var(--accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MULTI-LANGUAGE ERROR DETECTOR</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
            Python · JavaScript · TypeScript · Java · C · C++ · C# · SQL · HTML · CSS
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'right', lineHeight: 1.8 }}>
          <div style={{ color: 'var(--accent)' }}>10 Languages · All Error Types</div>
          <div>Llama-3.3-70B · Groq</div>
        </div>
      </div>

      {/* Main grid */}
      <main style={{
        flex: 1, padding: '0.75rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 240px',
        gap: '0.75rem',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <CodeEditor
          onAnalyze={handleAnalyze}
          onRun={handleRun}
          loading={loading}
          runLoading={runLoading}
          runResult={runResult}
          examples={examples}
          language={language}
          onLanguageChange={setLanguage}
        />
        <ResultPanel
          result={result}
          loading={loading}
          onRunCorrected={(code) => handleRun(code, '', language)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
          <SpecsPanel specs={specs} />
        </div>
      </main>

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: '1.25rem', right: '1.25rem',
        background: toast.type === 'err' ? 'var(--red-dim)' : 'var(--green-dim)',
        border: `1px solid ${toast.type === 'err' ? 'var(--red)' : 'var(--green)'}40`,
        borderRadius: 'var(--r-sm)', padding: '0.5rem 0.9rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
        color: toast.type === 'err' ? 'var(--red)' : 'var(--green)',
        transform: toast.show ? 'translateY(0)' : 'translateY(80px)',
        opacity: toast.show ? 1 : 0, transition: 'all 0.25s var(--ease)',
        zIndex: 1000, maxWidth: 300, backdropFilter: 'blur(8px)',
      }}>{toast.msg}</div>
    </div>
  );
}
