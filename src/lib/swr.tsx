import React from "react";
import { SWRConfig, SWRConfiguration } from "swr";

// SWRのグローバル設定
const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false, // フォーカス時の再検証を無効化
  revalidateIfStale: true, // 古いデータを再検証する
  revalidateOnReconnect: true, // 再接続時の再検証を有効化
  refreshInterval: 0, // 自動更新を無効化（各フックで個別設定）
  dedupingInterval: 5000, // 5秒間は重複リクエストを防ぐ
  errorRetryCount: 3, // エラー時の再試行回数を制限
  errorRetryInterval: 5000, // エラー時の再試行間隔を5秒に設定
  keepPreviousData: true, // データ更新中も古いデータを表示
  suspense: false, // Suspenseモードを無効化
  fetcher: async (url: string, options?: { tags?: string[] }) => {
    const fetchOptions: RequestInit & { next?: { tags?: string[] } } = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // キャッシュタグが指定されている場合は追加
    if (options?.tags && options.tags.length > 0) {
      fetchOptions.next = { tags: options.tags };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `APIエラー: ${response.status}`);
    }

    return response.json();
  },
  onError: (error: Error) => {
    console.error("SWRエラー:", error);
  },
  onSuccess: (data, key) => {
    // 成功時のログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.log(`SWR Success: ${key}`, data);
    }
  },
};

// アプリケーション全体でSWRを使用するためのプロバイダー
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
