const manifest = (extra = {}) =>
  JSON.stringify({
    manifest_version: 3,
    name: 'Red Page',
    version: '1.0.0',
    description: 'Turns pages red',
    icons: { 16: 'icon16.png', 48: 'icon48.png', 128: 'icon128.png' },
    action: { default_popup: 'popup.html', default_icon: { 16: 'icon16.png', 48: 'icon48.png', 128: 'icon128.png' } },
    permissions: ['storage', 'activeTab'],
    ...extra,
  });

const validFiles = (extra) => [
  { filename: 'manifest.json', content: manifest(extra) },
  { filename: 'popup.html', content: '<!doctype html><html><head><link rel="stylesheet" href="popup.css"></head><body><button id="go">Go</button><script src="popup.js"></script></body></html>' },
  { filename: 'popup.css', content: 'body { width: 300px; }' },
  { filename: 'popup.js', content: "document.getElementById('go').addEventListener('click', () => chrome.storage.local.set({ red: true }));" },
];

const aiJson = (files = validFiles(), title = 'Red Page') =>
  JSON.stringify({ title, storeDescription: 'Makes pages red.', summary: 'Built it.', files });

module.exports = { manifest, validFiles, aiJson };
