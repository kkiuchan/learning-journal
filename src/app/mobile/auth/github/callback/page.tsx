"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function MobileGitHubCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const data = searchParams.get("data");
    const error = searchParams.get("error");

    if (data || error) {
      // アプリがインストールされている場合、カスタムスキームでリダイレクト
      const customSchemeUrl = data
        ? `com.kkiuchan.learningjournal://auth/github/callback?data=${data}`
        : `com.kkiuchan.learningjournal://auth/github/callback?error=${error}`;

      // カスタムスキームでアプリを開く試行
      window.location.href = customSchemeUrl;

      // 少し待ってからApp Storeまたは説明ページにリダイレクト
      setTimeout(() => {
        if (error) {
          // エラーの場合は適切なエラーページへ
          window.location.href =
            "/auth/error?mobile=true&error=" + encodeURIComponent(error);
        } else {
          // 成功の場合はアプリダウンロードページやWebダッシュボードへ
          window.location.href = "/dashboard?mobile=true";
        }
      }, 3000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          アプリに移動中...
        </h2>
        <p className="text-gray-600 mb-4">
          Learning Journalアプリが開かない場合：
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• アプリがインストールされているか確認してください</p>
          <p>• App Storeからダウンロードできます</p>
          <p>• またはWebバージョンを継続してご利用ください</p>
        </div>

        <div className="mt-6 space-y-3">
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Webバージョンを使用
          </a>
          <a
            href="#"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            App Storeからダウンロード
          </a>
        </div>
      </div>
    </div>
  );
}
