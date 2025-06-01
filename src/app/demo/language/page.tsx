"use client";

import { Sidebar } from "@/app/units/[id]/components/Sidebar";
import { UnitHeader } from "@/app/units/[id]/components/UnitHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// サンプルユーザーデータ
const sampleUser = {
  id: "demo-user",
  name: "佐藤 美咲",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（語学学習）
const initialUnitData = {
  id: 1,
  title: "TOEIC 800点突破プロジェクト",
  learningGoal:
    "TOEIC 800点以上を取得し、ビジネス英語でのコミュニケーション能力を向上させる",
  preLearningState:
    "TOEIC 650点レベル。基本的な英文法は理解しているが、リスニングとビジネス語彙に課題がある",
  reflection:
    "毎日の継続学習により、リスニング力が大幅に向上しました。シャドーイングとディクテーションの効果を実感し、ビジネス語彙も着実に増えています。実際の英語会議でも以前より理解できるようになりました。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 75,
  visibility: "public" as const,
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-01-15T00:00:00Z",
  endDate: null,
  nextAction:
    "TOEIC Part 7の長文読解スピード向上とビジネスプレゼンテーション練習",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "TOEIC" },
    { id: 2, name: "英語学習" },
    { id: 3, name: "ビジネス英語" },
    { id: 4, name: "リスニング" },
  ],
  unitTags: [
    { tag: { name: "TOEIC" } },
    { tag: { name: "英語学習" } },
    { tag: { name: "ビジネス英語" } },
    { tag: { name: "リスニング" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 24,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（語学学習）
const initialComments = [
  {
    id: 1,
    comment:
      "TOEIC学習お疲れ様です！シャドーイングの継続、素晴らしいですね。リスニング力向上には最も効果的な方法の一つです。私も同じ方法で100点以上スコアアップしました。継続が鍵ですね！",
    createdAt: "2024-01-18T10:30:00Z",
    user: {
      id: "user-1",
      name: "田中 英子",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "ビジネス語彙の習得が順調とのことですが、実際の使用場面を想定した練習もお勧めします。オンライン英会話でビジネスシーンのロールプレイをすると、より実践的なスキルが身につきますよ！",
    createdAt: "2024-02-05T14:20:00Z",
    user: {
      id: "user-2",
      name: "山田 太郎",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "英語会議での理解度向上、おめでとうございます！実践的な成果が出ているのは素晴らしいです。TOEIC 800点突破まであと少しですね。Part 7の時間配分練習も重要なポイントです。",
    createdAt: "2024-02-20T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（語学学習）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "シャドーイング練習とリスニング基礎",
    learningTime: 90,
    note: "# シャドーイング練習とリスニング基礎\n\n## 今日の学習内容\n- BBC Learning Englishでシャドーイング練習\n- TOEIC Part 1, 2の問題演習\n- 発音記号の復習\n\n## 実践した内容\n- 5分間のニュース音声でシャドーイング\n- 聞き取れない単語の書き出しと復習\n- 音の変化（リンキング、リダクション）の確認\n\n## 理解したこと\n- シャドーイングで口の動きと音の関係を体感\n- 英語のリズムとイントネーションの重要性\n- 聞き取りにくい音の特徴\n\n## 次回の予定\n- ディクテーション練習の導入\n- ビジネス英語の基本表現学習",
    logDate: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-15T20:00:00Z",
    updatedAt: "2024-01-15T20:00:00Z",
    effectScore: 4,
    effectType: "practical" as const,
    tags: [
      { id: 1, name: "シャドーイング" },
      { id: 2, name: "リスニング" },
      { id: 3, name: "発音" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "ウェブサイト",
        resourceLink: "https://www.bbc.co.uk/learningenglish/",
        description: "BBC Learning English",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "ビジネス語彙とTOEIC Part 5対策",
    learningTime: 120,
    note: "# ビジネス語彙とTOEIC Part 5対策\n\n## 学習したビジネス語彙\n- 会議関連：agenda, minutes, postpone, reschedule\n- 財務関連：revenue, expenditure, budget, forecast\n- 人事関連：recruit, retain, evaluate, promote\n\n## TOEIC Part 5 文法問題\n- 品詞問題（名詞・形容詞・副詞の使い分け）\n- 動詞の時制と態\n- 前置詞と接続詞の選択\n\n## 苦労した点\n- 似た意味の単語の使い分け\n- 文脈に応じた適切な語彙選択\n\n## 成果\n- Part 5の正答率が70%から85%に向上\n- ビジネスメールでよく使う表現を習得",
    logDate: "2024-01-22T00:00:00Z",
    createdAt: "2024-01-22T19:30:00Z",
    updatedAt: "2024-01-22T19:30:00Z",
    effectScore: 5,
    effectType: "understanding" as const,
    tags: [
      { id: 4, name: "ビジネス語彙" },
      { id: 5, name: "TOEIC Part 5" },
      { id: 6, name: "文法" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "書籍",
        resourceLink: "https://example.com/toeic-vocabulary",
        description: "TOEIC L&R TEST 出る単特急 金のフレーズ",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "ディクテーションとリスニング強化",
    learningTime: 75,
    note: "# ディクテーションとリスニング強化\n\n## 実践したディクテーション\n- TED Talksの3分間セクション\n- TOEIC Part 3の会話問題\n- ビジネス英語のプレゼンテーション音声\n\n## 発見した課題\n- 機能語（前置詞、冠詞）の聞き取り\n- 早口での音の変化\n- 専門用語の聞き取り\n\n## 改善した点\n- 集中力の持続時間が延びた\n- 音の変化パターンの理解\n- 文脈からの推測能力向上\n\n## 学んだスキル\n- 効果的なディクテーション方法\n- 聞き取れない部分の分析手法",
    logDate: "2024-02-05T00:00:00Z",
    createdAt: "2024-02-05T18:00:00Z",
    updatedAt: "2024-02-05T18:00:00Z",
    effectScore: 4,
    effectType: "practical" as const,
    tags: [
      { id: 7, name: "ディクテーション" },
      { id: 8, name: "TED Talks" },
      { id: 9, name: "TOEIC Part 3" },
    ],
    resources: [],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "模擬試験と弱点分析",
    learningTime: 180,
    note: "# 模擬試験と弱点分析\n\n## 実施した模擬試験\n- TOEIC公式問題集 Vol.8\n- オンライン模擬試験（2回分）\n- 時間配分を意識した本番形式\n\n## スコア結果\n- リスニング：420点（前回比+30点）\n- リーディング：350点（前回比+20点）\n- 総合：770点（目標800点まで30点）\n\n## 弱点分析\n- Part 7の長文読解で時間不足\n- Part 6の文挿入問題の正答率低下\n- 集中力の維持（特に後半）\n\n## 改善策\n- 速読練習の強化\n- 文挿入問題の解法パターン習得\n- 体調管理と集中力維持の工夫\n\n## 次のステップ\n- Part 7特化の時間配分練習\n- ビジネス文書の読解スピード向上",
    logDate: "2024-02-20T00:00:00Z",
    createdAt: "2024-02-20T20:30:00Z",
    updatedAt: "2024-02-20T20:30:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 10, name: "模擬試験" },
      { id: 11, name: "弱点分析" },
      { id: 12, name: "時間配分" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "書籍",
        resourceLink: "https://example.com/toeic-official",
        description: "TOEIC公式問題集",
        fileName: null,
        filePath: null,
      },
    ],
  },
];

// ページネーション
const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 4,
};

export default function DemoLanguagePage() {
  const [unit, setUnit] = useState(initialUnitData);
  const [comments, setComments] = useState(initialComments);
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [currentUrl, setCurrentUrl] = useState(
    "https://learning-journal-app.com/demo/language"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス（語学学習特化）
  const sampleAdvice = `TOEIC 800点突破に向けた素晴らしい取り組みですね！現在770点まで到達されており、目標まであと30点という段階での学習状況を拝見して、具体的なアドバイスをお伝えします。

## 現在の学習状況について

**素晴らしい点：**
- シャドーイングとディクテーションの継続的な実践
- ビジネス語彙の体系的な習得
- 模擬試験による客観的な実力把握
- 弱点分析に基づく改善策の立案

## 800点突破のための戦略

### 1. Part 7 長文読解の時間短縮
現在の最大の課題である時間不足を解決するために：

**速読スキルの向上：**
- **スキミング練習** - 文章全体の構造を素早く把握
- **スキャニング練習** - 必要な情報を効率的に探す
- **パラグラフリーディング** - 段落ごとの要点を瞬時に理解

**時間配分の最適化：**
- Part 5: 10分以内（1問20秒）
- Part 6: 8分以内（1問1分20秒）
- Part 7: 残り時間をフル活用

### 2. Part 6 文挿入問題の攻略
正答率向上のための具体的アプローチ：

- **文脈理解** - 前後の文との論理的つながりを重視
- **代名詞・指示語** - 何を指しているかを正確に把握
- **時制の一致** - 文章全体の時間軸を意識
- **接続詞の役割** - 文と文の関係性を理解

### 3. 集中力維持の戦略

**試験当日の体調管理：**
- 前日の十分な睡眠（7-8時間）
- 試験2時間前の軽い食事
- カフェイン摂取のタイミング調整

**集中力維持のテクニック：**
- 深呼吸による緊張緩和
- 問題間での短時間リセット
- ポジティブな自己暗示

### 4. 残り期間の学習プラン

**Week 1-2: 基礎固め**
- Part 7の速読練習（毎日30分）
- Part 6の文挿入問題集中演習
- ビジネス語彙の最終確認

**Week 3-4: 実践練習**
- 本番形式の模擬試験（週2回）
- 時間配分の微調整
- 弱点部分の重点復習

**試験直前: コンディション調整**
- 軽い復習とメンタル準備
- 体調管理の徹底
- 当日の流れのシミュレーション

### 5. 800点突破後の展望

**次のステップ提案：**
- **TOEIC 900点** - より高度なビジネス英語力
- **英検準1級** - 4技能バランスの向上
- **実践的なスピーキング** - オンライン英会話の活用
- **専門分野の英語** - 業界特化の語彙・表現

## 学習効率を最大化するコツ

1. **質の高い復習** - 間違えた問題の根本原因分析
2. **実践的な学習** - 実際のビジネスシーンを想定
3. **継続的な評価** - 週単位での進捗確認
4. **モチベーション維持** - 小さな成功を積み重ねる

現在の学習ペースと質の高さを維持すれば、800点突破は十分に達成可能です！最後の追い込み、応援しています。`;

  // デモ用の操作ハンドラー
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URLをコピーしました");
    } catch (error) {
      toast.error("URLのコピーに失敗しました");
    }
  };

  const handleDelete = async () => {
    toast.error("デモ環境では削除機能は利用できません");
  };

  const scrollToComments = useCallback(() => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // AIアドバイス機能のハンドラー
  const handleAdviceClick = async () => {
    setIsAdviceDialogOpen(true);
    setIsAdviceLoading(true);
    setAdviceContent("");

    // デモ環境での擬似的なストリーミング表示
    setTimeout(() => {
      let currentText = "";
      const words = sampleAdvice.split("");
      let index = 0;

      const typeWriter = () => {
        if (index < words.length) {
          currentText += words[index];
          setAdviceContent(currentText);
          index++;
          setTimeout(typeWriter, 20); // 20msごとに文字を追加
        } else {
          setIsAdviceLoading(false);
        }
      };

      typeWriter();
    }, 500);
  };

  const handleAddAdviceComment = async () => {
    if (!adviceContent.trim()) return;

    try {
      setIsAddingAdviceComment(true);
      await handleAddAIComment(adviceContent);
      setIsAdviceDialogOpen(false);
    } catch (error) {
      console.error("Error adding advice comment:", error);
    } finally {
      setIsAddingAdviceComment(false);
    }
  };

  const handleAddAIComment = async (comment: string) => {
    if (!comment.trim()) return;

    try {
      const newComment = {
        id: Date.now(),
        comment: comment,
        createdAt: new Date().toISOString(),
        user: {
          id: "ai-assistant",
          name: "AIアシスタント",
          image: "/images/ai-assistant.png",
        },
      };

      setComments((prev) => [newComment, ...prev]);
      setUnit((prev) => ({
        ...prev,
        _count: {
          ...prev._count,
          comments: prev._count.comments + 1,
        },
        commentsCount: prev.commentsCount + 1,
      }));

      toast.success("AIアドバイスをコメントに追加しました");
    } catch (error) {
      console.error("Error adding AI comment:", error);
      toast.error("コメントの追加に失敗しました");
    }
  };

  const handleCreateComment = async (comment: string) => {
    if (!comment.trim()) return;

    try {
      const newComment = {
        id: Date.now(),
        comment,
        createdAt: new Date().toISOString(),
        user: {
          id: sampleUser.id,
          name: sampleUser.name,
          image: sampleUser.image,
        },
      };

      setComments((prev) => [newComment, ...prev]);
      setUnit((prev) => ({
        ...prev,
        _count: {
          ...prev._count,
          comments: prev._count.comments + 1,
        },
        commentsCount: prev.commentsCount + 1,
      }));

      toast.success("コメントを作成しました");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("コメントの作成に失敗しました");
    }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, comment: content } : comment
        )
      );

      toast.success("コメントを更新しました");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("コメントの更新に失敗しました");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("このコメントを削除してもよろしいですか？")) return;
    if (isDeletingComment) return;

    setIsDeletingComment(true);
    try {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setUnit((prev) => ({
        ...prev,
        _count: {
          ...prev._count,
          comments: prev._count.comments - 1,
        },
        commentsCount: prev.commentsCount - 1,
      }));

      toast.success("コメントを削除しました");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("コメントの削除に失敗しました");
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleLike = async () => {
    try {
      setUnit((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        _count: {
          ...prev._count,
          unitLikes: prev.isLiked
            ? prev._count.unitLikes - 1
            : prev._count.unitLikes + 1,
        },
      }));

      toast.success(unit.isLiked ? "いいねを取り消しました" : "いいねしました");
    } catch (error) {
      console.error("Error handling like:", error);
      toast.error("いいねの処理に失敗しました");
    }
  };

  const mutateUnit = async (data?: any, shouldRevalidate?: boolean) => {
    if (data?.data) {
      setUnit(data.data);
    }
  };

  // デモ用ユニットコンテンツ
  const DemoUnitContent = () => {
    const [achievementLevel, setAchievementLevel] = useState(
      unit.achievementLevel || 0
    );
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAchievementUpdate = async (value: number) => {
      setIsUpdating(true);

      // 楽観的更新
      setAchievementLevel(value);
      setUnit((prev) => ({
        ...prev,
        achievementLevel: value,
      }));

      // デモ環境では実際のAPIコールはせずに、短時間待機
      setTimeout(() => {
        setIsUpdating(false);
        toast.success("達成度を更新しました");
      }, 500);
    };

    return (
      <div className="bg-card border rounded-lg p-4 mt-4">
        <div className="space-y-4">
          {/* 達成度スライダー */}
          <div>
            <h3 className="text-lg font-semibold mb-2">達成度</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[achievementLevel]}
                  onValueChange={(value) => setAchievementLevel(value[0])}
                  onValueCommit={(value) => handleAchievementUpdate(value[0])}
                  max={100}
                  step={1}
                  disabled={isUpdating}
                  className="transition-opacity duration-200"
                  style={{ opacity: isUpdating ? 0.7 : 1 }}
                />
              </div>
              <div className="w-16 text-right font-medium">
                {achievementLevel}%
              </div>
            </div>
          </div>

          {unit.learningGoal && (
            <div>
              <h3 className="text-lg font-semibold mb-2">学習目標</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.learningGoal}
                </div>
              </div>
            </div>
          )}

          {unit.preLearningState && (
            <div>
              <h3 className="text-lg font-semibold mb-2">学習前の状態</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.preLearningState}
                </div>
              </div>
            </div>
          )}

          {unit.reflection && (
            <div>
              <h3 className="text-lg font-semibold mb-2">振り返り</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.reflection}
                </div>
              </div>
            </div>
          )}

          {unit.nextAction && (
            <div>
              <h3 className="text-lg font-semibold mb-2">次のアクション</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.nextAction}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // デモ用ログセクション
  const DemoLogsSection = () => (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">学習ログ</h2>
        <div className="flex gap-2">
          <Button size="sm" disabled variant="outline">
            ➕ ログを追加
          </Button>
          <Button
            onClick={handleAdviceClick}
            disabled={isAdviceLoading}
            size="sm"
            className="relative bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium shadow-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
          >
            {isAdviceLoading ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 animate-spin" />
                <span className="hidden sm:inline">生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">AIアドバイス</span>
              </>
            )}
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-bold px-1 py-0.5 rounded-full">
              PRO
            </span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-card border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{log.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  <span>
                    📅 {new Date(log.logDate).toLocaleDateString("ja-JP")}
                  </span>
                  <span>⏱️ {log.learningTime}分</span>
                  <span>⭐ {log.effectScore}/5</span>
                  <span>
                    📊{" "}
                    {log.effectType === "understanding"
                      ? "理解"
                      : log.effectType === "practical"
                        ? "実践"
                        : log.effectType === "application"
                          ? "応用"
                          : "その他"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {log.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-4">
              <div className="whitespace-pre-wrap text-sm">{log.note}</div>
            </div>

            {log.resources && log.resources.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">参考資料</h4>
                <div className="space-y-2">
                  {log.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {resource.resourceType}:
                      </span>
                      <a
                        href={resource.resourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {resource.description}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // デモ用コメントセクション
  const DemoCommentsSection = () => (
    <div id="comments-section" className="mt-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">コメント</h2>

      {/* コメント作成フォーム */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">コメントを追加</h3>
        <div className="space-y-3">
          <textarea
            placeholder="コメントを入力してください..."
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                const target = e.target as HTMLTextAreaElement;
                if (target.value.trim()) {
                  handleCreateComment(target.value);
                  target.value = "";
                }
              }
            }}
          />
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Ctrl + Enter で送信</span>
            <button
              onClick={(e) => {
                const textarea =
                  e.currentTarget.parentElement?.parentElement?.querySelector(
                    "textarea"
                  ) as HTMLTextAreaElement;
                if (textarea?.value.trim()) {
                  handleCreateComment(textarea.value);
                  textarea.value = "";
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              コメント送信
            </button>
          </div>
        </div>
      </div>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {comment.user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString("ja-JP")}
                  </span>
                  {comment.user.id === "ai-assistant" && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                      AIアドバイス
                    </span>
                  )}
                  {comment.user.id === sampleUser.id && (
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => {
                          const newContent = prompt(
                            "コメントを編集:",
                            comment.comment
                          );
                          if (newContent && newContent !== comment.comment) {
                            handleUpdateComment(comment.id, newContent);
                          }
                        }}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {comment.comment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ページネーション（デモでは機能なし） */}
      {comments.length > 0 && (
        <div className="mt-6 flex justify-center">
          <div className="text-sm text-muted-foreground">
            {comments.length} 件のコメント
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen">
      {/* デモ告知バナー */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🌍 語学学習のデモページです。 TOEIC
            800点突破を目指すビジネス英語学習の記録例をご確認いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-purple-200"
            >
              無料で始める →
            </Link>
          </p>
        </div>
      </div>

      <Sidebar
        unit={unit}
        session={sampleSession}
        id="demo"
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        handleCopyUrl={handleCopyUrl}
        copied={copied}
        handleLike={handleLike}
        handleDelete={handleDelete}
        menuRefs={menuRefs}
        currentUrl={currentUrl}
        commentCount={unit._count?.comments || 0}
        onCommentClick={scrollToComments}
        onMutate={mutateUnit}
        className="fixed left-[clamp(-50px,calc(50%-640px-64px),200px)] top-[calc(50%+100px)] -translate-y-1/2 hidden lg:flex"
      />

      <main className="max-w-6xl w-full mx-auto p-2 lg:pl-[clamp(80px,0px,10%)]">
        <UnitHeader
          unit={unit}
          session={sampleSession}
          onMutate={mutateUnit}
          handleLike={handleLike}
          scrollToComments={scrollToComments}
        />

        <DemoUnitContent />

        <DemoLogsSection />

        <DemoCommentsSection />

        {/* 登録促進CTA */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🌟 語学学習を記録しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような詳細な学習記録で、
                <br />
                あなたの語学力の成長を可視化しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">目標管理</div>
                  <div className="opacity-80">TOEIC・英検の進捗追跡</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-semibold">学習記録</div>
                  <div className="opacity-80">語彙・文法・会話の習得</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold">スキル向上</div>
                  <div className="opacity-80">4技能の総合的な成長</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-full shadow-lg"
                >
                  <Link href="/auth/register">
                    無料で始める
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/20 backdrop-blur border-2 border-white text-white hover:bg-white hover:text-purple-600 font-bold px-8 py-3 rounded-full transition-all duration-300"
                >
                  <Link href="/">他のデモを見る</Link>
                </Button>
              </div>

              <p className="text-sm opacity-75 mt-4">
                ✅ 無料プランあり　✅ TOEIC対応　✅ 4技能バランス学習
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* AIアドバイスDialog */}
      <Dialog open={isAdviceDialogOpen} onOpenChange={setIsAdviceDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[90vw] max-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
              語学学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの語学学習記録に基づいて生成されています。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {adviceContent ? (
                <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4 bg-card">
                  {adviceContent.split("\n").map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">アドバイスを生成中...</p>
              )}
            </div>
            {isAdviceLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {adviceContent && !isAdviceLoading && (
            <DialogFooter className="mt-4">
              <Button
                onClick={handleAddAdviceComment}
                disabled={isAddingAdviceComment}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isAddingAdviceComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    追加中...
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    コメントとして追加
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
