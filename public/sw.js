// 離線遊玩：網頁本體用「先連網、失敗才用快取」（確保拿到新版本），
// 其他靜態檔（JS、CSS、字型、圖示）用「先用快取、背景更新」。Supabase 等外部連線不經過快取。
const CACHE = 'english-rpg-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // no-cache：每次都跟伺服器確認網頁有沒有更新，避免部署後還拿到舊網頁（舊網頁引用的 JS 已經不存在）
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => {
        caches.open(CACHE).then((c) => c.put('./', res.clone()));
        return res;
      }).catch(() => caches.match('./')),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
