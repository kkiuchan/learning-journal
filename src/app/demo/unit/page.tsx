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
  name: "田中 太郎",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ
const initialUnitData = {
  id: 1,
  title: "React.jsを使ったWebアプリケーション開発",
  learningGoal:
    "React.jsの基本概念を理解し、実際にToDoアプリケーションを作成できるようになる",
  preLearningState:
    "HTML、CSS、JavaScriptの基本は理解しているが、React.jsは未経験",
  reflection:
    "コンポーネント指向の開発手法を学べ、再利用可能なUIの作成方法を理解できた。Hooksの概念が最初は難しかったが、実践を通じて徐々に理解できるようになった。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 75,
  visibility: "public" as const,
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-01-15T00:00:00Z",
  endDate: null,
  nextAction: "Hooksの応用パターンの学習とToDoアプリの完成",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "React" },
    { id: 2, name: "JavaScript" },
    { id: 3, name: "フロントエンド" },
    { id: 4, name: "Webアプリ開発" },
  ],
  unitTags: [
    { tag: { name: "React" } },
    { tag: { name: "JavaScript" } },
    { tag: { name: "フロントエンド" } },
    { tag: { name: "Webアプリ開発" } },
  ],
  _count: {
    logs: 3,
    comments: 3,
    unitLikes: 12,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ
const initialComments = [
  {
    id: 1,
    comment:
      "React学習お疲れ様です！Hooksは最初確かに難しいですが、慣れるととても便利ですよね。ToDoアプリの実装、楽しみにしています！",
    createdAt: "2024-01-16T10:30:00Z",
    user: {
      id: "user-1",
      name: "佐藤 花子",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "useStateの理解でお困りのようですが、状態更新が非同期である点を押さえると理解が深まります。頑張ってください！",
    createdAt: "2024-01-19T14:20:00Z",
    user: {
      id: "user-2",
      name: "山田 次郎",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "素晴らしい学習記録ですね！実際にアプリケーションを作りながら学ぶのは効果的だと思います。完成したらぜひ見せてください。",
    createdAt: "2024-01-23T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "React基礎概念の学習",
    learningTime: 120,
    note: "# React基礎概念の学習\n\n## 学習内容\n- コンポーネントとは何か\n- JSXの基本文法\n- propsの概念\n\n## 理解したこと\n- Reactはコンポーネント指向のライブラリ\n- JSXはJavaScriptの拡張構文\n- propsを使って親から子へデータを渡せる\n\n## 次回学習予定\n- state管理について学習予定",
    logDate: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "React" },
      { id: 2, name: "基礎" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "公式ドキュメント",
        resourceLink: "https://react.dev/learn",
        description: "React公式ドキュメント",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "useState Hook の実装",
    learningTime: 90,
    note: "# useState Hook の実装\n\n## 学習内容\n- useStateの基本的な使い方\n- 関数コンポーネントでの状態管理\n- イベントハンドラーの実装\n\n## 実装したもの\n- カウンターアプリ\n- 入力フォームの値管理\n\n## 困った点\n- 状態更新のタイミングが理解できなかった\n- 非同期的な状態更新について混乱\n\n## 解決方法\n- 公式ドキュメントを読み直し\n- 実際にコンソールログで確認",
    logDate: "2024-01-18T00:00:00Z",
    createdAt: "2024-01-18T14:00:00Z",
    updatedAt: "2024-01-18T14:00:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 1, name: "React" },
      { id: 3, name: "Hooks" },
      { id: 4, name: "useState" },
    ],
    resources: [],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "ToDoアプリの実装開始",
    learningTime: 150,
    note: "# ToDoアプリの実装開始\n\n## 今日の成果\n- プロジェクトセットアップ\n- 基本的なコンポーネント構成設計\n- ToDoリストの表示機能実装\n\n## 使用した技術\n- Create React App\n- CSS Modules\n- Local Storage（予定）\n\n## 明日の予定\n- ToDoの追加機能\n- 削除機能の実装",
    logDate: "2024-01-22T00:00:00Z",
    createdAt: "2024-01-22T16:30:00Z",
    updatedAt: "2024-01-22T16:30:00Z",
    effectScore: 4,
    effectType: "application" as const,
    tags: [
      { id: 1, name: "React" },
      { id: 5, name: "実践" },
      { id: 6, name: "ToDoアプリ" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "GitHub",
        resourceLink: "https://github.com/example/todo-app",
        description: "実装したToDoアプリのリポジトリ",
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
  totalItems: 3,
};

export default function DemoUnitPage() {
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
    "https://learning-journal-app.com/demo/unit"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス
  const sampleAdvice = `素晴らしい学習進捗ですね！React.jsの基礎概念をしっかりと理解されており、特にコンポーネント指向の開発手法について深く学ばれていることが分かります。

## 現在の学習状況について

**良い点：**
- 実際のToDoアプリケーション開発を通じた実践的な学習アプローチ
- Hooksの概念を段階的に理解している姿勢
- 学習の振り返りを適切に行っている

## 今後の学習提案

### 1. Hooksの深堀り
現在useStateを学習中とのことですが、次のステップとして以下をお勧めします：

- **useEffect** - 副作用の処理とライフサイクル管理
- **useContext** - 状態の共有方法
- **useReducer** - 複雑な状態管理

### 2. 実践プロジェクトの拡張
ToDoアプリを以下の機能で拡張してみてください：

- データの永続化（localStorage → データベース）
- カテゴリ分け機能
- 検索・フィルター機能
- ドラッグ&ドロップでの並び替え

### 3. 状態管理ライブラリの学習
Reactの標準的な状態管理に慣れたら、以下を検討してみてください：

- **Redux Toolkit** - 複雑なアプリケーション状態管理
- **Zustand** - シンプルな状態管理ライブラリ

## 学習効率を上げるコツ

1. **小さく始めて段階的に拡張** - 現在のアプローチは正しいです
2. **公式ドキュメントを活用** - React公式ドキュメントは非常に充実しています
3. **エラーから学ぶ** - 状態更新のタイミングなど、実際に体験することが重要

頑張って学習を続けてください！質問があればいつでもお聞かせください。`;

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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            📍
            これはデモページです。実際の機能と同様に操作できますが、データは保存されません。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-blue-200"
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
          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🚀 学習管理を始めませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験した機能をすべて無料で利用できます。
                <br />
                あなたの学習を記録し、成長を可視化しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold">学習ログ記録</div>
                  <div className="opacity-80">進捗を詳細に管理</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold">AIアドバイス</div>
                  <div className="opacity-80">個別化された学習支援</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">成長の可視化</div>
                  <div className="opacity-80">達成度とトレンド分析</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-full shadow-lg"
                >
                  <Link href="/auth/register">
                    無料で始める
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/20 backdrop-blur border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold px-8 py-3 rounded-full transition-all duration-300"
                >
                  <Link href="/pricing">プランを見る</Link>
                </Button>
              </div>

              <p className="text-sm opacity-75 mt-4">
                ✅ 無料プランあり　✅ クレジットカード不要　✅ 即座に開始
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
              学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの学習状況に基づいて生成されています。
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
