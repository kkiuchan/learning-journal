// サービスワーカーのバージョン - キャッシュを更新する際に変更します
const CACHE_VERSION = "v6";
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

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
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
  );
});

// リクエストに対してキャッシュを使用
self.addEventListener("fetch", (event) => {
  // APIリクエストはキャッシュせず、常にネットワークから取得
  if (event.request.url.includes("/api/")) {
    return;
  }

  // 認証関連のリクエストはキャッシュしない
  if (event.request.url.includes("/auth/")) {
    return;
  }

  // GETリクエストのみキャッシュ
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // レスポンスをクローンしてキャッシュに保存
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // オフラインの場合はキャッシュを確認
        return caches.match(event.request).then((response) => {
          return response || caches.match("/offline.html");
        });
      })
  );
});
