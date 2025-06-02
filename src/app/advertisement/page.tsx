"use client";

import { AppAdvertisement } from "@/components/marketing/AppAdvertisement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AdvertisementPage() {
  const adVariations = [
    {
      id: "default",
      name: "デフォルト",
      description: "清潔で現代的なデザイン",
      style: "default" as const,
      catchphrase: "学びを記録で成長につなげる",
    },
    {
      id: "minimal",
      name: "ミニマル",
      description: "シンプルで洗練されたデザイン",
      style: "minimal" as const,
      catchphrase: "学習の可視化で成長を加速",
    },
    {
      id: "colorful",
      name: "カラフル",
      description: "鮮やかで親しみやすいデザイン",
      style: "colorful" as const,
      catchphrase: "楽しく学んで、着実に成長",
    },
    {
      id: "github",
      name: "GitHub風",
      description: "開発者向けのダークテーマ",
      style: "github" as const,
      catchphrase: "コードのように学習を管理",
    },
    {
      id: "live",
      name: "Live Demo",
      description: "実際のアプリ画面を埋め込み",
      style: "live" as const,
      catchphrase: "リアルタイムで学習を体験",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Learning Journal 広告画像
          </h1>
          <p className="text-gray-600 mb-6">
            アプリの魅力を伝える広告画像のバリエーションです
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">ホームに戻る</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // スクリーンショット撮影のヒント
                alert(
                  "ブラウザの開発者ツールでスクリーンショットを撮影するか、専用ツールを使用してください。"
                );
              }}
            >
              💾 画像として保存
            </Button>
          </div>
        </div>

        {/* 広告バリエーション */}
        <Tabs defaultValue="default" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            {adVariations.map((variant) => (
              <TabsTrigger
                key={variant.id}
                value={variant.id}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-1">
                  <span className="font-medium">{variant.name}</span>
                  {variant.id === "live" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {variant.description}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {adVariations.map((variant) => (
            <TabsContent key={variant.id} value={variant.id} className="mt-0">
              <div className="flex justify-center mb-6">
                <AppAdvertisement
                  style={variant.style}
                  catchphrase={variant.catchphrase}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Live版の特別な説明 */}
        <div className="mt-8 max-w-2xl mx-auto bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-green-900">
              🚀 Live Demo について
            </h2>
          </div>
          <div className="space-y-2 text-sm text-green-800">
            <p>
              <strong>Live Demo版</strong>では、実際のLearning
              Journalアプリの画面がiframeで埋め込まれています。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>リアルタイムでデータが更新される</li>
              <li>実際のユーザーインターフェース</li>
              <li>本物のアプリ体験を提供</li>
              <li>最新の機能やデザインが反映される</li>
            </ul>
            <p className="text-green-700 font-medium mt-3">
              💡 デモ用途やプレゼンテーションに最適です！
            </p>
          </div>
        </div>

        {/* 使用方法の説明 */}
        <div className="mt-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            📸 画像として保存する方法
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600 min-w-[20px]">1.</span>
              <span>気に入ったデザインのタブを選択</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600 min-w-[20px]">2.</span>
              <span>ブラウザの開発者ツール（F12）を開く</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600 min-w-[20px]">3.</span>
              <span>デバイスツールバーをクリック（📱アイコン）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600 min-w-[20px]">4.</span>
              <span>
                「その他のオプション」→「スクリーンショットをキャプチャ」
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600 min-w-[20px]">5.</span>
              <span>
                または、Figma、Canva等のデザインツールにコピー&ペースト
              </span>
            </div>
          </div>
        </div>

        {/* おすすめ用途 */}
        <div className="mt-8 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 活用アイデア
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• SNS投稿（Twitter、Instagram、LinkedIn）</li>
              <li>• ブログやnoteの記事ヘッダー</li>
              <li>• プレゼンテーション資料</li>
              <li>• アプリストアの宣伝画像</li>
              <li>• GitHubのREADME</li>
              <li>• 🆕 Live版：デモサイトやポートフォリオ</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              🎨 カスタマイズ提案
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• 実際のアプリスクリーンショットに置き換え</li>
              <li>• ブランドカラーに合わせて調整</li>
              <li>• 季節やキャンペーンに合わせたバージョン</li>
              <li>• 多言語版の作成</li>
              <li>• 動画版（MP4、GIF）の作成</li>
              <li>• 🆕 Live版：異なるページの埋め込み</li>
            </ul>
          </div>
        </div>

        {/* 推奨サイズガイド */}
        <div className="mt-8 max-w-2xl mx-auto bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            📐 推奨画像サイズ
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-yellow-800">
            <div>
              <strong>Twitter:</strong> 1200x675px
              <br />
              <strong>Instagram:</strong> 1080x1080px
              <br />
              <strong>Facebook:</strong> 1200x630px
            </div>
            <div>
              <strong>LinkedIn:</strong> 1200x627px
              <br />
              <strong>ブログヘッダー:</strong> 1200x400px
              <br />
              <strong>GitHub:</strong> 1280x640px
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <p className="text-yellow-900 font-medium">
              <strong>Live Demo版:</strong>{" "}
              動的コンテンツのため、スクリーンショット推奨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
