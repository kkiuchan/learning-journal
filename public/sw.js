// サービスワーカーのバージョン - キャッシュを更新する際に変更します
const CACHE_VERSION = "v5";
const CACHE_NAME = `learning-journal-${CACHE_VERSION}`;

// キャッシュするアセット - 必要最小限に
const urlsToCache = ["/offline.html", "/favicon.ico"];

// サービスワーカーのインストール
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("キャッシュを開きました");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを消去
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith("learning-journal-") &&
                cacheName !== CACHE_NAME
              );
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// リクエストに対してキャッシュを使用
self.addEventListener("fetch", (event) => {
  // APIリクエストはキャッシュせず、常にネットワークから取得
  if (event.request.url.includes("/api/")) {
    return;
  }

  // GETリクエストのみキャッシュ
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュヒットした場合
      if (response) {
        return response;
      }

      // キャッシュがない場合はネットワークからフェッチ
      return fetch(event.request).catch(() => {
        // オフラインの場合はオフラインページを返す
        return caches.match("/offline.html");
      });
    })
  );
});
