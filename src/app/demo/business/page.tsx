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
  name: "田中 美咲",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（ビジネススキル学習）
const initialUnitData = {
  id: 1,
  title: "プロジェクトマネジメント実践スキル習得",
  learningGoal:
    "アジャイル開発とウォーターフォール両方の手法を理解し、実際のプロジェクトで効果的なマネジメントができるようになる",
  preLearningState:
    "チームリーダーとしての経験はあるが、体系的なプロジェクトマネジメント手法は未学習。PMPやスクラムの知識が不足している",
  reflection:
    "プロジェクトマネジメントの基本原則を理解し、アジャイルとウォーターフォールの使い分けができるようになりました。実際のプロジェクトでスクラムを導入し、チームの生産性が20%向上しました。ステークホルダーとのコミュニケーション手法も大幅に改善されました。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 75,
  visibility: "public" as const,
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-01-15T00:00:00Z",
  endDate: null,
  nextAction: "PMP資格取得に向けた学習とリスクマネジメント手法の深掘り",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "プロジェクトマネジメント" },
    { id: 2, name: "アジャイル" },
    { id: 3, name: "スクラム" },
    { id: 4, name: "リーダーシップ" },
  ],
  unitTags: [
    { tag: { name: "プロジェクトマネジメント" } },
    { tag: { name: "アジャイル" } },
    { tag: { name: "スクラム" } },
    { tag: { name: "リーダーシップ" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 22,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（ビジネススキル学習）
const initialComments = [
  {
    id: 1,
    comment:
      "プロジェクトマネジメントの学習お疲れ様です！アジャイルとウォーターフォールの使い分けを理解されているのは素晴らしいですね。実際のプロジェクトでの適用経験が何より重要です。",
    createdAt: "2024-01-18T10:30:00Z",
    user: {
      id: "user-1",
      name: "山田 太郎",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "スクラム導入で生産性が20%向上とは素晴らしい成果ですね！次はカンバンボードの活用やベロシティ測定なども取り入れると、さらに効果的なチーム運営ができると思います。",
    createdAt: "2024-02-05T14:20:00Z",
    user: {
      id: "user-2",
      name: "佐藤 花子",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "ステークホルダーとのコミュニケーション改善、とても重要なスキルですね！PMP取得に向けて、PMBOKガイドの知識エリアを体系的に学習されることをお勧めします。特にリスクマネジメントは実務で大いに役立ちます。",
    createdAt: "2024-02-20T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（ビジネススキル学習）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "プロジェクトマネジメント基礎理論",
    learningTime: 120,
    note: "# プロジェクトマネジメント基礎理論\n\n## 学習内容\n- PMBOKガイドの概要\n- プロジェクトライフサイクル\n- ウォーターフォール vs アジャイル\n- プロジェクト憲章の作成方法\n\n## 理解したポイント\n- プロジェクトの定義と特徴\n- プロジェクトマネジャーの役割と責任\n- ステークホルダーマネジメントの重要性\n\n## 実践課題\n- 架空プロジェクトの憲章作成\n- ステークホルダー分析マトリックス作成\n\n## 次回の学習予定\n- スコープマネジメント\n- WBS（Work Breakdown Structure）の作成",
    logDate: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-15T20:00:00Z",
    updatedAt: "2024-01-15T20:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "PMBOK" },
      { id: 2, name: "基礎理論" },
      { id: 3, name: "プロジェクト憲章" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "書籍",
        resourceLink: "https://www.pmi.org/pmbok-guide-standards",
        description: "PMBOKガイド第7版",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "アジャイル開発とスクラム実践",
    learningTime: 180,
    note: "# アジャイル開発とスクラム実践\n\n## 学習したフレームワーク\n- スクラムの基本概念\n- スプリント計画とレビュー\n- デイリースタンドアップ\n- レトロスペクティブ\n\n## 実践した内容\n- 2週間スプリントの計画立案\n- ユーザーストーリーの作成\n- バーンダウンチャートの活用\n- チームベロシティの測定\n\n## 成果と学び\n- チームの透明性が向上\n- 問題の早期発見・解決\n- 継続的改善の文化醸成\n\n## 課題と改善点\n- 見積もり精度の向上が必要\n- ステークホルダーへの説明方法の改善",
    logDate: "2024-01-25T00:00:00Z",
    createdAt: "2024-01-25T19:30:00Z",
    updatedAt: "2024-01-25T19:30:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 4, name: "アジャイル" },
      { id: 5, name: "スクラム" },
      { id: 6, name: "スプリント" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "オンライン講座",
        resourceLink: "https://www.scrum.org/",
        description: "Scrum.org公式ガイド",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "ステークホルダーマネジメント実践",
    learningTime: 150,
    note: "# ステークホルダーマネジメント実践\n\n## 学習内容\n- ステークホルダー分析手法\n- コミュニケーション計画の策定\n- 影響力/関心度マトリックス\n- 効果的な報告書作成\n\n## 実践したツール\n- ステークホルダーレジスター\n- コミュニケーションマトリックス\n- プロジェクトダッシュボード\n- 定期報告書テンプレート\n\n## 改善された点\n- ステークホルダーとの関係性向上\n- プロジェクト情報の透明性確保\n- 意思決定スピードの向上\n\n## 学んだコミュニケーション技法\n- アクティブリスニング\n- 効果的なプレゼンテーション\n- 対立解決手法",
    logDate: "2024-02-10T00:00:00Z",
    createdAt: "2024-02-10T18:00:00Z",
    updatedAt: "2024-02-10T18:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 7, name: "ステークホルダー" },
      { id: 8, name: "コミュニケーション" },
      { id: 9, name: "プレゼンテーション" },
    ],
    resources: [],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "リスクマネジメントと品質管理",
    learningTime: 200,
    note: "# リスクマネジメントと品質管理\n\n## リスクマネジメント手法\n- リスク識別ワークショップ\n- 定性的・定量的リスク分析\n- リスク対応戦略（回避、軽減、転嫁、受容）\n- リスクレジスターの管理\n\n## 品質管理手法\n- 品質計画の策定\n- 品質保証プロセス\n- 品質管理ツール（パレート図、特性要因図）\n- 継続的改善（PDCA）\n\n## 実践した内容\n- プロジェクトリスクアセスメント\n- 品質メトリクスの設定\n- 品質監査の実施\n\n## 成果\n- プロジェクトリスクの早期発見・対応\n- 品質基準の明確化と達成\n- チーム全体の品質意識向上",
    logDate: "2024-03-01T00:00:00Z",
    createdAt: "2024-03-01T20:30:00Z",
    updatedAt: "2024-03-01T20:30:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 10, name: "リスクマネジメント" },
      { id: 11, name: "品質管理" },
      { id: 12, name: "PDCA" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "テンプレート",
        resourceLink: "https://example.com/risk-register-template",
        description: "リスクレジスターテンプレート",
        fileName: null,
        filePath: null,
      },
    ],
  },
];

export default function DemoBusinessPage() {
  const [unit, setUnit] = useState(initialUnitData);
  const [logs, setLogs] = useState(initialLogs);
  const [comments, setComments] = useState(initialComments);
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAdviceComment, setShowAdviceComment] = useState(false);
  const [adviceComment, setAdviceComment] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToComments = useCallback(() => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URLをコピーしました");
    } catch (error) {
      toast.error("URLのコピーに失敗しました");
    }
  };

  const handleDelete = async () => {
    toast.success("ユニットを削除しました（デモ）");
  };

  const handleAdviceClick = async () => {
    setIsAdviceDialogOpen(true);
    setIsAdviceLoading(true);
    setAdviceContent("");
    setShowAdviceComment(false);

    const fullAdvice = `プロジェクトマネジメントスキルの向上、素晴らしい進捗ですね！

現在の学習状況を拝見すると、基礎理論からアジャイル実践、ステークホルダーマネジメントまで幅広くカバーされており、実践的なスキルが身についていることがわかります。

**次のステップとして以下をお勧めします：**

1. **PMP資格取得の準備**
   - PMBOKガイドの知識エリア10分野の深掘り
   - 模擬試験での実践練習
   - プロセスグループの理解強化

2. **高度なアジャイル手法**
   - SAFe（Scaled Agile Framework）の学習
   - DevOpsとの連携手法
   - アジャイルメトリクスの活用

3. **リーダーシップスキル強化**
   - 変革管理（Change Management）
   - チームビルディング手法
   - 交渉術とコンフリクト解決

実際のプロジェクトでの成果（生産性20%向上）は素晴らしい実績です。この経験を活かして、より大規模で複雑なプロジェクトにも挑戦してみてください！`;

    // タイピングアニメーション
    setTimeout(() => {
      setIsAdviceLoading(false);
      setAdviceContent(fullAdvice);
      setShowAdviceComment(true);
    }, 2000);
  };

  const handleAddAdviceComment = async () => {
    if (!adviceContent.trim()) return;

    setIsAddingAdviceComment(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await handleAddAIComment(adviceContent);
    setIsAdviceDialogOpen(false);
    setIsAddingAdviceComment(false);
    toast.success("AIアドバイスをコメントに追加しました");
  };

  const handleAddAIComment = async (comment: string) => {
    const newComment = {
      id: comments.length + 1,
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
  };

  const handleCreateComment = async (comment: string) => {
    if (!comment.trim()) return;

    const newComment = {
      id: comments.length + 1,
      comment: comment,
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

    toast.success("コメントを投稿しました");
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, comment: content } : comment
      )
    );
    toast.success("コメントを更新しました");
  };

  const handleDeleteComment = async (commentId: number) => {
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
  };

  const handleLike = async () => {
    const newIsLiked = !unit.isLiked;
    const newLikeCount = newIsLiked
      ? unit._count.unitLikes + 1
      : unit._count.unitLikes - 1;

    setUnit((prev) => ({
      ...prev,
      isLiked: newIsLiked,
      _count: {
        ...prev._count,
        unitLikes: newLikeCount,
      },
    }));

    toast.success(newIsLiked ? "いいねしました" : "いいねを取り消しました");
  };

  const mutateUnit = async (data?: any, shouldRevalidate?: boolean) => {
    // デモ用のmutate関数
  };

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
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {log.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs"
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
                        className="text-purple-600 hover:underline"
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
    <div className="mt-8" id="comments-section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          コメント ({comments.length})
        </h2>
        <Button
          onClick={() => {
            const comment = prompt("コメントを入力してください:");
            if (comment) handleCreateComment(comment);
          }}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          コメント追加
        </Button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                {comment.user.image ? (
                  <img
                    src={comment.user.image}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-purple-600">
                    {comment.user.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  {comment.user.id === sampleUser.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newContent = prompt(
                            "コメントを編集:",
                            comment.comment
                          );
                          if (newContent)
                            handleUpdateComment(comment.id, newContent);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("コメントを削除しますか？"))
                            handleDeleteComment(comment.id);
                        }}
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
            📊 ビジネススキル学習のデモページです。
            プロジェクトマネジメント実践スキル習得の学習記録例をご確認いただけます。
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
          <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-orange-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🚀 ビジネススキル学習を記録しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような詳細な学習記録で、
                <br />
                あなたのキャリアアップに必要なスキルの成長を可視化しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">体系的学習</div>
                  <div className="opacity-80">
                    PMBOKやアジャイルなど業界標準手法
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">実践重視</div>
                  <div className="opacity-80">
                    実際のプロジェクトで使えるスキル
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-semibold">キャリアアップ</div>
                  <div className="opacity-80">資格取得とリーダーシップ向上</div>
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
                ✅ 無料プランあり　✅ 試験日程管理　✅ 分野別分析対応
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
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
              ビジネススキル学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたのプロジェクトマネジメント学習記録に基づいて生成されています。
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
