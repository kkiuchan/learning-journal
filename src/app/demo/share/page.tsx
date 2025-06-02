"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Check,
  Clock,
  Copy,
  Facebook,
  Heart,
  Linkedin,
  MessageSquare,
  Share2,
  Target,
  Twitter,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// サンプル学習ユニットデータ
const sampleUnit = {
  id: "web-dev-mastery",
  title: "Web開発実践スキル習得",
  learningGoal:
    "React・Next.jsを用いたモダンなWebアプリケーション開発技術の習得",
  preLearningState:
    "HTML/CSS基礎は理解済み。JavaScriptの基本的な文法は知っているが、フレームワークは未経験",
  reflection:
    "実際にプロジェクトを作りながら学ぶことで、理論だけでは分からなかった部分が明確になりました。特にstate管理やコンポーネント設計の重要性を実感できました。",
  status: "IN_PROGRESS",
  achievementLevel: 85,
  user: {
    name: "田中 太郎",
  },
  tags: ["React", "Next.js", "TypeScript", "Web開発"],
  startDate: "2024-02-01",
  totalLogs: 28,
  totalLearningTime: 84.5,
  likesCount: 15,
  commentsCount: 8,
};

// サンプル共有された投稿データ
const sampleSharedPosts = [
  {
    id: 1,
    user: {
      name: "佐藤 美咲",
    },
    unitTitle: "TOEIC 800点突破プロジェクト",
    achievement: "リスニングスコア大幅向上！",
    content:
      "シャドーイングを毎日30分続けた結果、リスニングスコアが120点も上がりました！継続は力なりを実感。",
    tags: ["TOEIC", "英語学習", "リスニング"],
    likes: 23,
    comments: 5,
    timeAgo: "2時間前",
  },
  {
    id: 2,
    user: {
      name: "山田 健太",
    },
    unitTitle: "基本情報技術者試験対策",
    achievement: "模擬試験で合格ライン突破！",
    content:
      "アルゴリズムの問題が苦手でしたが、毎日の積み重ねで理解できるようになりました。あと1ヶ月で本試験です！",
    tags: ["基本情報", "IT", "資格"],
    likes: 18,
    comments: 7,
    timeAgo: "1日前",
  },
  {
    id: 3,
    user: {
      name: "鈴木 花子",
    },
    unitTitle: "プロジェクトマネジメント実践",
    achievement: "初のPM案件成功！",
    content:
      "学習したスクラム手法を実際のプロジェクトで実践。チームのコミュニケーションが劇的に改善し、納期も前倒しで完了できました。",
    tags: ["PM", "スクラム", "マネジメント"],
    likes: 31,
    comments: 12,
    timeAgo: "3日前",
  },
];

export default function DemoSharePage() {
  const [copied, setCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const shareUrl = `https://learning-journal.example.com/units/${sampleUnit.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform: string) => {
    const message =
      customMessage ||
      `${sampleUnit.title}の学習記録を共有しました！\n\n目標: ${sampleUnit.learningGoal}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareUrl);

    let shareUrlForPlatform = "";

    switch (platform) {
      case "twitter":
        shareUrlForPlatform = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrlForPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrlForPlatform = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    if (shareUrlForPlatform) {
      window.open(shareUrlForPlatform, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* デモ告知バナー */}
      <div className="bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🤝 共有機能のデモページです。
            学習記録を簡単に仲間と共有し、互いに刺激し合える機能をご確認いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-green-200"
            >
              無料で始める →
            </Link>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            学習記録の共有
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            あなたの学習成果を仲間と共有し、互いのモチベーション向上につなげましょう。
            簡単な操作で SNS やリンク共有が可能です。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 左側: 学習ユニット表示と共有機能 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">学習ユニット</CardTitle>
                  <Dialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        共有する
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>学習記録を共有</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* カスタムメッセージ */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            メッセージ（任意）
                          </label>
                          <Textarea
                            placeholder="学習の成果や感想を一言..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>

                        {/* SNS共有ボタン */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            SNSで共有
                          </label>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSocialShare("twitter")}
                              className="flex-1 bg-blue-500 hover:bg-blue-600"
                            >
                              <Twitter className="h-4 w-4 mr-2" />
                              Twitter
                            </Button>
                            <Button
                              onClick={() => handleSocialShare("facebook")}
                              className="flex-1 bg-blue-700 hover:bg-blue-800"
                            >
                              <Facebook className="h-4 w-4 mr-2" />
                              Facebook
                            </Button>
                            <Button
                              onClick={() => handleSocialShare("linkedin")}
                              className="flex-1 bg-blue-800 hover:bg-blue-900"
                            >
                              <Linkedin className="h-4 w-4 mr-2" />
                              LinkedIn
                            </Button>
                          </div>
                        </div>

                        {/* リンクコピー */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            リンクをコピー
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={shareUrl}
                              readOnly
                              className="flex-1"
                            />
                            <Button
                              onClick={handleCopyLink}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {copied && (
                            <p className="text-sm text-green-600 mt-1">
                              リンクをコピーしました！
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ユーザー情報 */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {sampleUnit.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{sampleUnit.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sampleUnit.startDate} 開始
                    </p>
                  </div>
                </div>

                {/* ユニット情報 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {sampleUnit.title}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>目標: {sampleUnit.learningGoal}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{sampleUnit.totalLogs}件の学習記録</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{sampleUnit.totalLearningTime}時間</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>達成度</span>
                        <span>{sampleUnit.achievementLevel}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${sampleUnit.achievementLevel}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sampleUnit.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 振り返り */}
                <div>
                  <h4 className="font-medium mb-2">学習の振り返り</h4>
                  <p className="text-sm text-muted-foreground">
                    {sampleUnit.reflection}
                  </p>
                </div>

                {/* エンゲージメント */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{sampleUnit.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{sampleUnit.commentsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 共有のメリット */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  共有のメリット
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">モチベーション向上</p>
                      <p className="text-muted-foreground">
                        仲間からの反応やアドバイスでやる気アップ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">新しい学習法の発見</p>
                      <p className="text-muted-foreground">
                        他の人の学習方法を参考にできる
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">学習の可視化</p>
                      <p className="text-muted-foreground">
                        成果を共有することで自信につながる
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: 共有された投稿一覧 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                みんなの学習記録
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                コミュニティで共有された最新の学習成果をチェックしましょう
              </p>
            </div>

            <div className="space-y-4">
              {sampleSharedPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* ユーザー情報 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {post.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {post.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {post.timeAgo}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 投稿内容 */}
                      <div>
                        <p className="font-medium text-sm mb-1">
                          {post.unitTitle}
                        </p>
                        <p className="text-sm text-green-600 font-medium mb-2">
                          🎉 {post.achievement}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {post.content}
                        </p>
                      </div>

                      {/* タグ */}
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* エンゲージメント */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-500 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* 登録促進CTA */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                学習コミュニティに参加しませんか？
              </h3>
              <p className="text-lg mb-6 opacity-90">
                あなたの学習記録を共有し、同じ目標を持つ仲間と切磋琢磨しながら
                成長していきましょう。共有機能で学習がもっと楽しくなります。
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
                    className="border-white/70 bg-transparent text-white hover:bg-white hover:text-purple-600 hover:border-white transition-all duration-200 px-8 font-medium shadow-lg"
                  >
                    他の機能も確認する
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
