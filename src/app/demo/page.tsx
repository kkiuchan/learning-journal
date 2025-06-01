"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, Clock, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DemoRedirectPage() {
  const router = useRouter();

  // 3秒後に自動リダイレクト
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/demo/unit");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-6">
          <BookOpen className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-4">Learning Journal デモ</h1>
          <p className="text-muted-foreground mb-6">
            実際のユニット詳細画面と同じUIでサンプルデータをご確認いただけます
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center p-4">
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">学習ログ</span>
            <span className="text-xs text-muted-foreground">実際の記録例</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <Target className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">達成度管理</span>
            <span className="text-xs text-muted-foreground">進捗の可視化</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">学習時間</span>
            <span className="text-xs text-muted-foreground">時間の記録</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            3秒後に自動的にデモページに移動します...
          </p>

          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/demo/unit" className="flex items-center gap-2">
              今すぐデモを見る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/">ホームに戻る</Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
