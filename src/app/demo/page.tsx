"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, LineChart, Users } from "lucide-react";
import Link from "next/link";

// サンプルの学習ログデータ
const sampleLogs = [
  {
    id: "demo-1",
    title: "React Hooksの基礎",
    content:
      "useStateとuseEffectの使い方について学習。状態管理の基本を理解できた。",
    category: "プログラミング",
    createdAt: "2024-03-20",
  },
  {
    id: "demo-2",
    title: "Next.js App Routerの実践",
    content:
      "サーバーコンポーネントとクライアントコンポーネントの使い分けについて学習。",
    category: "プログラミング",
    createdAt: "2024-03-19",
  },
  {
    id: "demo-3",
    title: "TypeScriptの型システム",
    content:
      "ジェネリクスと型推論について深く学習。型安全なコードの書き方を習得。",
    category: "プログラミング",
    createdAt: "2024-03-18",
  },
];

// サンプルの統計データ
const sampleStats = {
  totalStudyHours: 24,
  totalLogs: 15,
  streakDays: 7,
  categories: ["プログラミング", "英語", "資格試験"],
};

export default function DemoPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Learning Journal デモ</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="logs">学習ログ</TabsTrigger>
          <TabsTrigger value="stats">統計</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">
              デモアカウントの概要
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">総学習ログ</p>
                  <p className="text-2xl font-bold">
                    {sampleStats.totalLogs}件
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LineChart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">総学習時間</p>
                  <p className="text-2xl font-bold">
                    {sampleStats.totalStudyHours}時間
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">継続日数</p>
                  <p className="text-2xl font-bold">
                    {sampleStats.streakDays}日
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">学習カテゴリー</h3>
            <div className="flex gap-2 flex-wrap">
              {sampleStats.categories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {sampleLogs.map((log) => (
            <Card key={log.id} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{log.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {log.createdAt}
                </span>
              </div>
              <p className="text-muted-foreground mb-3">{log.content}</p>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {log.category}
              </span>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">学習統計</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">総学習時間</span>
                <span className="font-semibold">
                  {sampleStats.totalStudyHours}時間
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">総学習ログ数</span>
                <span className="font-semibold">{sampleStats.totalLogs}件</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">継続日数</span>
                <span className="font-semibold">
                  {sampleStats.streakDays}日
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">学習カテゴリー数</span>
                <span className="font-semibold">
                  {sampleStats.categories.length}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          デモを体験いただきありがとうございます。
          <br />
          実際に使ってみませんか？
        </p>
        <Button asChild size="lg">
          <Link href="/auth/register">無料で始める</Link>
        </Button>
      </div>
    </main>
  );
}
