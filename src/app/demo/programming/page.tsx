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
  name: "山田 一郎",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（プログラミング学習）
const initialUnitData = {
  id: 1,
  title: "Python機械学習入門プロジェクト",
  learningGoal:
    "Pythonを使った機械学習の基礎を理解し、実際にデータ分析プロジェクトを完成させる",
  preLearningState:
    "Pythonの基本構文は理解しているが、機械学習のライブラリ（scikit-learn、pandas）は未経験",
  reflection:
    "データ前処理の重要性を実感しました。NumPyとPandasの使い方に慣れ、基本的な機械学習アルゴリズムの実装ができるようになりました。実際のデータセットを使った分析で実践的なスキルが身につきました。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 65,
  visibility: "public" as const,
  createdAt: "2024-02-01T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-02-01T00:00:00Z",
  endDate: null,
  nextAction:
    "深層学習（TensorFlow）の学習とニューラルネットワークモデルの実装",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "Python" },
    { id: 2, name: "機械学習" },
    { id: 3, name: "データサイエンス" },
    { id: 4, name: "scikit-learn" },
  ],
  unitTags: [
    { tag: { name: "Python" } },
    { tag: { name: "機械学習" } },
    { tag: { name: "データサイエンス" } },
    { tag: { name: "scikit-learn" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 18,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（プログラミング学習）
const initialComments = [
  {
    id: 1,
    comment:
      "機械学習の学習お疲れ様です！データ前処理の重要性を理解されているのは素晴らしいですね。実際のプロジェクトでもデータクリーニングが8割を占めるので、良い経験を積まれています。",
    createdAt: "2024-02-03T10:30:00Z",
    user: {
      id: "user-1",
      name: "佐藤 花子",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "scikit-learnの使い方を習得されたとのことですが、次はクロスバリデーションやハイパーパラメータチューニングも学習されることをお勧めします。モデルの性能向上に役立ちます！",
    createdAt: "2024-02-10T14:20:00Z",
    user: {
      id: "user-2",
      name: "田中 次郎",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "実際のデータセットを使った分析、とても実践的で良いアプローチですね！Kaggleのコンペティションにも挑戦してみると、さらにスキルアップできると思います。",
    createdAt: "2024-02-15T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（プログラミング学習）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "PandasとNumPyの基礎学習",
    learningTime: 180,
    note: "# PandasとNumPyの基礎学習\n\n## 今日の学習内容\n- Pandasのデータフレーム操作\n- NumPyの配列演算\n- CSVファイルの読み込みと基本的な統計処理\n\n## 実践した内容\n- タイタニックデータセットの読み込み\n- 欠損値の確認と処理\n- 基本的なデータ可視化（matplotlib使用）\n\n## 理解したこと\n- Pandasの強力なデータ操作機能\n- NumPyの効率的な数値計算\n- データ分析の基本的なワークフロー\n\n## 次回の予定\n- scikit-learnの基本的な使い方\n- 分類アルゴリズムの実装",
    logDate: "2024-02-01T00:00:00Z",
    createdAt: "2024-02-01T20:00:00Z",
    updatedAt: "2024-02-01T20:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "Pandas" },
      { id: 2, name: "NumPy" },
      { id: 3, name: "データ処理" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "公式ドキュメント",
        resourceLink: "https://pandas.pydata.org/docs/",
        description: "Pandas公式ドキュメント",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "scikit-learnで分類アルゴリズム実装",
    learningTime: 240,
    note: "# scikit-learnで分類アルゴリズム実装\n\n## 実装したアルゴリズム\n- ロジスティック回帰\n- ランダムフォレスト\n- サポートベクターマシン（SVM）\n\n## 学習内容\n- 訓練データとテストデータの分割\n- モデルの学習と予測\n- 精度評価（accuracy, precision, recall）\n\n## 苦労した点\n- パラメータチューニングの理解\n- 過学習と汎化性能のバランス\n\n## 成果\n- タイタニックデータセットで約82%の精度を達成\n- 各アルゴリズムの特徴を理解",
    logDate: "2024-02-05T00:00:00Z",
    createdAt: "2024-02-05T19:30:00Z",
    updatedAt: "2024-02-05T19:30:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 4, name: "scikit-learn" },
      { id: 5, name: "分類" },
      { id: 6, name: "機械学習" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "GitHub",
        resourceLink: "https://github.com/example/titanic-analysis",
        description: "タイタニック分析プロジェクト",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "データ可視化とEDA（探索的データ分析）",
    learningTime: 150,
    note: "# データ可視化とEDA（探索的データ分析）\n\n## 使用ライブラリ\n- matplotlib\n- seaborn\n- plotly（インタラクティブグラフ）\n\n## 作成したグラフ\n- ヒストグラム（年齢分布）\n- ボックスプロット（生存率と年齢の関係）\n- ヒートマップ（相関行列）\n- 散布図行列\n\n## 発見した洞察\n- 女性と子供の生存率が高い\n- チケットクラスと生存率に強い相関\n- 年齢と生存率の関係は複雑\n\n## 学んだスキル\n- 効果的なデータ可視化手法\n- 統計的な視点でのデータ解釈",
    logDate: "2024-02-12T00:00:00Z",
    createdAt: "2024-02-12T18:00:00Z",
    updatedAt: "2024-02-12T18:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 7, name: "データ可視化" },
      { id: 8, name: "EDA" },
      { id: 9, name: "matplotlib" },
      { id: 10, name: "seaborn" },
    ],
    resources: [],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "特徴量エンジニアリングとモデル改善",
    learningTime: 200,
    note: "# 特徴量エンジニアリングとモデル改善\n\n## 実施した特徴量エンジニアリング\n- 新しい特徴量の作成（家族サイズ、称号抽出など）\n- カテゴリ変数のエンコーディング\n- 数値変数の正規化・標準化\n- 欠損値の適切な補完\n\n## モデル改善手法\n- グリッドサーチによるハイパーパラメータ最適化\n- クロスバリデーションによる性能評価\n- アンサンブル手法の試行\n\n## 結果\n- 精度を82%から87%に向上\n- 特徴量の重要度分析により予測根拠を理解\n\n## 次のステップ\n- 深層学習（Neural Network）への挑戦\n- より複雑なデータセットでの実践",
    logDate: "2024-02-20T00:00:00Z",
    createdAt: "2024-02-20T20:30:00Z",
    updatedAt: "2024-02-20T20:30:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 11, name: "特徴量エンジニアリング" },
      { id: 12, name: "ハイパーパラメータ" },
      { id: 13, name: "アンサンブル" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "Kaggle",
        resourceLink: "https://www.kaggle.com/c/titanic",
        description: "Kaggle Titanicコンペティション",
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

export default function DemoProgrammingPage() {
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
    "https://learning-journal-app.com/demo/programming"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス（プログラミング学習特化）
  const sampleAdvice = `プログラミング学習、特に機械学習分野での素晴らしい進歩ですね！あなたの学習アプローチと実践的な取り組みを拝見して、いくつかの具体的なアドバイスをお伝えします。

## 現在の学習状況について

**素晴らしい点：**
- データ前処理から可視化、モデル構築まで一連のワークフローを習得
- 実際のデータセット（タイタニック）を使った実践的な学習
- 複数の機械学習アルゴリズムの理解と実装
- 特徴量エンジニアリングによるモデル改善への取り組み

## 次のステップの提案

### 1. 深層学習への発展
現在の基礎が固まっているので、以下を段階的に学習することをお勧めします：

- **TensorFlow/Keras** - 初心者向けの深層学習フレームワーク
- **PyTorch** - より柔軟性の高いフレームワーク（研究開発向け）
- **CNN（畳み込みニューラルネットワーク）** - 画像データの分析
- **RNN/LSTM** - 時系列データや自然言語処理

### 2. より高度なプロジェクトへの挑戦
- **画像分類プロジェクト** - CIFAR-10やImageNetを使った実践
- **自然言語処理** - 感情分析やテキスト分類
- **時系列予測** - 株価や気象データの予測

### 3. 実践的なスキル向上
- **MLOps** - モデルのデプロイと運用
- **Docker** - 環境の標準化
- **API開発** - FlaskやFastAPIでモデルをWeb API化
- **クラウドプラットフォーム** - AWS、GCP、Azureでの機械学習サービス

### 4. コミュニティ参加とポートフォリオ構築
- **Kaggleコンペティション** - 実力試しと学習継続
- **GitHub** - プロジェクトの公開とポートフォリオ構築
- **技術ブログ** - 学んだことのアウトプット

## 学習効率を上げるコツ

1. **プロジェクトベース学習** - 現在のアプローチを継続
2. **コードレビュー** - 他者のコードを読む習慣
3. **論文読解** - 最新の研究動向をキャッチアップ
4. **実装→理論→実装** - 手を動かしながら理論を深める

継続的な学習、本当に素晴らしいです！次の深層学習への挑戦も応援しています。`;

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
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🐍 プログラミング学習のデモページです。
            機械学習プロジェクトの学習記録例をご確認いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-green-200"
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
          <div className="bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🚀 プログラミング学習を記録しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような詳細な学習記録で、
                <br />
                あなたのコーディングスキルの成長を可視化しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-semibold">コード管理</div>
                  <div className="opacity-80">プロジェクトの進捗追跡</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-semibold">技術習得</div>
                  <div className="opacity-80">新しい技術の学習記録</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold">スキル向上</div>
                  <div className="opacity-80">成長の可視化と分析</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-full shadow-lg"
                >
                  <Link href="/auth/register">
                    無料で始める
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/20 backdrop-blur border-2 border-white text-white hover:bg-white hover:text-green-600 font-bold px-8 py-3 rounded-full transition-all duration-300"
                >
                  <Link href="/">他のデモを見る</Link>
                </Button>
              </div>

              <p className="text-sm opacity-75 mt-4">
                ✅ 無料プランあり　✅ GitHub連携　✅ 技術スタック対応
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
              プログラミング学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの機械学習学習記録に基づいて生成されています。
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
