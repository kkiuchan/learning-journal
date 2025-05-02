import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "使い方ガイド",
  description: "Learning Journalの使い方を詳しく説明します。",
};

const guides = [
  {
    title: "1. アカウント作成とログイン",
    description: "まずは、アカウントを作成してログインしましょう。",
    steps: [
      "「新規登録」ボタンをクリックし、必要な情報を入力",
      "メールアドレスの確認",
      "ログインして学習を始める",
    ],
  },
  {
    title: "2. 学習ユニットの作成",
    description: "学習内容を整理するためのユニットを作成します。",
    steps: [
      "「新規ユニット作成」ボタンをクリック",
      "タイトル、説明、目標を設定",
      "カテゴリーとタグを追加",
      "学習期間を設定",
    ],
  },
  {
    title: "3. 学習ログの記録",
    description: "日々の学習内容を記録していきます。",
    steps: [
      "該当するユニットを選択",
      "「ログを記録」ボタンをクリック",
      "学習内容、時間、気づきを記録",
      "必要に応じて画像やファイルを添付",
    ],
  },
  {
    title: "4. 進捗の確認",
    description: "学習の進み具合を確認し、計画を調整します。",
    steps: [
      "ダッシュボードで全体の進捗を確認",
      "グラフや統計で学習パターンを分析",
      "目標達成度をチェック",
      "必要に応じて計画を見直し",
    ],
  },
  {
    title: "5. コミュニティ活用",
    description: "他のユーザーと交流し、モチベーションを高めます。",
    steps: [
      "興味のある学習者をフォロー",
      "学習ログにコメントやいいねを付ける",
      "グループに参加して情報交換",
      "質問や相談を投稿",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">使い方ガイド</h1>
          <p className="text-xl text-muted-foreground">
            Learning Journalを最大限活用するためのガイドです
          </p>
        </div>

        <div className="space-y-12">
          {guides.map((guide) => (
            <section
              key={guide.title}
              className="border-b pb-8 last:border-b-0"
            >
              <h2 className="text-2xl font-semibold mb-4">{guide.title}</h2>
              <p className="text-muted-foreground mb-6">{guide.description}</p>

              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-medium mb-4">手順</h3>
                <ol className="list-decimal list-inside space-y-3">
                  {guide.steps.map((step) => (
                    <li key={step} className="text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center space-y-6">
          <h2 className="text-2xl font-bold">さっそく始めてみましょう！</h2>
          <p className="text-muted-foreground">
            詳しい説明が必要な場合は、各機能のヘルプをご確認ください。
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/help">ヘルプセンター</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
