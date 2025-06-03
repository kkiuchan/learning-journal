"use client";

import { useEffect, useState } from "react";

interface AppAdvertisementProps {
  style?: "default" | "minimal" | "colorful" | "github" | "live";
  catchphrase?: string;
}

export function AppAdvertisement({
  style = "default",
  catchphrase = "学びを記録で成長につなげる",
}: AppAdvertisementProps) {
  const [iframesLoaded, setIframesLoaded] = useState(false);

  useEffect(() => {
    // iframe読み込み完了を待つ
    const timer = setTimeout(() => setIframesLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // スタイル別の設定
  const styleConfig = {
    default: {
      background: "bg-gradient-to-br from-slate-50 to-blue-50",
      titleColor: "text-gray-900",
      subtitleColor: "text-gray-600",
    },
    minimal: {
      background: "bg-white",
      titleColor: "text-black",
      subtitleColor: "text-gray-500",
    },
    colorful: {
      background: "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100",
      titleColor: "text-purple-900",
      subtitleColor: "text-purple-700",
    },
    github: {
      background: "bg-gradient-to-br from-gray-900 to-gray-700",
      titleColor: "text-white",
      subtitleColor: "text-gray-300",
    },
    live: {
      background: "bg-gradient-to-br from-indigo-50 to-purple-50",
      titleColor: "text-gray-900",
      subtitleColor: "text-gray-600",
    },
  };

  const currentStyle = styleConfig[style];

  // GitHubスタイルの場合の特別な習慣グリッド
  const GitHubStyleGrid = () => (
    <div className="grid grid-cols-7 gap-1 mb-4">
      {Array.from({ length: 91 }).map((_, i) => {
        const week = Math.floor(i / 7);
        const day = i % 7;

        // より現実的な学習パターンを作成
        let intensity = 0;
        if (Math.random() > 0.3) {
          if (day === 0 || day === 6) {
            // 週末
            intensity =
              Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
          } else {
            // 平日
            intensity =
              Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0;
          }
        }

        const colors = [
          "bg-gray-100",
          "bg-green-200",
          "bg-green-400",
          "bg-green-600",
          "bg-green-800",
        ];

        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${colors[intensity]} ${
              style === "github" ? "border border-gray-600" : ""
            }`}
            title={`学習記録: ${intensity > 0 ? intensity : "なし"}`}
          />
        );
      })}
    </div>
  );

  if (style === "github") {
    return (
      <div
        className={`w-full max-w-4xl mx-auto ${currentStyle.background} p-8 rounded-2xl shadow-2xl border border-gray-600`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* 左側: ブランドとキャッチフレーズ */}
          <div className="flex-1 text-center lg:text-left max-w-lg">
            <h1
              className={`text-4xl lg:text-6xl font-bold ${currentStyle.titleColor} mb-4`}
            >
              Learning
              <br />
              Journal
            </h1>
            <p
              className={`text-lg lg:text-xl ${currentStyle.subtitleColor} font-medium mb-6`}
            >
              {catchphrase}
            </p>

            {/* GitHub風の学習継続グリッド */}
            <div className="mb-6">
              <h3
                className={`text-sm font-medium ${currentStyle.subtitleColor} mb-3`}
              >
                過去3ヶ月の学習記録
              </h3>
              <GitHubStyleGrid />
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>継続は力なり</span>
                <div className="flex items-center gap-1">
                  <span>少ない</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-100 rounded-sm"></div>
                    <div className="w-2 h-2 bg-green-200 rounded-sm"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
                    <div className="w-2 h-2 bg-green-800 rounded-sm"></div>
                  </div>
                  <span>多い</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: 統計情報 */}
          <div className="flex-1">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">
                学習統計
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">12</div>
                  <div className="text-sm text-gray-400">連続学習日数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">3</div>
                  <div className="text-sm text-gray-400">完了ユニット</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    48.5h
                  </div>
                  <div className="text-sm text-gray-400">今月の学習時間</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">4</div>
                  <div className="text-sm text-gray-400">進行中ユニット</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Live版（実際のiframe埋め込み）
  if (style === "live") {
    return (
      <div
        className={`w-full max-w-full mx-auto ${currentStyle.background} p-16 rounded-2xl shadow-2xl mt-8`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 pt-20">
          {/* 左側: ブランドとキャッチフレーズ */}
          <div className="flex-1 text-center lg:text-left max-w-md lg:pl-16">
            <h1
              className={`text-5xl lg:text-7xl font-bold ${currentStyle.titleColor} mb-6`}
            >
              Learning
              <br />
              Journal
            </h1>

            <p
              className={`text-xl lg:text-2xl ${currentStyle.subtitleColor} font-medium`}
            >
              学習の可視化で成長を加速
            </p>
          </div>

          {/* 右側: リアルなアプリ画面モックアップ */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* MacBook Pro モックアップ */}
            <div className="relative z-10 w-full max-w-8xl">
              {/* MacBook Pro 背景画像 */}
              <div
                className="relative w-full h-auto"
                style={{
                  backgroundImage: `url('/images/—Pngtree—macbook pro 16_9011850.png')`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  aspectRatio: "16/10",
                }}
              >
                {/* 画面エリア - MacBook の画面部分に合わせて位置調整 */}
                <div
                  className="absolute bg-black rounded-lg overflow-hidden"
                  style={{
                    top: "6%",
                    left: "11%",
                    width: "78%",
                    height: "79%",
                  }}
                >
                  {/* 実際のダッシュボードページを埋め込み */}
                  <div className="w-full h-full relative overflow-hidden">
                    {!iframesLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                          <div className="text-lg text-gray-500">
                            読み込み中...
                          </div>
                        </div>
                      </div>
                    )}
                    <iframe
                      src="/dashboard"
                      className={`w-full h-full border-0 transition-opacity duration-500 rounded-lg ${
                        iframesLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      style={{
                        transform: "scale(0.45)",
                        transformOrigin: "top left",
                        width: "222%",
                        height: "222%",
                      }}
                      loading="eager"
                      title="Learning Journal Dashboard - Live Demo"
                      onLoad={() => setIframesLoaded(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 下部: 機能紹介 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold ${currentStyle.titleColor}`}
              >
                進捗管理
              </h3>
              <p className={`text-base ${currentStyle.subtitleColor}`}>
                学習の進捗を可視化
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold ${currentStyle.titleColor}`}
              >
                目標達成
              </h3>
              <p className={`text-base ${currentStyle.subtitleColor}`}>
                明確な目標設定と達成
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold ${currentStyle.titleColor}`}
              >
                振り返り
              </h3>
              <p className={`text-base ${currentStyle.subtitleColor}`}>
                学習の振り返りと改善
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold ${currentStyle.titleColor}`}
              >
                AIアドバイス
              </h3>
              <p className={`text-base ${currentStyle.subtitleColor}`}>
                AIによる学習提案
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto ${currentStyle.background} p-8 rounded-2xl shadow-2xl`}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* 左側: ブランドとキャッチフレーズ */}
        <div className="flex-1 text-center lg:text-left max-w-lg">
          <h1
            className={`text-5xl lg:text-7xl font-bold ${currentStyle.titleColor} mb-6`}
          >
            Learning
            <br />
            Journal
          </h1>
          <p
            className={`text-xl lg:text-2xl ${currentStyle.subtitleColor} font-medium`}
          >
            {catchphrase}
          </p>
        </div>

        {/* 右側: リアルなアプリ画面モックアップ */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* MacBook Pro モックアップ */}
          <div className="relative z-10 w-full max-w-8xl">
            {/* MacBook Pro 背景画像 */}
            <div
              className="relative w-full h-auto"
              style={{
                backgroundImage: `url('/images/—Pngtree—macbook pro 16_9011850.png')`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                aspectRatio: "16/10",
              }}
            >
              {/* 画面エリア - MacBook の画面部分に合わせて位置調整 */}
              <div
                className="absolute bg-black rounded-lg overflow-hidden"
                style={{
                  top: "7%",
                  left: "12%",
                  width: "76%",
                  height: "68%",
                }}
              >
                {/* 実際のダッシュボードページを埋め込み */}
                <div className="w-full h-full relative overflow-hidden">
                  {!iframesLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <div className="text-lg text-gray-500">
                          読み込み中...
                        </div>
                      </div>
                    </div>
                  )}
                  <iframe
                    src="/dashboard"
                    className={`w-full h-full border-0 transition-opacity duration-500 rounded-lg ${
                      iframesLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      transform: "scale(0.45)",
                      transformOrigin: "top left",
                      width: "222%",
                      height: "222%",
                    }}
                    loading="eager"
                    title="Learning Journal Dashboard - Live Demo"
                    onLoad={() => setIframesLoaded(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* デスクトップモックアップ - ユニット詳細画面 */}
          <div className="absolute right-0 top-8 z-0">
            <div className="w-80 h-72 bg-gray-800 rounded-lg p-1 shadow-xl">
              <div className="w-full h-full bg-white rounded overflow-hidden">
                {/* ブラウザヘッダー */}
                <div className="h-6 bg-gray-100 flex items-center px-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">
                    learning-journal-app.com/units/toeic-800
                  </div>
                </div>

                {/* ユニット詳細画面 */}
                <div className="p-3 h-full overflow-y-auto">
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">
                        TOEIC 800点突破プロジェクト
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        進行中
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      開始: 2024/01/15
                    </div>
                  </div>

                  {/* タグ */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      TOEIC
                    </span>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      英語学習
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                      ビジネス英語
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                      リスニング
                    </span>
                  </div>

                  {/* 進捗 */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">達成度</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      75%
                    </div>
                  </div>

                  {/* 学習目標 */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      学習目標
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      TOEIC
                      800点以上を取得し、ビジネス英語でのコミュニケーション能力を向上させる
                    </div>
                  </div>

                  {/* 最近の学習ログ */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      最近の学習ログ
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs bg-white border rounded p-2">
                        <div className="font-medium">
                          シャドーイング練習とリスニング基礎
                        </div>
                        <div className="text-gray-500">
                          2024/1/15 • 90分 • リスニング
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 下部: 機能紹介 */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${currentStyle.titleColor}`}>
              進捗管理
            </h3>
            <p className={`text-base ${currentStyle.subtitleColor}`}>
              学習の進捗を可視化
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${currentStyle.titleColor}`}>
              目標達成
            </h3>
            <p className={`text-base ${currentStyle.subtitleColor}`}>
              明確な目標設定と達成
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${currentStyle.titleColor}`}>
              振り返り
            </h3>
            <p className={`text-base ${currentStyle.subtitleColor}`}>
              学習の振り返りと改善
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${currentStyle.titleColor}`}>
              AIアドバイス
            </h3>
            <p className={`text-base ${currentStyle.subtitleColor}`}>
              AIによる学習提案
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
