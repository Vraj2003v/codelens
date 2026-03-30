import axios from 'axios';

const BASE = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE, timeout: 90000 });

export const analyzeCode = (code, mode = 'specification', language = '') =>
  api.post('/api/analyze', { code, mode, language }).then(r => r.data);

export const runCode = (code, stdin = '', language = '') =>
  api.post('/api/run', { code, stdin, language }).then(r => r.data);

export const fetchExamples = () =>
  api.get('/api/examples').then(r => r.data);

export const fetchSpecifications = () =>
  api.get('/api/specifications').then(r => r.data);
