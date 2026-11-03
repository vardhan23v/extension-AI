// All backend calls go through here. Response shapes are documented in
// backend/controllers/extension.controller.js.
import api, { AI_TIMEOUT } from '../api/axios';

const data = (p) => p.then((r) => r.data);
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
  enhancePrompt: (prompt) => data(api.post('/extensions/enhance-prompt', { prompt }, { timeout: 60000 })),
  download: async (id, title) => {
    const res = await api.get(`/extensions/download/${id}`, { responseType: 'blob', timeout: 60000 });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'extension').replace(/[^a-z0-9 _-]/gi, '').trim().replace(/\s+/g, '-') || 'extension'}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
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
