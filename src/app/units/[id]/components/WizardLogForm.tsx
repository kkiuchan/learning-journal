"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { storage } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  EyeOff,
  Lightbulb,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface Resource {
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

interface WizardLogFormProps {
  unitId: string;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (data: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    tags: string[];
    effectScore: number;
    effectType: string;
    resources: Resource[];
  }) => Promise<void>;
}

interface AIAssistResponse {
  suggestions: {
    titles?: string[];
    tags?: string[];
    resources?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    feedback?: string;
  };
}

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

export default function WizardLogForm({
  unitId,
  onCancel,
  onSuccess,
  onSubmit,
}: WizardLogFormProps) {
  const { session: supabaseSession } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isPlanLimitDialogOpen, setIsPlanLimitDialogOpen] = useState(false);

  // フォームデータ
  const [title, setTitle] = useState("");
  const [learningTime, setLearningTime] = useState(30);
  const [note, setNote] = useState("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [effectScore, setEffectScore] = useState(3);
  const [effectType, setEffectType] = useState("understanding");
  const [tags, setTags] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // UI状態
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  // AI提案
  const [aiSuggestions, setAiSuggestions] = useState<
    AIAssistResponse["suggestions"]
  >({});

  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();

  // AI アシスト機能
  const getAIAssistance = useCallback(
    async (step: number) => {
      setAiLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Supabaseセッションのアクセストークンを追加
        if (supabaseSession?.access_token) {
          headers["Authorization"] = `Bearer ${supabaseSession.access_token}`;
        }

        const response = await fetch("/api/ai/log-assist", {
          method: "POST",
          headers,
          body: JSON.stringify({
            step,
            data: { title, note, learningTime, effectScore, effectType, tags },
            unitId,
          }),
        });

        if (response.ok) {
          const data: AIAssistResponse = await response.json();
          setAiSuggestions(data.suggestions);
          toast.success("AI提案を取得しました！");
        } else {
          const errorData = await response.json();

          // プラン制限エラーの場合
          if (errorData.code === "PLAN_LIMIT_EXCEEDED") {
            setIsPlanLimitDialogOpen(true);
            return;
          }

          throw new Error(errorData.error || "AI提案の取得に失敗しました");
        }
      } catch (error) {
        console.error("AI assistance error:", error);
        toast.error(
          error instanceof Error ? error.message : "AI提案の取得に失敗しました"
        );
      } finally {
        setAiLoading(false);
      }
    },
    [
      title,
      note,
      learningTime,
      effectScore,
      effectType,
      tags,
      unitId,
      supabaseSession?.access_token,
    ]
  );

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

  // リソース操作
  const handleAddResource = () => {
    if (newResourceTitle.trim() && newResourceLink.trim()) {
      setResources([
        ...resources,
        {
          resourceType: "link",
          resourceLink: newResourceLink,
          description: newResourceTitle,
        },
      ]);
      setNewResourceTitle("");
      setNewResourceLink("");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    try {
      const filePath = await storage.uploadResource(selectedFile, unitId);
      setResources([
        ...resources,
        {
          resourceType: "file",
          resourceLink: filePath,
          description: selectedFile.name,
          fileName: selectedFile.name,
          filePath,
        },
      ]);
      setSelectedFile(null);
      toast.success("ファイルがアップロードされました");
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("ファイルのアップロードに失敗しました");
    } finally {
      setUploadingFile(false);
    }
  };

  // フォーム送信
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        learningTime,
        note,
        logDate,
        tags,
        effectScore,
        effectType,
        resources,
      });
      onSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("ログの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
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
        return true; // タグとリソースはオプション
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
        PRO
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
                  onCompositionStart={onCompositionStart}
                  onCompositionEnd={onCompositionEnd}
                />
                {aiSuggestions.titles && aiSuggestions.titles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      💡 今回の学習内容提案:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.titles.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setTitle(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
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
                    placeholder="30"
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
                onCompositionStart={onCompositionStart}
                onCompositionEnd={onCompositionEnd}
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
                    <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                      {aiSuggestions.feedback}
                    </p>
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
                      {aiSuggestions.tags.map((tag, index) => {
                        const isAdded = tags.includes(tag);
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (isAdded) {
                                // 追加済みの場合は削除
                                setTags(tags.filter((t) => t !== tag));
                              } else {
                                // 未追加の場合は追加
                                if (!tags.includes(tag)) {
                                  setTags([...tags, tag]);
                                }
                              }
                            }}
                            className={cn(
                              "text-xs transition-all focus:outline-none",
                              isAdded
                                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 focus:bg-green-200 focus:border-green-400 focus:text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-800 dark:focus:bg-green-800 dark:focus:border-green-600 dark:focus:text-green-100"
                                : "border-purple-300 hover:border-purple-400 hover:bg-purple-50 focus:border-purple-500 focus:bg-purple-100 focus:text-purple-900 dark:border-purple-700 dark:hover:border-purple-600 dark:focus:border-purple-500 dark:focus:bg-purple-900 dark:focus:text-purple-100"
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

            {/* タイトル未設定の場合の案内 */}
            {!title.trim() && !aiLoading && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡
                  先にステップ1でタイトルを設定すると、より具体的な学習ガイドを受けられます
                </p>
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
                      if (e.key === "Enter" && !isComposing) {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
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
                      {aiSuggestions.tags.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTag(suggestion)}
                          className="text-xs"
                        >
                          + {suggestion}
                        </Button>
                      ))}
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

              {/* リソースセクション */}
              <div>
                <Label className="text-base">参考資料</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  学習に使用した資料やファイルを追加してください
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        placeholder="資料のタイトル"
                        className="flex-1"
                      />
                      <Input
                        value={newResourceLink}
                        onChange={(e) => setNewResourceLink(e.target.value)}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddResource}
                        disabled={
                          !newResourceTitle.trim() || !newResourceLink.trim()
                        }
                      >
                        追加
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className="flex-1"
                        disabled={uploadingFile}
                      />
                      <Button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploadingFile}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingFile ? "アップロード中..." : "アップロード"}
                      </Button>
                    </div>
                  </div>

                  {resources.length > 0 && (
                    <div className="space-y-2">
                      {resources.map((resource, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border rounded"
                        >
                          <span className="flex-1 text-sm">
                            {resource.description}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setResources(
                                resources.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <p>{title}</p>
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
                    {note}
                  </ReactMarkdown>
                </div>
              </div>

              {resources.length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    参考資料:
                  </span>
                  <div className="space-y-2 mt-1">
                    {resources.map((resource, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-muted/50 rounded"
                      >
                        {resource.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学習ログを作成</CardTitle>
            <Button variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
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
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center text-center flex-1",
                  step.id === currentStep
                    ? "text-primary"
                    : "text-muted-foreground",
                  step.id < currentStep ? "text-green-600" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-muted"
                  )}
                >
                  {step.id}
                </div>
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="min-h-[400px]">{renderStepContent()}</div>

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
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed(currentStep)}
                className="flex items-center gap-2"
              >
                {isSubmitting ? "作成中..." : "ログを作成"}
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

      {/* プラン制限ダイアログ */}
      <Dialog
        open={isPlanLimitDialogOpen}
        onOpenChange={setIsPlanLimitDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="mr-2 h-5 w-5 text-yellow-500" />
              プロプラン限定機能
            </DialogTitle>
            <DialogDescription>
              AI学習サジェスト機能はプロプランの限定機能です。
              プロプランにアップグレードして、パーソナライズされた学習支援をご利用ください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              AI学習サジェスト機能の特典
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 個別化された学習内容の提案</li>
              <li>• 過去の学習履歴に基づくアドバイス</li>
              <li>• 適切なタグの自動推奨</li>
              <li>• 学習リソースの提案</li>
              <li>• ステップバイステップの学習ガイド</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPlanLimitDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700"
            >
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4" />
                プロプランを見る
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
