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
  name: "田中 恵美",
  email: "demo@example.com",
  image: "/images/ai-assistant.png",
};

// サンプルセッションデータ
const sampleSession = {
  user: sampleUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// 初期ユニットデータ（小学校国語教材研究）
const initialUnitData = {
  id: 1,
  title: "小学校3年生国語「物語文読解」教材研究",
  learningGoal:
    "児童の物語文読解力向上を目指した教材開発と指導法の確立。登場人物の心情理解を深める授業設計の実践",
  preLearningState:
    "従来の教科書中心の授業では、児童の物語への興味関心が低く、登場人物の心情理解に課題があった。読み取りの根拠を示すことが苦手な児童が多い。",
  reflection:
    "絵本の読み聞かせから導入し、視覚的な教材を活用することで児童の興味が大幅に向上しました。心情を表す言葉カードや音読劇の導入により、登場人物への共感が深まり、読解力も着実に向上しています。",
  status: "IN_PROGRESS" as const,
  achievementLevel: 75,
  visibility: "public" as const,
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-03-20T15:30:00Z",
  startDate: "2024-01-15T00:00:00Z",
  endDate: null,
  nextAction: "他学年への展開準備と、デジタル教材の活用による個別最適化の検討",
  displayFlag: true,
  userId: "demo-user",
  user: sampleUser,
  tags: [
    { id: 1, name: "小学校国語" },
    { id: 2, name: "物語文" },
    { id: 3, name: "読解指導" },
    { id: 4, name: "教材開発" },
  ],
  unitTags: [
    { tag: { name: "小学校国語" } },
    { tag: { name: "物語文" } },
    { tag: { name: "読解指導" } },
    { tag: { name: "教材開発" } },
  ],
  _count: {
    logs: 4,
    comments: 3,
    unitLikes: 22,
  },
  isLiked: false,
  commentsCount: 3,
};

// 初期コメントデータ（教材研究）
const initialComments = [
  {
    id: 1,
    comment:
      "視覚的な教材を活用した読解指導、とても興味深いです！心情を表す言葉カードのアイデアは他の学年でも応用できそうですね。実際の児童の反応はいかがでしたか？",
    createdAt: "2024-01-18T10:30:00Z",
    user: {
      id: "user-1",
      name: "佐藤 花子",
      image: null,
    },
  },
  {
    id: 2,
    comment:
      "音読劇の導入、素晴らしいアプローチですね！表現活動を通して登場人物に共感を深めるのは効果的だと思います。準備や指導のポイントがあれば教えていただきたいです。",
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
      "継続的な教材研究の記録、とても参考になります。特に児童の変化を丁寧に観察されている点が素晴らしいです。他学年への展開も楽しみにしています！",
    createdAt: "2024-02-20T09:15:00Z",
    user: {
      id: "ai-assistant",
      name: "AIアシスタント",
      image: "/images/ai-assistant.png",
    },
  },
];

// 初期ログデータ（教材研究）
const initialLogs = [
  {
    id: 1,
    unitId: 1,
    userId: "demo-user",
    title: "導入教材の選定と準備",
    learningTime: 120,
    note: "# 導入教材の選定と準備\n\n## 実施内容\n- 物語文教材の精選と分析\n- 読み聞かせ用絵本の選定\n- 心情を表す言葉カードの作成\n\n## 教材選定の観点\n- 児童の発達段階に適した内容\n- 登場人物の心情変化が明確\n- 挿絵の効果的活用が可能\n\n## 準備した教材\n- メイン教材：「ちいちゃんのかげおくり」\n- 導入絵本：「わすれられないおくりもの」\n- 心情語彙カード：50枚セット\n\n## 次回の予定\n- 授業設計の詳細検討\n- 評価方法の設定",
    logDate: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-15T20:00:00Z",
    updatedAt: "2024-01-15T20:00:00Z",
    effectScore: 4,
    effectType: "understanding" as const,
    tags: [
      { id: 1, name: "教材選定" },
      { id: 2, name: "教材作成" },
      { id: 3, name: "授業準備" },
    ],
    resources: [
      {
        id: 1,
        resourceType: "参考図書",
        resourceLink: "https://example.com/teaching-materials",
        description: "小学校国語指導事例集",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 2,
    unitId: 1,
    userId: "demo-user",
    title: "第1回授業実践と振り返り",
    learningTime: 180,
    note: "# 第1回授業実践と振り返り\n\n## 授業の流れ\n1. 絵本読み聞かせによる導入（15分）\n2. 教材文の音読（10分）\n3. 場面分けと登場人物確認（15分）\n4. 心情語彙カードを使った活動（20分）\n\n## 児童の反応\n- 絵本への興味関心は非常に高い\n- 心情語彙カードに積極的に取り組む\n- 自分の言葉で表現する意欲が向上\n\n## 課題と改善点\n- 時間配分の調整が必要\n- 個人差への対応を強化\n- 発表機会の増加\n\n## 次回への改善\n- グループ活動の導入\n- 個別支援の充実",
    logDate: "2024-01-22T00:00:00Z",
    createdAt: "2024-01-22T19:30:00Z",
    updatedAt: "2024-01-22T19:30:00Z",
    effectScore: 5,
    effectType: "practical" as const,
    tags: [
      { id: 4, name: "授業実践" },
      { id: 5, name: "振り返り" },
      { id: 6, name: "改善" },
    ],
    resources: [
      {
        id: 2,
        resourceType: "授業記録",
        resourceLink: "https://example.com/lesson-record",
        description: "第1回授業記録シート",
        fileName: null,
        filePath: null,
      },
    ],
  },
  {
    id: 3,
    unitId: 1,
    userId: "demo-user",
    title: "音読劇活動の導入と効果検証",
    learningTime: 150,
    note: "# 音読劇活動の導入と効果検証\n\n## 実施した活動\n- 登場人物の役割分担\n- 心情に応じた声の調子や表情の工夫\n- グループでの練習と発表\n\n## 活動の工夫\n- 心情カードを参考にした表現指導\n- ペア・グループでの相互評価\n- 録画による自己評価の機会\n\n## 観察された変化\n- 登場人物への共感が深まった\n- 心情を表す語彙の使用が増加\n- 積極的な発言が増えた\n- 友達の意見を聞く姿勢が向上\n\n## 学習効果\n- 読解力の向上が見られる\n- 表現力の向上も顕著\n- 学習への意欲が高まっている",
    logDate: "2024-02-10T00:00:00Z",
    createdAt: "2024-02-10T18:00:00Z",
    updatedAt: "2024-02-10T18:00:00Z",
    effectScore: 5,
    effectType: "application" as const,
    tags: [
      { id: 7, name: "音読劇" },
      { id: 8, name: "表現活動" },
      { id: 9, name: "効果検証" },
    ],
    resources: [],
  },
  {
    id: 4,
    unitId: 1,
    userId: "demo-user",
    title: "評価方法の改善と個別指導の充実",
    learningTime: 200,
    note: "# 評価方法の改善と個別指導の充実\n\n## 評価方法の見直し\n- ルーブリックの作成と活用\n- ポートフォリオ評価の導入\n- 自己評価・相互評価の充実\n\n## 個別指導の取り組み\n- 理解度に応じた個別課題の設定\n- 支援が必要な児童への配慮\n- 発展課題による才能の伸長\n\n## 成果と課題\n- 児童の自己評価能力が向上\n- 学習への主体性が高まった\n- 個人差に応じた指導の効果を実感\n\n## 今後の展開\n- 他学年への指導法の共有\n- デジタル教材の活用検討\n- 保護者との連携強化",
    logDate: "2024-03-05T00:00:00Z",
    createdAt: "2024-03-05T20:30:00Z",
    updatedAt: "2024-03-05T20:30:00Z",
    effectScore: 4,
    effectType: "application" as const,
    tags: [
      { id: 10, name: "評価改善" },
      { id: 11, name: "個別指導" },
      { id: 12, name: "指導法共有" },
    ],
    resources: [
      {
        id: 3,
        resourceType: "評価資料",
        resourceLink: "https://example.com/evaluation-rubric",
        description: "物語文読解ルーブリック",
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

export default function DemoEducationPage() {
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
    "https://learning-journal-app.com/demo/education"
  );

  // AIアドバイス関連の状態
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAddingAdviceComment, setIsAddingAdviceComment] = useState(false);

  // 固定のサンプルアドバイス（教材研究特化）
  const sampleAdvice = `教材研究の継続的な取り組み、素晴らしい実践ですね！小学校国語の物語文指導について、具体的なアドバイスをお伝えします。

## 現在の取り組みについて

**優れている点：**
- 視覚的教材（絵本、心情カード）の効果的活用
- 段階的な指導設計（読み聞かせ→音読→表現活動）
- 児童の反応を丁寧に観察し、改善に活かしている
- 音読劇による体験的な学習の導入

## さらなる発展のための提案

### 1. ICT活用の可能性
- **デジタル絵本の活用** - 動きや音声効果で理解促進
- **録画機能の活用** - 音読劇の振り返りと自己評価
- **オンライン心情マップ** - 登場人物の心情変化を視覚化
- **デジタルポートフォリオ** - 学習の軌跡を蓄積

### 2. 読解力向上の具体的手法
- **思考ツールの活用** - ベン図、マインドマップ等
- **問いの質向上** - 表層的な問いから深い思考を促す問いへ
- **読み方の指導** - 予測読み、確認読み、味わい読み
- **メタ認知の育成** - 自分の読み方を振り返る活動

### 3. 個別最適化の推進
- **学習診断の充実** - 読解力の多面的評価
- **個別課題の設定** - 習熟度に応じた教材の準備
- **協働学習の工夫** - 異なる読みの交流機会
- **家庭学習との連携** - 読書習慣の形成支援

### 4. 評価の充実
- **学習過程の評価** - 結果だけでなくプロセスを重視
- **多様な評価方法** - 話し合い、作品、パフォーマンス等
- **児童の自己評価力育成** - 振り返りシートの活用
- **長期的な成長の追跡** - 学期を越えた変容の記録

### 5. 他教員との連携・共有
- **実践の文書化** - 指導案、教材、評価資料の整理
- **校内研修での共有** - 実践報告と討議
- **学年団での協働** - 系統的な指導計画の策定
- **外部研修への参加** - 最新の指導法の習得

## 継続のためのポイント

1. **小さな改善の積み重ね** - 完璧を目指さず、着実な改善を
2. **児童の声を大切に** - 感想や要望を指導に反映
3. **同僚との協働** - 一人で抱え込まず、チームで取り組む
4. **記録の習慣化** - 日々の気づきを記録する仕組みづくり

継続的な教材研究により、児童の学びがより豊かになることを期待しています！`;

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
            <h3 className="text-lg font-semibold mb-2">研究進捗</h3>
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
              <h3 className="text-lg font-semibold mb-2">研究目標</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.learningGoal}
                </div>
              </div>
            </div>
          )}

          {unit.preLearningState && (
            <div>
              <h3 className="text-lg font-semibold mb-2">研究背景・課題</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.preLearningState}
                </div>
              </div>
            </div>
          )}

          {unit.reflection && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                現在の成果・振り返り
              </h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {unit.reflection}
                </div>
              </div>
            </div>
          )}

          {unit.nextAction && (
            <div>
              <h3 className="text-lg font-semibold mb-2">今後の展開</h3>
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
        <h2 className="text-xl sm:text-2xl font-bold">研究記録</h2>
        <div className="flex gap-2">
          <Button size="sm" disabled variant="outline">
            ➕ 記録を追加
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
            placeholder="研究に関するコメントを入力してください..."
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
            👩‍🏫 教員の教材研究デモページです。
            小学校国語の授業改善プロセスをご確認いただけます。
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
                📚 教材研究を体系的に記録しませんか？
              </h3>
              <p className="text-lg opacity-90 mb-6">
                このデモで体験したような詳細な研究記録で、
                <br />
                授業改善のプロセスを可視化し共有しましょう。
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold">実践記録</div>
                  <div className="opacity-80">授業の工夫と改善の記録</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold">知見共有</div>
                  <div className="opacity-80">他教員との実践交流</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold">継続改善</div>
                  <div className="opacity-80">エビデンスベースの指導</div>
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
                ✅ 無料プランあり　✅ 教材共有　✅ 実践交流サポート
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
              教材研究アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの教材研究記録に基づいて生成されています。
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
