// All backend calls go through here. Response shapes are documented in
// backend/controllers/extension.controller.js.
import api, { AI_TIMEOUT } from '../api/axios';
import { supabase } from './supabase';

const data = (p) => p.then((r) => r.data);

// Triggers a browser download for a Blob.
export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const ai = { timeout: AI_TIMEOUT };

export const projectsApi = {
  list: (params = {}) => data(api.get('/extensions/my', { params })),
  get: (id) => data(api.get(`/extensions/${id}`)),
  create: (body) => data(api.post('/extensions/generate', body, ai)),
  update: (id, patch) => data(api.patch(`/extensions/${id}`, patch)),
  remove: (id) => data(api.delete(`/extensions/${id}`)),
  duplicate: (id) => data(api.post(`/extensions/${id}/duplicate`)),
  saveFiles: (id, files) => data(api.put(`/extensions/${id}/files`, { files })),
  validate: (id) => data(api.post(`/extensions/${id}/validate`)),
  edit: (id, prompt, { preview = true } = {}) => data(api.post(`/extensions/iterate/${id}`, { prompt, preview }, ai)),
  debug: (id, errorMessage, { preview = true } = {}) => data(api.post(`/extensions/${id}/debug`, { errorMessage, preview }, ai)),
  apply: (id, proposal) => data(api.post(`/extensions/${id}/apply`, proposal)),
  messages: (id) => data(api.get(`/extensions/${id}/messages`)),
  versions: (id) => data(api.get(`/extensions/${id}/versions`)),
  restore: (id, versionId) => data(api.post(`/extensions/${id}/versions/${versionId}/restore`)),
  audit: (id) => data(api.post(`/extensions/${id}/audit`, null, ai)),
  publish: (id) => data(api.post(`/extensions/${id}/publish`)),
  importZip: (file) =>
    data(api.post('/extensions/import', file, { headers: { 'Content-Type': 'application/zip' }, timeout: 60000 })),
  publishing: (id) => data(api.get(`/extensions/${id}/publishing`)),
  draftStoreKit: (id) => data(api.post(`/extensions/${id}/publishing/kit`, null, { timeout: 90000 })),
  saveStoreKit: (id, kit) => data(api.put(`/extensions/${id}/publishing/kit`, { kit })),
  downloadStorePackage: async (id, title) => {
    const res = await api.get(`/extensions/${id}/publishing/package`, { responseType: 'blob', timeout: 60000 });
    saveBlob(res.data, `${(title || 'extension').replace(/[^a-z0-9 _-]/gi, '').trim().replace(/\s+/g, '-') || 'extension'}-store-package.zip`);
  },
  enhancePrompt: (prompt) => data(api.post('/extensions/enhance-prompt', { prompt }, { timeout: 60000 })),
  download: async (id, title) => {
    const res = await api.get(`/extensions/download/${id}`, { responseType: 'blob', timeout: 60000 });
    saveBlob(res.data, `${(title || 'extension').replace(/[^a-z0-9 _-]/gi, '').trim().replace(/\s+/g, '-') || 'extension'}.zip`);
  },
};

// Streams crew progress (Server-Sent Events) for a new project.
// onEvent receives { type: 'agent:start' | 'agent:done', agent, role, status, ms, summary, plan }.
// Resolves with { extension, generation }; rejects with an axios-shaped error so errorMessage() works.
// Falls back to the non-streaming endpoint if the stream cannot be opened.
export const createWithProgress = async (body, onEvent, { signal } = {}) => {
  const base = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  let res;
  try {
    res = await fetch(`${base}/extensions/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return projectsApi.create(body);
  }
  if (!res.ok || !res.body) {
    if (res.status === 401 || res.status === 429) {
      const data = await res.json().catch(() => ({}));
      throw Object.assign(new Error(data.message || 'Request failed'), { response: { status: res.status, data } });
    }
    return projectsApi.create(body);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = block.match(/^event: (.+)$/m)?.[1];
      const raw = block.match(/^data: (.+)$/m)?.[1];
      if (!event || !raw) continue;
      const data = JSON.parse(raw);
      if (event === 'result') return data;
      if (event === 'error') throw Object.assign(new Error(data.message), { response: { status: data.status, data } });
      onEvent?.(data);
    }
  }
  throw Object.assign(new Error('The connection closed before the extension was ready. Please try again.'), { response: { status: 502, data: {} } });
};

export const galleryApi = {
  list: () => data(api.get('/extensions/gallery')),
  shared: (id) => data(api.get(`/extensions/shared/${id}`)),
  upvote: (id) => data(api.post(`/extensions/${id}/upvote`)),
  clone: (id) => data(api.post(`/extensions/${id}/clone`)),
};

export const userApi = {
  profile: () => data(api.get('/user/profile')),
  updateProfile: (name) => data(api.put('/user/profile', { name })),
  keys: () => data(api.get('/user/keys')),
  saveKey: (provider, key) => data(api.put(`/user/keys/${provider}`, { key }, { timeout: 20000 })),
  testKey: (provider) => data(api.post(`/user/keys/${provider}/test`, null, { timeout: 20000 })),
  deleteKey: (provider) => data(api.delete(`/user/keys/${provider}`)),
  saveSettings: (settings) => data(api.put('/user/settings', settings)),
};

// Readable message from an axios error, including validator output.
export const errorMessage = (err, fallback = 'Something went wrong') => {
  if (err?.code === 'ECONNABORTED') return 'The request timed out. The AI provider may be busy — please try again.';
  if (!err?.response) return err?.message === 'Network Error' ? 'Cannot reach the server. Check your connection.' : err?.message || fallback;
  const d = err.response.data || {};
  if (err.response.status === 429) return d.message || 'Too many requests. Please wait a moment.';
  return d.message || fallback;
};

export const errorDetails = (err) => err?.response?.data?.errors || [];
