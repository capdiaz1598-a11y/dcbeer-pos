// Service worker del POS DC BEER — permite abrir y vender SIN internet.
// - Archivos propios y librerías (vendor/): se guardan al instalar y se sirven desde la caché si no hay red.
// - index.html: primero intenta la red (para recibir actualizaciones) y, si no hay internet, usa la última copia guardada.
// - Los datos de ventas NO están aquí: viven en el localStorage del dispositivo.
const CACHE = 'dcbeer-v5';
const ASSETS = ['./', './index.html', './vendor/chart.umd.min.js', './vendor/xlsx.full.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase, fuentes, etc.: no se tocan
  const esPagina = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (esPagina) {
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(req, copia));
      return res;
    })));
  }
});
