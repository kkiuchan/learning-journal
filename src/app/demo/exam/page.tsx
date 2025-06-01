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
  name: "鈴木 花子",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（資格試験対策）
const initialUnitData = {
  id: 1,
  title: "基本情報技術者試験対策",
  learningGoal:
    "基本情報技術者試験に合格し、ITの基礎知識を体系的に習得する。特にアルゴリズムとプログラミング分野で高得点を目指す",
  preLearningState:
    "プログラミング経験は少しあるが、ネットワークやデータベース、セキュリティなどの知識が不足している",
  reflection:
    "午前問題は過去問演習により安定して7割取れるようになりました。午後問題のアルゴリズムとプログラミングも基本的な問題は解けるようになり、実際の試験に向けて自信がついてきました。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 75,
  visibility: "public" as const,
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-01-15T00:00:00Z",
  endDate: "2024-04-21T00:00:00Z",
  nextAction: "午後問題の応用問題対策と模擬試験での実践練習",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "基本情報技術者" },
    { id: 2, name: "IT資格" },
    { id: 3, name: "アルゴリズム" },
    { id: 4, name: "ネットワーク" },
  ],
  unitTags: [
    { tag: { name: "基本情報技術者" } },
    { tag: { name: "IT資格" } },
    { tag: { name: "アルゴリズム" } },
    { tag: { name: "ネットワーク" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 12,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（資格試験対策）
const initialComments = [
  {
    id: 1,
    comment:
      "基本情報技術者試験の勉強お疲れ様です！午前問題で7割安定は素晴らしいですね。午後問題のアルゴリズムは慣れが重要なので、継続的な練習が効果的です。",
    createdAt: "2024-01-20T10:30:00Z",
    user: {
      id: "user-1",
      name: "田中 太郎",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "私も昨年基本情報技術者試験に合格しました！午後問題は時間配分が重要です。アルゴリズムとプログラミングに時間をかけすぎないよう注意してください。応援しています！",
    createdAt: "2024-02-05T14:20:00Z",
    user: {
      id: "user-2",
      name: "佐藤 美咲",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "試験まで残り1ヶ月ですね！現在の進捗状況を見ると、合格圏内に入っていると思います。最後の追い込みとして、模擬試験での時間管理練習をお勧めします。",
    createdAt: "2024-03-15T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（資格試験対策）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "午前問題：基礎理論とアルゴリズム",
    learningTime: 120,
    note: "# 午前問題：基礎理論とアルゴリズム\n\n## 学習内容\n- 2進数、8進数、16進数の変換\n- 論理演算（AND、OR、NOT、XOR）\n- データ構造（配列、リスト、スタック、キュー）\n- ソートアルゴリズム（バブルソート、選択ソート）\n\n## 過去問演習結果\n- H30年春：8/10問正解\n- R1年秋：9/10問正解\n- R2年春：7/10問正解\n\n## 理解できた点\n- 基数変換の手順が身についた\n- スタックとキューの違いを理解\n- ソートアルゴリズムの動作原理\n\n## 苦手分野\n- 複雑な論理演算の組み合わせ\n- 計算量の評価",
    logDate: "2024-01-20T00:00:00Z",
    createdAt: "2024-01-20T20:00:00Z",
    updatedAt: "2024-01-20T20:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "基礎理論" },
      { id: 2, name: "アルゴリズム" },
      { id: 3, name: "過去問" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "参考書",
        resourceLink: "https://example.com/fe-textbook",
        description: "基本情報技術者試験対策テキスト",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "ネットワークとセキュリティ分野",
    learningTime: 150,
    note: "# ネットワークとセキュリティ分野\n\n## 学習内容\n- OSI参照モデル（7層）\n- TCP/IPプロトコル\n- IPアドレスとサブネットマスク\n- 暗号化技術（共通鍵、公開鍵）\n- ファイアウォールとIDS/IPS\n\n## 過去問演習結果\n- ネットワーク分野：6/8問正解\n- セキュリティ分野：7/8問正解\n\n## 理解できた点\n- OSI参照モデルの各層の役割\n- IPアドレスのクラス分け\n- 暗号化の基本概念\n\n## 今後の課題\n- サブネット計算の高速化\n- 最新のセキュリティ脅威の把握",
    logDate: "2024-02-10T00:00:00Z",
    createdAt: "2024-02-10T19:30:00Z",
    updatedAt: "2024-02-10T19:30:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 4, name: "ネットワーク" },
      { id: 5, name: "セキュリティ" },
      { id: 6, name: "TCP/IP" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "Webサイト",
        resourceLink: "https://example.com/network-study",
        description: "ネットワーク基礎学習サイト",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "午後問題：アルゴリズム実践",
    learningTime: 180,
    note: "# 午後問題：アルゴリズム実践\n\n## 解いた問題\n- 探索アルゴリズム（線形探索、二分探索）\n- 文字列処理（パターンマッチング）\n- グラフ理論（最短経路問題）\n\n## 解答時間\n- 問1（探索）：25分\n- 問2（文字列）：30分\n- 問3（グラフ）：35分\n\n## 成果\n- 二分探索の実装ができるようになった\n- 文字列処理の基本パターンを習得\n- ダイクストラ法の理解\n\n## 改善点\n- 解答時間の短縮（目標：各問20分）\n- エラーハンドリングの考慮\n- コードの可読性向上",
    logDate: "2024-03-01T00:00:00Z",
    createdAt: "2024-03-01T18:00:00Z",
    updatedAt: "2024-03-01T18:00:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 7, name: "午後問題" },
      { id: 8, name: "探索" },
      { id: 9, name: "グラフ理論" },
    ],
    resources: [],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "模擬試験と総合復習",
    learningTime: 240,
    note: "# 模擬試験と総合復習\n\n## 模擬試験結果\n- 午前問題：72点（合格ライン60点）\n- 午後問題：65点（合格ライン60点）\n\n## 時間配分\n- 午前：150分中140分で完了\n- 午後：150分中145分で完了\n\n## 正答率の高い分野\n- プログラミング：85%\n- データベース：80%\n- システム開発：75%\n\n## 要復習分野\n- ハードウェア：55%\n- ソフトウェア：60%\n- マネジメント：65%\n\n## 本試験に向けた対策\n- 苦手分野の重点復習\n- 時間配分の最適化\n- 見直し時間の確保",
    logDate: "2024-03-15T00:00:00Z",
    createdAt: "2024-03-15T20:30:00Z",
    updatedAt: "2024-03-15T20:30:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 10, name: "模擬試験" },
      { id: 11, name: "総合復習" },
      { id: 12, name: "時間配分" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "模擬試験",
        resourceLink: "https://example.com/mock-exam",
        description: "基本情報技術者試験模擬試験",
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

export default function DemoExamPage() {
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
    "https://learning-journal-app.com/demo/exam"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス（資格試験対策特化）
  const sampleAdvice = `基本情報技術者試験の学習、お疲れ様です！現在の進捗状況と学習記録を拝見して、合格に向けた具体的なアドバイスをお伝えします。

## 現在の学習状況について

**素晴らしい点：**
- 午前問題で安定して7割以上の得点を維持
- 午後問題のアルゴリズムとプログラミングの基礎を習得
- 模擬試験で合格ライン（60点）を上回る成績
- 体系的な学習計画に沿った着実な進歩

## 試験まで残り1ヶ月の対策

### 1. 午前問題の仕上げ
現在72点と安定していますが、さらなる向上のために：

- **苦手分野の集中対策**：ハードウェア（55%）とソフトウェア（60%）
- **最新技術動向**：クラウド、AI、IoT関連の出題増加に対応
- **計算問題の高速化**：サブネット計算、稼働率計算の反復練習
- **過去問5年分の完全制覇**：出題パターンの完全把握

### 2. 午後問題の戦略的対策
65点から確実な合格圏（70点以上）への押し上げ：

- **時間配分の最適化**：各問20分以内での解答を目標
- **得意分野の確実な得点**：プログラミング（85%）とデータベース（80%）
- **アルゴリズム問題の解法パターン化**：頻出アルゴリズムの暗記
- **疑似言語の読解力向上**：コードトレースの高速化

### 3. 直前期の学習戦略

**3週間前まで：**
- 苦手分野の重点復習
- 午後問題の解答時間短縮練習
- 新しい問題への挑戦

**2週間前から：**
- 過去問の総復習（間違えた問題の再確認）
- 模擬試験での実戦練習（週2回）
- 体調管理と生活リズムの調整

**1週間前から：**
- 暗記事項の最終確認
- 軽い復習のみ（新しいことは覚えない）
- 試験当日のシミュレーション

### 4. 試験当日の戦略

**午前試験：**
- 最初の30分で全問を一通り解答
- 残り時間で見直しと計算問題の再確認
- 迷った問題は最初の直感を信じる

**午後試験：**
- 問題選択は最初の10分で決定
- アルゴリズム問題は後回しにしない
- 部分点を意識した解答記述

## 学習効率を上げるコツ

1. **エラーノートの活用**：間違えた問題の分析と対策
2. **仲間との情報交換**：勉強会や掲示板での情報収集
3. **適度な休息**：集中力維持のための計画的な休憩
4. **本番環境の再現**：時間制限での模擬試験実施

現在の学習ペースと理解度であれば、確実に合格できると思います！最後まで諦めずに頑張ってください。`;

  // デモ用の操作ハンドラー（プログラミング学習と同様の実装）
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

    setTimeout(() => {
      let currentText = "";
      const words = sampleAdvice.split("");
      let index = 0;

      const typeWriter = () => {
        if (index < words.length) {
          currentText += words[index];
          setAdviceContent(currentText);
          index++;
          setTimeout(typeWriter, 20);
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

      setAchievementLevel(value);
      setUnit((prev) => ({
        ...prev,
        achievementLevel: value,
      }));

      setTimeout(() => {
        setIsUpdating(false);
        toast.success("達成度を更新しました");
      }, 500);
    };

    return (
      <div className="bg-card border rounded-lg p-4 mt-4">
        <div className="space-y-4">
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
            className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
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

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
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
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            📚 資格試験対策のデモページです。
            基本情報技術者試験の学習記録例をご確認いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-orange-200"
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
          <div className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🎯 資格試験対策を効率化しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような体系的な学習記録で、
                <br />
                あなたの資格取得を強力にサポートします。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📖</div>
                  <div className="font-semibold">学習計画</div>
                  <div className="opacity-80">試験日程に合わせた計画</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">進捗管理</div>
                  <div className="opacity-80">分野別の理解度追跡</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">弱点克服</div>
                  <div className="opacity-80">苦手分野の重点対策</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-full shadow-lg"
                >
                  <Link href="/auth/register">
                    無料で始める
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/20 backdrop-blur border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold px-8 py-3 rounded-full transition-all duration-300"
                >
                  <Link href="/">他のデモを見る</Link>
                </Button>
              </div>

              <p className="text-sm opacity-75 mt-4">
                ✅ 無料プランあり　✅ 試験日程管理　✅ 分野別分析
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
              資格試験対策アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの基本情報技術者試験学習記録に基づいて生成されています。
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
                className="bg-orange-600 hover:bg-orange-700 text-white"
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
