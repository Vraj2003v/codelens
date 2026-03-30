import React, { useState } from 'react';

const LANGUAGES = [
  { value: '',           label: 'Auto-detect', icon: '🔍' },
  { value: 'python',     label: 'Python',      icon: '🐍', color: '#e8c547' },
  { value: 'javascript', label: 'JavaScript',  icon: '🟨', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript',  icon: '🔷', color: '#3178c6' },
  { value: 'java',       label: 'Java',        icon: '☕', color: '#e87b47' },
  { value: 'c',          label: 'C',           icon: '⚙️', color: '#a8b9cc' },
  { value: 'cpp',        label: 'C++',         icon: '⚙️', color: '#00599c' },
  { value: 'csharp',     label: 'C#',          icon: '💠', color: '#9b4f96' },
  { value: 'sql',        label: 'SQL',         icon: '🗃️', color: '#4caf78' },
  { value: 'html',       label: 'HTML',        icon: '🌐', color: '#e34c26' },
  { value: 'css',        label: 'CSS',         icon: '🎨', color: '#264de4' },
];

const PLACEHOLDERS = {
  python: `def check_even_odd(num):
    if num % 2 == 0
        print("Even")
    else
        print("Odd")

number = input("Enter a number: ")
if number > 10:
    print("Greater than 10")
check_even_odd(number)`,

  javascript: `async function fetchData() {
  const res = fetch('https://api.example.com/data');
  const data = res.json();
  return data.name;
}
fetchData().then(name => console.log(name));`,

  typescript: `interface User {
  name: string;
  age: number;
}

function getUser(): User {
  return { name: "Alice", age: "30" };
}

const user = getUser();
console.log(user.age + 1);`,

  java: `public class Calculator {
    public add(int a, int b) {
        return a + b;
    }
    public static void main(String[] args) {
        Calculator c = new Calculator();
        System.out.println(c.add(3, 4));
    }
}`,

  c: `#include <stdio.h>
#include <string.h>

void copyString(char* dest, const char* src) {
    strcpy(dest, src);
}

int main() {
    char buf[5];
    copyString(buf, "Hello World");
    printf("%s\n", buf);
    return 0;
}`,

  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i <= nums.size(); i++) {
        sum += nums[i];
    }
    cout << "Sum: " << sum << endl;
    return 0;
}`,

  csharp: `using System;

class Program {
    static string Greet(string name) {
        return "Hello, " + name.ToUpper();
    }
    static void Main() {
        Console.WriteLine(Greet(null));
    }
}`,

  sql: `UPDATE users
SET email = 'newemail@example.com';

-- This updates ALL rows in the table!`,

  html: `<!DOCTYPE html>
<html>
<head><title>My Page</title></head>
<body>
    <img src='photo.jpg'>
    <p>Welcome <b>to my page</p></b>
    <a href=>Click here</a>
</body>
</html>`,

  css: `.container {
    display: flex;
    width: 100%
    height: 200px;
    backround-color: #fff;
    margin: 10px auto
}`,

  default: `# Paste or type your code here
# Supported: Python, JavaScript, TypeScript,
#            Java, C, C++, C#, SQL, HTML, CSS
# Language auto-detected — or select manually above`,
};

export default function CodeEditor({ onAnalyze, onRun, loading, runLoading, runResult, examples, language, onLanguageChange }) {
  const [code, setCode] = useState(PLACEHOLDERS.python);
  const [activeTab, setActiveTab] = useState('editor');
  const [mode, setMode] = useState('specification');
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const lineCount = code.split('\n').length;
  const langObj = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  const handleTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart, end = e.target.selectionEnd;
      const next = code.substring(0, s) + '    ' + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; });
    }
  };

  const handleLangChange = (val) => {
    onLanguageChange(val);
    if (!code.trim() || code === PLACEHOLDERS[language] || code === PLACEHOLDERS.default) {
      setCode(PLACEHOLDERS[val] || PLACEHOLDERS.default);
    }
  };

  const loadExample = (e) => {
    const idx = parseInt(e.target.value);
    if (!isNaN(idx) && examples[idx]) {
      setCode(examples[idx].code);
      if (examples[idx].language) {
        onLanguageChange(examples[idx].language);
      }
    }
    e.target.value = '';
  };

  const btn = (active, color = 'var(--accent)') => ({
    padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--text-muted)',
    border: `1px solid ${active ? color + '50' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: '0.15s var(--ease)',
    display: 'flex', alignItems: 'center', gap: '0.3rem',
  });

  const runBtnStyle = (loading) => ({
    padding: '0.35rem 1rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
    background: loading ? 'var(--surface-2)' : 'var(--green-dim)',
    color: loading ? 'var(--text-muted)' : 'var(--green)',
    border: `1px solid ${loading ? 'var(--border)' : 'var(--green)'}`,
    borderRadius: 'var(--r-sm)', cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    opacity: loading ? 0.6 : 1, transition: '0.15s var(--ease)',
  });

  const analyzeBtnStyle = (loading) => ({
    padding: '0.35rem 1.1rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
    fontWeight: 600, letterSpacing: '0.04em',
    background: loading ? 'var(--surface-2)' : 'var(--accent)',
    color: loading ? 'var(--text-muted)' : '#0d0d0d',
    border: 'none', borderRadius: 'var(--r-sm)',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    opacity: loading ? 0.6 : 1, transition: '0.15s var(--ease)',
  });

  const tabStyle = (active) => ({
    padding: '0 1rem', height: '100%', fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'transparent', border: 'none',
    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
    transition: '0.15s var(--ease)', flexShrink: 0,
  });

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', height: '100%',
    }}>
      {/* Tab bar */}
      <div style={{
        height: 40, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0,
        background: 'var(--surface-2)',
      }}>
        <button style={tabStyle(activeTab === 'editor')} onClick={() => setActiveTab('editor')}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 4l2 2-2 2M6 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          EDITOR
        </button>
        <button style={tabStyle(activeTab === 'run')} onClick={() => setActiveTab('run')}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 2l7 3.5-7 3.5V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          RUN OUTPUT
          {runResult && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: runResult.success ? 'var(--green)' : 'var(--red)' }} />
          )}
        </button>

        {/* Language selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '0.75rem' }}>
          <select
            value={language}
            onChange={e => handleLangChange(e.target.value)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-sm)', color: langObj.color || 'var(--text-secondary)',
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '0.2rem 0.5rem',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <>
          {/* Toolbar */}
          <div style={{
            padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
          }}>
            <select style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)',
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)', padding: '0.25rem 0.5rem',
              cursor: 'pointer', outline: 'none',
            }} onChange={loadExample} defaultValue="">
              <option value="" disabled>LOAD EXAMPLE</option>
              {(examples || []).map((ex, i) => (
                <option key={i} value={i}>{ex.title}</option>
              ))}
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button style={btn(mode === 'specification')} onClick={() => setMode('specification')}>SPEC</button>
              <button style={btn(mode === 'zero_shot')} onClick={() => setMode('zero_shot')}>ZERO-SHOT</button>
            </div>
          </div>

          {/* Code area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', minHeight: 0 }}>
            {/* Line numbers */}
            <div style={{
              padding: '1rem 0', width: 42, flexShrink: 0,
              background: 'var(--surface-2)', borderRight: '1px solid var(--border)',
              overflowY: 'hidden', userSelect: 'none',
              display: 'flex', flexDirection: 'column',
            }}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} style={{
                  fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)', textAlign: 'right',
                  paddingRight: '0.6rem', lineHeight: '1.7',
                  height: '1.7em',
                }}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleTab}
              spellCheck={false}
              placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.default}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem', lineHeight: 1.7, padding: '1rem',
                resize: 'none', tabSize: 4, height: '100%',
              }}
            />
          </div>

          {/* Stdin box */}
          {showStdin && (
            <div style={{
              borderTop: '1px solid var(--border)', padding: '0.6rem 0.75rem',
              background: 'var(--surface-2)', flexShrink: 0,
            }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem', letterSpacing: '0.08em' }}>
                STDIN — one value per line (for input() / readline calls)
              </div>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder={"42\nhello\n..."}
                spellCheck={false}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)',
                  borderRadius: 'var(--r-sm)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.6,
                  padding: '0.4rem 0.6rem', resize: 'vertical', minHeight: 48,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Footer actions */}
          <div style={{
            borderTop: '1px solid var(--border)', padding: '0.55rem 0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {lineCount}L
            </span>
            <button
              style={{ ...btn(showStdin, 'var(--blue)'), marginLeft: '0.25rem' }}
              onClick={() => setShowStdin(v => !v)}
            >
              {showStdin ? '▾' : '▸'} STDIN
            </button>
            <button
              style={{ marginLeft: 'auto', ...runBtnStyle(runLoading) }}
              onClick={() => { onRun(code, stdin, language); setActiveTab('run'); }}
              disabled={runLoading}
            >
              ▶ {runLoading ? 'RUNNING...' : 'RUN'}
            </button>
            <button
              style={analyzeBtnStyle(loading)}
              onClick={() => onAnalyze(code, mode, language)}
              disabled={loading}
            >
              {loading ? 'ANALYZING...' : '⚡ ANALYZE'}
            </button>
          </div>
        </>
      ) : (
        /* Run output tab */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, background: 'var(--surface-2)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>OUTPUT</span>
            <button style={runBtnStyle(runLoading)} onClick={() => onRun(code, stdin, language)} disabled={runLoading}>
              ▶ {runLoading ? 'RUNNING...' : 'RUN AGAIN'}
            </button>
          </div>

          <div style={{
            flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', lineHeight: 1.7,
            padding: '1rem', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {!runResult ? (
              <span style={{ color: 'var(--text-muted)' }}>{'> '} Click RUN to execute code...</span>
            ) : runResult.language_unsupported ? (
              <span style={{ color: 'var(--accent)' }}>
                {'⚠ ' + runResult.error}
              </span>
            ) : runResult.needs_input ? (
              <div>
                <span style={{ color: 'var(--blue)' }}>{runResult.error}</span>
                <br/><br/>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  → Click ▸ STDIN in the editor toolbar and add your input values.
                </span>
              </div>
            ) : runResult.success ? (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{'// OUTPUT\n'}</span>
                <span style={{ color: 'var(--green)' }}>{runResult.output || '(no output)'}</span>
              </div>
            ) : (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{'// ERROR\n'}</span>
                <span style={{ color: 'var(--red)' }}>{runResult.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
