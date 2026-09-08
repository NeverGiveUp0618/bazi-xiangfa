const CACHE_NAME = 'bazi-xiangyi-mobile-20260908-netfirst';
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./cross_arts_data.js",
  "./app.js",
  "./manifest.webmanifest",
  "../preview.png"
];

self.addEventListener("install", event => {
  // ⚠️ 逐个 add 各自兜底：原来用 addAll，任一资源取不到就让整个 install 失败，
  //    浏览器随后反复重试安装，缓存也一直装不上。
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(u => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/* 这里一直是网络优先（从第一版就是），所以本站不像八字日练那样被缓存钉死。
   ⚠️⚠️ 但 2026-09-08 发现它照样会给别人看旧版，漏洞在**回退**那一侧：
   原写法 `fetch(req).catch(() => caches.match(req))` —— fetch 失败就无条件吃缓存。
   而 github.io 在国内时通时不通，对方网络一差就回退旧缓存，下次还差、还回退，
   于是**长期停在某个旧版本**，看起来就像"链接发过去内容不一样"。
   现在改成：网络慢先拿缓存顶上（秒开），但**网络回来一定把新版写进缓存**，
   所以哪怕这次吃了旧的，下一次打开就是新的，不会再钉死。 */
const TIMEOUT = 1500;

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;
  event.respondWith(netFirstButDontHang(req));
});

function netFirstButDontHang(req) {
  return new Promise(resolve => {
    let settled = false;
    const give = res => { if (!settled && res) { settled = true; resolve(res); } };

    const timer = setTimeout(() => {
      if (settled) return;
      caches.match(req, { ignoreSearch: true }).then(give);   // 没缓存就继续等网络
    }, TIMEOUT);

    fetch(req).then(res => {
      clearTimeout(timer);
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      give(res);        // 若已用缓存应答，这里只是把新版写进缓存，供下次用
    }).catch(async () => {
      clearTimeout(timer);
      // 离线：回退缓存；忽略 ?v= 差异，否则换了版本号就全部落空
      const hit = await caches.match(req, { ignoreSearch: true })
        || (req.mode === "navigate" ? await caches.match("./index.html") : null);
      give(hit || new Response("", { status: 504, statusText: "offline" }));
    });
  });
}
