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
  name: "山田 美咲",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（UIデザイン学習）
const initialUnitData = {
  id: 1,
  title: "モバイルアプリUI/UXデザインマスター",
  learningGoal:
    "Figmaを使ったモバイルアプリのUI/UXデザインスキルを習得し、ユーザー中心設計の思考プロセスを身につける。実際のアプリデザインプロジェクトを完成させる",
  preLearningState:
    "Photoshopの基本操作は理解しているが、UI/UXデザインツール（Figma、Adobe XD）やデザインシステムの作成は未経験。ユーザビリティやデザインプロセスの理解が浅い",
  reflection:
    "Figmaの操作に慣れ、コンポーネントシステムの重要性を実感しました。ユーザーペルソナの設定から始まるデザインプロセスを体験し、デザインに一貫性を持たせる方法を学びました。プロトタイピングによるユーザビリティテストで、実際の改善点を発見できました。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 70,
  visibility: "public" as const,
  createdAt: "2024-02-10T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-02-10T00:00:00Z",
  endDate: null,
  nextAction:
    "アニメーションとマイクロインタラクションの学習、実際のクライアントプロジェクトへの応用",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "UI/UXデザイン" },
    { id: 2, name: "Figma" },
    { id: 3, name: "モバイルデザイン" },
    { id: 4, name: "デザインシステム" },
  ],
  unitTags: [
    { tag: { name: "UI/UXデザイン" } },
    { tag: { name: "Figma" } },
    { tag: { name: "モバイルデザイン" } },
    { tag: { name: "デザインシステム" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 24,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（UIデザイン学習）
const initialComments = [
  {
    id: 1,
    comment:
      "UI/UXデザインの学習、素晴らしい進歩ですね！デザインシステムの構築から始めるアプローチは実践的で良いと思います。Figmaのコンポーネント機能をマスターすると効率が大幅に向上しますよ。",
    createdAt: "2024-02-12T10:30:00Z",
    user: {
      id: "user-1",
      name: "佐藤 花子",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "プロトタイピングとユーザビリティテストの実践、とても重要なスキルです！実際のユーザーフィードバックを反映したデザイン改善プロセスは、現場でも非常に役立ちます。次はA/Bテストも試してみてください。",
    createdAt: "2024-02-18T14:20:00Z",
    user: {
      id: "user-2",
      name: "田中 太郎",
      image: null,
    },
  },
  {
    id: 3,
    comment:
      "ユーザー中心設計の思考プロセスが身についている様子、とても良い学習の進め方です！デザインシステムの一貫性とプロトタイピングによる検証を組み合わせたアプローチで、実務レベルのスキルが着実に向上していますね。",
    createdAt: "2024-02-25T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（UIデザイン学習）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "Figmaの基本操作とデザインシステム構築",
    learningTime: 210,
    note: "# Figmaの基本操作とデザインシステム構築\n\n## 今日の学習内容\n- Figmaのインターフェースと基本操作\n- コンポーネントとバリアントの作成\n- カラーパレットとタイポグラフィの設定\n- デザイントークンの概念理解\n\n## 実践した内容\n- ボタンコンポーネントの作成（Primary、Secondary、Ghost）\n- カードコンポーネントのデザイン\n- 8pt Grid Systemの適用\n- ブランドカラーとセマンティックカラーの定義\n\n## 理解したこと\n- デザインシステムの重要性と効率性\n- コンポーネント設計の考え方\n- 一貫性のあるデザインを作る方法\n\n## 次回の予定\n- ワイヤーフレーム作成\n- ユーザーペルソナの設定",
    logDate: "2024-02-10T00:00:00Z",
    createdAt: "2024-02-10T20:00:00Z",
    updatedAt: "2024-02-10T20:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "Figma" },
      { id: 2, name: "デザインシステム" },
      { id: 3, name: "コンポーネント" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "公式ドキュメント",
        resourceLink: "https://help.figma.com/",
        description: "Figma公式ヘルプ",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "ユーザーリサーチとペルソナ作成",
    learningTime: 180,
    note: "# ユーザーリサーチとペルソナ作成\n\n## 実施した調査\n- ユーザーインタビュー（5名）\n- アンケート調査（50名回答）\n- 競合アプリの分析\n- ユーザージャーニーマップの作成\n\n## 作成したペルソナ\n- プライマリペルソナ：田中花子（28歳、会社員）\n- セカンダリペルソナ：山田太郎（35歳、フリーランス）\n\n## ペルソナの詳細\n- 利用シーン、課題、ゴール\n- 技術リテラシーとデバイス使用状況\n- アプリに対する期待値と不安要素\n\n## 学んだこと\n- ユーザー中心設計の重要性\n- 仮説と実際のユーザーニーズのギャップ\n- データに基づいたデザイン判断の価値",
    logDate: "2024-02-15T00:00:00Z",
    createdAt: "2024-02-15T19:30:00Z",
    updatedAt: "2024-02-15T19:30:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 4, name: "ユーザーリサーチ" },
      { id: 5, name: "ペルソナ" },
      { id: 6, name: "UXデザイン" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "参考書籍",
        resourceLink: "https://example.com/ux-research-book",
        description: "UXリサーチの教科書",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "ワイヤーフレームとUIデザイン作成",
    learningTime: 240,
    note: "# ワイヤーフレームとUIデザイン作成\n\n## 作成したスクリーン\n- オンボーディング（3画面）\n- ホーム画面\n- 商品一覧・詳細画面\n- 購入フロー（4画面）\n- マイページ\n\n## デザインプロセス\n1. 情報アーキテクチャの整理\n2. ローファイワイヤーフレーム作成\n3. ハイファイワイヤーフレーム作成\n4. UIデザインの詳細化\n5. インタラクションの設計\n\n## 適用したデザイン原則\n- Material Design Guidelines\n- iOS Human Interface Guidelines\n- 8pt Grid System\n- アクセシビリティ（WCAG 2.1）\n\n## 工夫した点\n- タップターゲットのサイズ最適化\n- カラーコントラストの確保\n- 直感的なナビゲーション設計",
    logDate: "2024-02-22T00:00:00Z",
    createdAt: "2024-02-22T18:00:00Z",
    updatedAt: "2024-02-22T18:00:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 7, name: "ワイヤーフレーム" },
      { id: 8, name: "UIデザイン" },
      { id: 9, name: "アクセシビリティ" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "ガイドライン",
        resourceLink: "https://material.io/design",
        description: "Material Design",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "プロトタイピングとユーザビリティテスト",
    learningTime: 200,
    note: "# プロトタイピングとユーザビリティテスト\n\n## プロトタイプ作成\n- Figmaでインタラクティブプロトタイプ作成\n- 主要なユーザーフローの実装\n- マイクロインタラクションの追加\n- スマートアニメーションの活用\n\n## ユーザビリティテスト\n- 5名のユーザーでテスト実施\n- タスク完了率、エラー率、満足度を測定\n- Think Aloud法で思考プロセスを観察\n- 定量・定性両面での分析\n\n## 発見した課題\n- ナビゲーションの迷いやすさ\n- CTAボタンの視認性不足\n- フォーム入力の煩雑さ\n\n## 改善実施\n- ナビゲーション構造の見直し\n- ボタンのサイズとカラー調整\n- フォームの段階分割と自動入力機能追加\n\n## 学習効果\n- ユーザー視点の重要性を実感\n- データに基づく改善の価値\n- 継続的な検証の必要性",
    logDate: "2024-03-01T00:00:00Z",
    createdAt: "2024-03-01T20:30:00Z",
    updatedAt: "2024-03-01T20:30:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 10, name: "プロトタイピング" },
      { id: 11, name: "ユーザビリティテスト" },
      { id: 12, name: "改善" },
    ],
    resources: [
      {
        id: 4,
        resourceType: "ツール",
        resourceLink: "https://www.figma.com/prototyping/",
        description: "Figmaプロトタイピング機能",
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

export default function DemoDesignPage() {
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
    "https://learning-journal-app.com/demo/design"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス（UIデザイン学習特化）
  const sampleAdvice = `UI/UXデザインの学習、素晴らしい進歩ですね！実践的なアプローチでスキルを積み上げているのが印象的です。あなたの学習状況を踏まえて、さらなる成長のためのアドバイスをお伝えします。

## 現在の学習状況について

**素晴らしい点：**
- デザインシステム構築から始める体系的なアプローチ
- ユーザーリサーチに基づいたペルソナ作成
- ワイヤーフレームからプロトタイプまでの一連のプロセス経験
- ユーザビリティテストによる検証と改善の実践

## さらなるスキル向上のための提案

### 1. デザインスキルの深化
- **アドバンスドFigma** - Auto Layout、コンポーネントプロパティの活用
- **デザイントークン** - デザインシステムの運用効率化
- **アニメーション設計** - マイクロインタラクションとトランジション
- **レスポンシブデザイン** - マルチデバイス対応の設計思考

### 2. UXリサーチの強化
- **定量調査手法** - A/Bテスト、ヒートマップ分析
- **定性調査の深化** - エスノグラフィー、カードソーティング
- **データ分析スキル** - Google Analytics、ユーザー行動分析
- **アクセシビリティ** - インクルーシブデザインの実践

### 3. デザインワークフローの最適化
- **Figma to Code** - 開発者との連携効率化
- **バージョン管理** - Git for Designers、デザインファイル管理
- **ドキュメンテーション** - デザインスペック、使用ガイドライン
- **デザインレビュー** - 効果的なフィードバック方法

### 4. 実務スキルの拡張
- **デザインシステム運用** - 組織規模でのルール策定
- **ステークホルダー管理** - ビジネス要件とデザインの調整
- **プロジェクト管理** - アジャイル開発での役割理解
- **プレゼンテーション** - デザイン提案の効果的な伝達

### 5. 最新トレンドとツール
- **AIツール活用** - Midjourney、DALL-E等での素材作成
- **ノーコードツール** - Framer、Webflowでの実装
- **新しいデザイン手法** - Atomic Design、Design Thinking 2.0
- **VR/ARデザイン** - 次世代インターフェースへの対応

## 実践的な学習提案

### ポートフォリオ強化
1. **ケーススタディの充実** - プロセスと思考の可視化
2. **多様なプロジェクト** - B2B、B2C、モバイル、Webの経験
3. **実際の制約下でのデザイン** - 技術的制約、予算制約の考慮
4. **測定可能な成果** - KPI改善、ユーザー満足度向上の数値

### コミュニティ参加
- **Dribbble、Behance** - 作品公開とフィードバック獲得
- **デザインコミュニティ** - 勉強会、ワークショップ参加
- **メンターシップ** - 経験豊富なデザイナーからの指導
- **デザインコンペ** - 実力試しとネットワーキング

## 継続学習のコツ

1. **小さなプロジェクトの積み重ね** - 毎日のスキル練習
2. **他分野からの学び** - 心理学、認知科学、マーケティング
3. **失敗からの学習** - 改善点の明確化と次回への活用
4. **ユーザーとの直接対話** - 常にユーザー視点を保つ

あなたの学習姿勢と実践力は素晴らしいです。次のステップに向けて、継続的な成長を応援しています！`;

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
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🎨 UI/UXデザイン学習のデモページです。
            モバイルアプリデザインプロジェクトの学習記録例をご確認いただけます。
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
          <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-red-600 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                🎨 デザインスキルを体系的に記録しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような詳細な学習記録で、
                <br />
                あなたのデザインスキルの成長を可視化しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-semibold">デザイン管理</div>
                  <div className="opacity-80">プロジェクトの進捗追跡</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-semibold">スキル習得</div>
                  <div className="opacity-80">新しいツールの学習記録</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold">成長実感</div>
                  <div className="opacity-80">スキル向上の可視化と分析</div>
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
                ✅ 無料プランあり　✅ Figma連携　✅ ポートフォリオ支援
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
              デザイン学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたのデザイン学習記録に基づいて生成されています。
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
