"use client";

import { LearningProgress } from "@/components/dashboard/learning-progress";
import { DashboardStats } from "@/components/dashboard/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, User } from "lucide-react";
import Link from "next/link";

// サンプルデータ
const sampleStats = {
  totalLearningTime: 48.5,
  completedUnitsCount: 3,
  activeUnitsCount: 4,
  streakDays: 12,
};

const sampleProgressData = [
  { name: "3/15", hours: 2.5 },
  { name: "3/16", hours: 1.8 },
  { name: "3/17", hours: 0 },
  { name: "3/18", hours: 3.2 },
  { name: "3/19", hours: 2.1 },
  { name: "3/20", hours: 1.5 },
  { name: "3/21", hours: 2.8 },
];

const sampleActiveUnits = [
  {
    id: "programming",
    title: "Web開発実践スキル習得",
    progress: 85,
    learningGoal:
      "React・Next.jsを用いたモダンなWebアプリケーション開発技術の習得",
    achievementLevel: 85,
    demoUrl: "/demo/programming",
  },
  {
    id: "exam",
    title: "基本情報技術者試験対策",
    progress: 70,
    learningGoal: "基本情報技術者試験合格と情報処理の基礎知識の体系的理解",
    achievementLevel: 70,
    demoUrl: "/demo/exam",
  },
  {
    id: "business",
    title: "プロジェクトマネジメント実践スキル習得",
    progress: 75,
    learningGoal: "PMBOK基礎とアジャイル手法を活用した実践的PM能力の向上",
    achievementLevel: 75,
    demoUrl: "/demo/business",
  },
  {
    id: "language",
    title: "TOEIC 800点突破プロジェクト",
    progress: 75,
    learningGoal:
      "TOEIC 800点以上を取得し、ビジネス英語でのコミュニケーション能力を向上させる",
    achievementLevel: 75,
    demoUrl: "/demo/language",
  },
];

const sampleRecentLogs = [
  {
    title: "React Hooksの実践的活用法を学習",
    date: "2024-03-21T10:30:00Z",
    duration: 120,
    content:
      "useState、useEffect、useContextを使った状態管理の実装を練習。カスタムフックの作成も体験しました。",
    unitId: "programming",
    unitTitle: "Web開発実践スキル習得",
    demoUrl: "/demo/programming",
  },
  {
    title: "TOEIC Part 7長文読解対策",
    date: "2024-03-20T19:15:00Z",
    duration: 90,
    content:
      "ビジネス文書とEメールの読解練習。スキミング・スキャニング技術を意識して解答時間を短縮。",
    unitId: "language",
    unitTitle: "TOEIC 800点突破プロジェクト",
    demoUrl: "/demo/language",
  },
  {
    title: "アジャイル・スクラム実践研修",
    date: "2024-03-20T14:00:00Z",
    duration: 150,
    content:
      "スプリント計画、デイリースクラム、振り返りの実際の進め方を学習。ユーザーストーリーの書き方も練習。",
    unitId: "business",
    unitTitle: "プロジェクトマネジメント実践スキル習得",
    demoUrl: "/demo/business",
  },
  {
    title: "データベース設計基礎",
    date: "2024-03-19T16:45:00Z",
    duration: 105,
    content:
      "正規化、ER図の作成、SQLの基本文法について学習。実際のテーブル設計を体験しました。",
    unitId: "exam",
    unitTitle: "基本情報技術者試験対策",
    demoUrl: "/demo/exam",
  },
  {
    title: "Next.js App Routerの詳細機能",
    date: "2024-03-19T09:20:00Z",
    duration: 95,
    content:
      "Dynamic Routes、Server Components、Client Componentsの使い分けを学習。パフォーマンス最適化も意識。",
    unitId: "programming",
    unitTitle: "Web開発実践スキル習得",
    demoUrl: "/demo/programming",
  },
];

// 進行中のユニットコンポーネント
function DemoActiveUnits({ data }: { data: typeof sampleActiveUnits }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>進行中のユニット</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data.map((unit) => (
            <Link
              key={unit.id}
              href={unit.demoUrl}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-sm text-muted-foreground">
                      目標: {unit.learningGoal}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {unit.achievementLevel}%
                  </div>
                </div>
                <Progress
                  value={unit.achievementLevel}
                  className="bg-secondary/50"
                />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 最近の学習ログコンポーネント
function DemoRecentLogs({ data }: { data: typeof sampleRecentLogs }) {
  const truncateText = (text: string) => {
    if (text.length <= 80) return text;
    return text.substring(0, 80) + "...";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>最近の学習ログ</CardTitle>
        <Button variant="ghost" size="icon" disabled>
          <User className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((log, index) => (
            <Link
              key={index}
              href={log.demoUrl}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{log.title}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {((log.duration || 0) / 60).toFixed(1)}時間
                  </div>
                </div>
                {log.content && (
                  <div className="text-sm text-muted-foreground">
                    {truncateText(log.content)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("ja-JP")} •{" "}
                  {log.unitTitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* デモ告知バナー */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            📊 ダッシュボードのデモページです。
            実際の進捗管理画面と同様のUIで学習状況を確認いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-blue-200"
            >
              無料で始める →
            </Link>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ダッシュボード
            </h1>
            <p className="text-muted-foreground">
              あなたの学習進捗状況と最近の活動を確認できます。
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button disabled>新規ユニット</Button>
            <Button variant="outline" disabled>
              プロフィール
            </Button>
          </div>
        </div>

        {/* 統計とグラフ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DashboardStats data={sampleStats} />
          <LearningProgress data={sampleProgressData} />
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DemoActiveUnits data={sampleActiveUnits} />
          <DemoRecentLogs data={sampleRecentLogs} />
        </div>

        {/* 登録促進CTA */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                本格的な学習管理を始めませんか？
              </h3>
              <p className="text-lg mb-6 opacity-90">
                実際のダッシュボードでは、より詳細な分析機能、目標設定、
                AIによる学習アドバイスなど、充実した機能をご利用いただけます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
                  >
                    無料で始める
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8"
                  >
                    詳細を見る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
