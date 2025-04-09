// サービスワーカーが利用可能かチェック
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    // 単純に登録するだけの方法で試してみる
    navigator.serviceWorker.register("/sw.js").then(
      function (registration) {
        // 登録成功
        console.log("ServiceWorker 登録成功: ", registration.scope);
      },
      function (err) {
        // 登録失敗
        console.log("ServiceWorker 登録失敗: ", err);
      }
    );

    // アプリケーションで使用できるキャッシュクリアとSW解除機能
    window.clearSWCache = async function () {
      try {
        if ("caches" in window) {
          // 使用可能なキャッシュストレージの名前を取得
          const cacheNames = await caches.keys();

          // 'learning-journal-' で始まるすべてのキャッシュを削除
          const deletionPromises = cacheNames
            .filter((name) => name.startsWith("learning-journal-"))
            .map((name) => caches.delete(name));

          await Promise.all(deletionPromises);
          console.log("サービスワーカーのキャッシュを削除しました");
        }

        // サービスワーカーを登録解除
        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
            console.log("ServiceWorker 登録解除: ", registration.scope);
          }
        }

        // ページをリロード
        window.location.reload();
      } catch (err) {
        console.error("キャッシュのクリアに失敗しました:", err);
      }
    };
  });
}
