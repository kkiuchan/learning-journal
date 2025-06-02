"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const steps = [
  { id: 1, title: "基本情報", description: "タイトル・日付・学習時間" },
  { id: 2, title: "内容記述", description: "学習内容の詳細" },
  { id: 3, title: "効果測定", description: "スコア・タイプ" },
  { id: 4, title: "タグ・リソース", description: "分類・参考資料" },
  { id: 5, title: "確認", description: "プレビュー・送信" },
];

const effectTypes = [
  { value: "understanding", label: "理解が深まった", icon: "🧠" },
  { value: "practical", label: "実際に使えるようになった", icon: "⚡" },
  { value: "application", label: "応用のアイデアが生まれた", icon: "💡" },
  { value: "none", label: "特になかった", icon: "📝" },
];

// デモ用のAI提案データ
const aiSuggestionsByStep: Record<number, any> = {
  1: {
    titles: [
      "React Hooksの基本概念と使い方",
      "useStateとuseEffectの実践的活用",
      "カスタムフックの設計パターン",
    ],
    feedback:
      "今回の学習内容に基づいて、実践的なタイトルを提案します。Reactの状態管理やライフサイクル管理に焦点を当てた内容が効果的です。",
  },
  2: {
    feedback:
      "React Hooksの学習を効果的に進めるには、以下の構造で記録することをお勧めします：\n\n1. **学習の目的・背景**\n2. **実際に試したコードと結果**\n3. **つまづいた点と解決方法**\n4. **新しく理解できたポイント**\n5. **次に活かせる場面**\n\nMarkdown記法を使って見やすく整理し、コードブロックで実際のコードも記録しましょう。",
    tags: ["React", "Hooks", "JavaScript", "フロントエンド", "状態管理"],
  },
  4: {
    tags: ["React", "Hooks", "useState", "useEffect", "コンポーネント設計"],
  },
};

export default function DemoAIAssistPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  // フォームデータ
  const [title, setTitle] = useState("");
  const [learningTime, setLearningTime] = useState(60);
  const [note, setNote] = useState("");
  const [logDate, setLogDate] = useState("2024-03-21");
  const [effectScore, setEffectScore] = useState(4);
  const [effectType, setEffectType] = useState("understanding");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // AI提案状態
  const [aiSuggestions, setAiSuggestions] = useState<any>({});

  // AI提案のシミュレーション
  const getAIAssistance = async (step: number) => {
    setAiLoading(true);
    // シミュレーション: 2秒後にデモデータを表示
    setTimeout(() => {
      setAiSuggestions(aiSuggestionsByStep[step] || {});
      setAiLoading(false);
    }, 2000);
  };

  // ステップ進行
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // タグ操作
  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // バリデーション
  const canProceed = (step: number) => {
    switch (step) {
      case 1:
        return title.trim().length > 0 && learningTime > 0;
      case 2:
        return note.trim().length > 0;
      case 3:
        return effectScore >= 1 && effectScore <= 5;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderAIAssistButton = (
    step: number,
    label: string,
    disabled?: boolean
  ) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => getAIAssistance(step)}
      disabled={aiLoading || disabled}
      className="flex items-center gap-2 relative"
    >
      <Lightbulb className="h-4 w-4" />
      {aiLoading ? "提案中..." : label}
      <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-bold px-1 py-0.5 rounded-full">
        AI
      </span>
    </Button>
  );

  // ステップコンテンツ
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                基本情報を入力してください
              </h3>
              {renderAIAssistButton(1, "学習内容提案")}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="今日学習した内容のタイトル"
                />
                {aiSuggestions.titles && aiSuggestions.titles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      💡 今回の学習内容提案:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.titles.map(
                        (suggestion: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setTitle(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logDate">日付</Label>
                  <Input
                    id="logDate"
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="learningTime">学習時間（分）*</Label>
                  <Input
                    id="learningTime"
                    type="number"
                    value={learningTime}
                    onChange={(e) => setLearningTime(Number(e.target.value))}
                    min="1"
                    placeholder="60"
                  />
                </div>
              </div>
            </div>

            {/* AI フィードバック */}
            {aiSuggestions.feedback && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      AIアドバイス
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {aiSuggestions.feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                学習内容を記述してください
              </h3>
              <div className="flex gap-2">
                {renderAIAssistButton(2, "学習ガイド", !title.trim())}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showPreview ? "編集" : "プレビュー"}
                </Button>
              </div>
            </div>

            {showPreview ? (
              <div className="min-h-[300px] p-4 border rounded-md bg-background prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note || "プレビューする内容がありません"}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="学習内容の詳細を記述してください（Markdown形式）&#10;&#10;例：&#10;# 今日学習したこと&#10;- ポイント1&#10;- ポイント2&#10;&#10;## つまづいた点&#10;- 課題1&#10;- 解決方法"
                rows={12}
                className="font-mono resize-none"
              />
            )}
            <p className="text-xs text-muted-foreground">
              💡
              Markdown記法が使用できます（見出し、リスト、コードブロックなど）
            </p>

            {/* AI学習ガイド */}
            {aiSuggestions.feedback && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      「{title}」の学習ガイド
                    </h4>
                    <div className="text-sm text-green-800 dark:text-green-200 leading-relaxed whitespace-pre-wrap">
                      {aiSuggestions.feedback}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI推奨タグ */}
            {aiSuggestions.tags && aiSuggestions.tags.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Tags
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      この学習内容の推奨タグ
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.tags.map((tag: string, index: number) => {
                        const isAdded = tags.includes(tag);
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (isAdded) {
                                setTags(tags.filter((t) => t !== tag));
                              } else {
                                if (!tags.includes(tag)) {
                                  setTags([...tags, tag]);
                                }
                              }
                            }}
                            className={cn(
                              "text-xs transition-all focus:outline-none",
                              isAdded
                                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                : "border-purple-300 hover:border-purple-400 hover:bg-purple-50"
                            )}
                          >
                            {isAdded ? "✓" : "+"} {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                      💡 クリックでタグを追加・削除できます
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                学習効果を評価してください
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base">効果実感スコア</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  今日の学習がどの程度効果的だったか評価してください
                </p>
                <div
                  className="flex items-center justify-center gap-2"
                  onMouseLeave={() => setHoveredScore(null)}
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setEffectScore(score)}
                      onMouseEnter={() => setHoveredScore(score)}
                      className="transition-all hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-all cursor-pointer",
                          score <= (hoveredScore || effectScore)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-gray-300 hover:text-yellow-300"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-medium text-muted-foreground">
                    {effectScore}/5
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-base">効果のタイプ</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  どのような効果を感じましたか？
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {effectTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setEffectType(type.value)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                        effectType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">タグと参考資料を追加</h3>
              {renderAIAssistButton(4, "タグ提案")}
            </div>

            <div className="space-y-6">
              {/* タグセクション */}
              <div>
                <Label className="text-base">タグ</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  学習内容を分類するためのタグを追加してください
                </p>

                <div className="flex gap-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="タグを入力"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag()}
                    disabled={!newTag.trim()}
                  >
                    追加
                  </Button>
                </div>

                {aiSuggestions.tags && aiSuggestions.tags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      💡 AI提案タグ:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.tags.map(
                        (suggestion: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTag(suggestion)}
                            className="text-xs"
                          >
                            + {suggestion}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* リソースセクション（デモ用簡略版） */}
              <div>
                <Label className="text-base">参考資料</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  学習に使用した資料やファイルを追加してください
                </p>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="資料のタイトル" disabled />
                    <Input placeholder="URL" disabled />
                    <Button disabled>追加</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="file" disabled />
                    <Button disabled className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      アップロード
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📝
                    デモページでは実際のファイルアップロードは無効化されています
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              内容を確認して送信してください
            </h3>

            <div className="space-y-4 border rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    タイトル:
                  </span>
                  <p>{title || "（未入力）"}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    日付:
                  </span>
                  <p>{logDate}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    学習時間:
                  </span>
                  <p>{learningTime}分</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    効果スコア:
                  </span>
                  <div className="flex items-center gap-1">
                    {Array(effectScore)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    <span className="ml-1">({effectScore}/5)</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-medium text-muted-foreground">
                  効果タイプ:
                </span>
                <p>{effectTypes.find((t) => t.value === effectType)?.label}</p>
              </div>

              {tags.length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    タグ:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-medium text-muted-foreground">
                  学習内容:
                </span>
                <div className="mt-2 p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note || "学習内容が入力されていません"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                📝 これはデモページです。実際の学習ログは作成されません。
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* デモ告知バナー */}
      <div className="bg-gradient-to-r from-purple-500 via-blue-600 to-indigo-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            🤖 AI支援機能のデモページです。
            学習ログ作成をサポートするAI機能を体験いただけます。
            <Link
              href="/auth/register"
              className="underline ml-2 hover:text-purple-200"
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
            AI支援ウィザードフォーム
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AIがあなたの学習記録作成をサポートします。
            各ステップで適切な提案やガイドを受けながら、効果的な学習ログを作成できます。
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>学習ログを作成（AIサポート付き）</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    デモモード
                  </span>
                  <Button variant="ghost" size="sm" disabled>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    ステップ {currentStep} / {steps.length}
                  </span>
                  <span>{Math.round((currentStep / steps.length) * 100)}%</span>
                </div>
                <Progress value={(currentStep / steps.length) * 100} />
              </div>

              {/* ステップ表示 */}
              <div className="flex justify-between items-center overflow-x-auto pb-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center min-w-0 flex-1",
                      index < steps.length - 1 && "relative"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                        currentStep === step.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : currentStep > step.id
                            ? "bg-primary/20 text-primary border-primary"
                            : "bg-muted text-muted-foreground border-muted-foreground/20"
                      )}
                    >
                      {step.id}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          currentStep >= step.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute top-4 left-[calc(50%+1rem)] w-[calc(100%-2rem)] h-0.5 transition-all",
                          currentStep > step.id
                            ? "bg-primary"
                            : "bg-muted-foreground/20"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="min-h-[400px]">
                {aiLoading && (
                  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-lg flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>AIが提案を生成中...</span>
                    </div>
                  </div>
                )}
                {renderStepContent()}
              </div>

              {/* ナビゲーションボタン */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  前へ
                </Button>

                {currentStep === steps.length ? (
                  <Button disabled className="flex items-center gap-2">
                    ログを作成（デモ）
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed(currentStep)}
                    className="flex items-center gap-2"
                  >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI機能の説明 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI支援機能の特徴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">学習内容の提案</p>
                      <p className="text-muted-foreground">
                        過去の学習履歴から適切なタイトルを提案
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">構造化された記録ガイド</p>
                      <p className="text-muted-foreground">
                        効果的な学習記録の書き方をステップごとに案内
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium">適切なタグの推奨</p>
                      <p className="text-muted-foreground">
                        学習内容に基づいて関連性の高いタグを自動提案
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">使い方のコツ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">具体的なタイトルを設定</p>
                      <p className="text-muted-foreground">
                        より精度の高いAI提案を受けられます
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">AI提案を参考にして編集</p>
                      <p className="text-muted-foreground">
                        提案をそのまま使わず、自分なりにカスタマイズ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">継続的な利用で精度向上</p>
                      <p className="text-muted-foreground">
                        使うほどにあなたの学習パターンを学習
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 登録促進CTA */}
          <div className="mt-12 mb-8">
            <div className="bg-gradient-to-r from-purple-500 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center shadow-2xl">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">
                  AI支援で学習記録をもっと効果的に
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  AIがあなたの学習をサポートし、より良い記録作成を支援します。
                  継続的な学習習慣を身につけて、目標達成を加速させましょう。
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
    </div>
  );
}
