// 離線遊玩：
// - 安裝時讀取網頁，把裡面引用的 JS、CSS 與圖示全部預先快取（離線也能開）
// - 網頁本體「先連網」（每次確認有沒有新版本），斷線才用快取
// - 其他同網域的檔案（字型等）「先用快取、背景更新」
// 回應要在交給網頁之前先 clone，否則網頁讀完內容後就無法再存進快取。
const CACHE = 'english-rpg-v3';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon-32.png'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  // 從網頁找出這一版的 JS／CSS（檔名有雜湊，每次部署都不同）
  const res = await fetch('./', { cache: 'reload' });
  const html = await res.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((m) => new URL(m[1], self.location.href).href);
  await cache.addAll(assets);
  // CSS 裡的字型也一起快取
  for (const css of assets.filter((a) => a.endsWith('.css'))) {
    const text = await (await fetch(css)).text();
    const fonts = [...text.matchAll(/url\(([^)]+\.woff2?)\)/g)].map((m) => new URL(m[1].replace(/["']/g, ''), css).href);
    await cache.addAll(fonts);
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

function store(req, res) {
  if (!res || !res.ok) return;
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(req, copy));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // no-cache：每次都跟伺服器確認網頁有沒有更新，避免部署後還拿到舊網頁（舊網頁引用的 JS 已經不存在）
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => { store('./', res); return res; })
        .catch(() => caches.match('./')),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => { store(req, res); return res; })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
