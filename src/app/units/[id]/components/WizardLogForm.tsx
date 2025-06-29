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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { storage } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { logRequestSchema } from "@/types/log";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
  Save,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  formData?: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    effectScore: number;
    effectType: string;
    tags: string[];
    resources: Resource[];
    currentStep: number;
  };
  onFormDataChange?: (data: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    effectScore: number;
    effectType: string;
    tags: string[];
    resources: Resource[];
    currentStep: number;
  }) => void;
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

// Zodスキーマに基づく型定義
type LogFormValues = z.infer<typeof logRequestSchema>;

export default function WizardLogForm({
  unitId,
  onCancel,
  onSuccess,
  onSubmit,
  formData,
  onFormDataChange,
}: WizardLogFormProps) {
  const { session: supabaseSession } = useAuthStore();
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isPlanLimitDialogOpen, setIsPlanLimitDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    AIAssistResponse["suggestions"]
  >({});

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logRequestSchema),
    defaultValues: {
      title: formData?.title ?? "",
      learningTime: formData?.learningTime ?? 30,
      note: formData?.note ?? "",
      logDate: formData?.logDate ?? format(new Date(), "yyyy-MM-dd"),
      effectScore: formData?.effectScore ?? 3,
      effectType:
        (formData?.effectType as
          | "understanding"
          | "practical"
          | "application"
          | "none") ?? "understanding",
      tags: formData?.tags ?? [],
      resources: formData?.resources ?? [],
    },
  });

  // フォームの値を監視してformDataを更新
  const watchedValues = form.watch();

  const updateFormData = (updates: Partial<LogFormValues>) => {
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof LogFormValues, value);
    });

    if (onFormDataChange) {
      const currentValues = form.getValues();
      onFormDataChange({
        title: currentValues.title,
        learningTime: currentValues.learningTime,
        note: currentValues.note,
        logDate: currentValues.logDate,
        effectScore: currentValues.effectScore ?? 3,
        effectType: (currentValues.effectType ?? "understanding") as string,
        tags: currentValues.tags ?? [],
        resources: currentValues.resources ?? [],
        currentStep,
      });
    }
  };

  // AI支援機能
  const getAIAssistance = useCallback(
    async (step: number) => {
      if (!supabaseSession?.access_token) {
        setIsPlanLimitDialogOpen(true);
        return;
      }

      setAiLoading(true);
      try {
        const currentValues = form.getValues();
        const response = await fetch("/api/ai/log-assist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseSession.access_token}`,
          },
          body: JSON.stringify({
            step,
            data: currentValues,
            unitId,
          }),
        });

        if (response.ok) {
          const data: AIAssistResponse = await response.json();
          setAiSuggestions(data.suggestions);
          toast.success("AI提案を取得しました！");
        } else {
          throw new Error("AI支援の取得に失敗しました");
        }
      } catch (error) {
        console.error("AI assistance error:", error);
        toast.error("AI支援の取得に失敗しました");
      } finally {
        setAiLoading(false);
      }
    },
    [form, unitId, supabaseSession?.access_token]
  );

  // フォーム送信
  const handleSubmit = async (values: LogFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        learningTime: values.learningTime,
        note: values.note,
        logDate: values.logDate,
        effectScore: values.effectScore ?? 3,
        effectType: (values.effectType ?? "understanding") as string,
        tags: values.tags ?? [],
        resources: values.resources ?? [],
      });
      // 成功時にフォームデータをリセット
      form.reset({
        title: "",
        learningTime: 30,
        note: "",
        logDate: format(new Date(), "yyyy-MM-dd"),
        effectScore: 3,
        effectType: "understanding",
        tags: [],
        resources: [],
      });
      if (onFormDataChange) {
        onFormDataChange({
          title: "",
          learningTime: 30,
          note: "",
          logDate: format(new Date(), "yyyy-MM-dd"),
          effectScore: 3,
          effectType: "understanding",
          tags: [],
          resources: [],
          currentStep: 1,
        });
      }
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
    const values = form.getValues();
    switch (step) {
      case 1:
        return values.title.trim().length > 0 && values.learningTime > 0;
      case 2:
        return values.note.trim().length > 0;
      case 3:
        return (values.effectScore ?? 0) >= 1 && (values.effectScore ?? 0) <= 5;
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
    <div className="relative mt-2 mr-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => getAIAssistance(step)}
        disabled={aiLoading || disabled}
        className="flex items-center gap-2"
      >
        <Lightbulb className="h-4 w-4" />
        {aiLoading ? "提案中..." : label}
      </Button>
      <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
        PRO
      </span>
    </div>
  );

  // AI提案を表示するコンポーネント
  const renderAISuggestions = (step: number) => {
    if (!aiSuggestions) return null;

    switch (step) {
      case 1:
        // タイトル提案
        if (aiSuggestions.titles && aiSuggestions.titles.length > 0) {
          return (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI提案タイトル
              </h4>
              <div className="space-y-2">
                {aiSuggestions.titles.map((title, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 text-left text-wrap hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={() => {
                      form.setValue("title", title);
                      updateFormData({ title });
                      toast.success("タイトルを適用しました");
                    }}
                  >
                    📝 {title}
                  </Button>
                ))}
              </div>
              {aiSuggestions.feedback && (
                <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-sm text-amber-800 dark:text-amber-200">
                  <strong>💡 AIアドバイス:</strong> {aiSuggestions.feedback}
                </div>
              )}
            </div>
          );
        }
        break;

      case 2:
        // タグ提案とフィードバック
        if (aiSuggestions.tags || aiSuggestions.feedback) {
          return (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI学習ガイド
              </h4>

              {aiSuggestions.tags && aiSuggestions.tags.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    推奨タグ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.tags.map((tag, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        onClick={() => {
                          const currentTags = form.getValues("tags") || [];
                          if (!currentTags.includes(tag)) {
                            const newTags = [...currentTags, tag];
                            form.setValue("tags", newTags);
                            updateFormData({ tags: newTags });
                            toast.success(`タグ「${tag}」を追加しました`);
                          }
                        }}
                      >
                        🏷️ {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {aiSuggestions.feedback && (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 AIアドバイス:</strong> {aiSuggestions.feedback}
                </div>
              )}
            </div>
          );
        }
        break;

      case 4:
        // タグとリソース提案
        if (
          aiSuggestions.tags ||
          aiSuggestions.resources ||
          aiSuggestions.feedback
        ) {
          return (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI提案
              </h4>

              {aiSuggestions.tags && aiSuggestions.tags.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                    最終推奨タグ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.tags.map((tag, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        onClick={() => {
                          const currentTags = form.getValues("tags") || [];
                          if (!currentTags.includes(tag)) {
                            const newTags = [...currentTags, tag];
                            form.setValue("tags", newTags);
                            updateFormData({ tags: newTags });
                            toast.success(`タグ「${tag}」を追加しました`);
                          }
                        }}
                      >
                        🏷️ {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {aiSuggestions.resources &&
                aiSuggestions.resources.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                      推奨リソース:
                    </p>
                    <div className="space-y-2">
                      {aiSuggestions.resources.map((resource, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto p-2 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          onClick={() => {
                            const currentResources =
                              form.getValues("resources") || [];
                            const newResource = {
                              resourceType: "link",
                              resourceLink: resource.url,
                              description: resource.title,
                            };
                            const newResources = [
                              ...currentResources,
                              newResource,
                            ];
                            form.setValue("resources", newResources);
                            updateFormData({ resources: newResources });
                            toast.success(
                              `リソース「${resource.title}」を追加しました`
                            );
                          }}
                        >
                          📚 {resource.title}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {resource.description}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

              {aiSuggestions.feedback && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>💡 AIアドバイス:</strong> {aiSuggestions.feedback}
                </div>
              )}
            </div>
          );
        }
        break;
    }
    return null;
  };

  // ステップコンテンツ
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-lg font-semibold">
                基本情報を入力してください
              </h3>
              <div className="flex items-center overflow-visible">
                {renderAIAssistButton(1, "学習提案")}
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4" />
                      タイトル *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="今日学習した内容のタイトル"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          updateFormData({ title: e.target.value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日付</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            updateFormData({ logDate: e.target.value });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learningTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        学習時間（分）*
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            field.onChange(value);
                            updateFormData({ learningTime: value });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* AI提案表示 */}
            {renderAISuggestions(1)}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-lg font-semibold">
                学習内容を記述してください
              </h3>
              <div className="flex gap-2 items-center overflow-visible">
                {renderAIAssistButton(
                  2,
                  "学習ガイド",
                  !form.getValues("title").trim()
                )}
                <Button
                  type="button"
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

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>学習内容 *</FormLabel>
                  <FormControl>
                    {showPreview ? (
                      <div className="min-h-[300px] max-h-[400px] p-4 border rounded-md bg-background overflow-y-auto">
                        <MarkdownPreview>
                          {field.value || "プレビューする内容がありません"}
                        </MarkdownPreview>
                      </div>
                    ) : (
                      <Textarea
                        placeholder="学習内容の詳細を記述してください（Markdown形式）&#10;&#10;例：&#10;# 今日学習したこと&#10;- ポイント1&#10;- ポイント2&#10;&#10;## つまづいた点&#10;- 課題1&#10;- 解決方法"
                        rows={12}
                        className="font-mono resize-none"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          updateFormData({ note: e.target.value });
                        }}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI提案表示 */}
            {renderAISuggestions(2)}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">効果を測定してください</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="effectScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Star className="w-4 w-4" />
                      効果実感スコア
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => {
                              field.onChange(score);
                              updateFormData({ effectScore: score });
                            }}
                            className="transition-all hover:scale-110 focus:outline-none"
                          >
                            <Star
                              className={cn(
                                "h-6 w-6 transition-all cursor-pointer",
                                score <= (field.value ?? 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-transparent text-gray-300 hover:text-yellow-300"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-muted-foreground">
                          {field.value ?? 0}/5
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>効果のタイプ</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {effectTypes.map((type) => (
                          <label
                            key={type.value}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="effectType"
                              value={type.value}
                              checked={field.value === type.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                updateFormData({
                                  effectType: e.target.value as any,
                                });
                              }}
                              className="form-radio"
                            />
                            <span className="text-lg">{type.icon}</span>
                            {type.label}
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-lg font-semibold">タグと参考資料を追加</h3>
              <div className="flex items-center overflow-visible">
                {renderAIAssistButton(4, "タグ提案")}
              </div>
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
                        updateFormData({
                          tags: [
                            ...(form.getValues("tags") || []),
                            newTag.trim(),
                          ],
                        });
                        setNewTag("");
                      }
                    }}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      updateFormData({
                        tags: [
                          ...(form.getValues("tags") || []),
                          newTag.trim(),
                        ],
                      })
                    }
                    disabled={!newTag.trim()}
                  >
                    追加
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.getValues("tags") || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateFormData({
                            tags: (form.getValues("tags") || []).filter(
                              (t) => t !== tag
                            ),
                          })
                        }
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
                        onClick={() =>
                          updateFormData({
                            resources: [
                              ...(form.getValues("resources") || []),
                              {
                                resourceType: "link",
                                resourceLink: newResourceLink,
                                description: newResourceTitle,
                              },
                            ],
                          })
                        }
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const filePath = await storage.uploadResource(
                              file,
                              unitId
                            );
                            updateFormData({
                              resources: [
                                ...(form.getValues("resources") || []),
                                {
                                  resourceType: "file",
                                  resourceLink: filePath,
                                  description: file.name,
                                  fileName: file.name,
                                  filePath,
                                },
                              ],
                            });
                          }
                        }}
                        className="flex-1"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const file = document.createElement("input");
                          file.type = "file";
                          file.accept = "image/*";
                          file.onchange = async (e) => {
                            const target = e.target as HTMLInputElement;
                            const imageFile = target.files?.[0];
                            if (imageFile) {
                              const filePath = await storage.uploadResource(
                                imageFile,
                                unitId
                              );
                              updateFormData({
                                resources: [
                                  ...(form.getValues("resources") || []),
                                  {
                                    resourceType: "image",
                                    resourceLink: filePath,
                                    description: imageFile.name,
                                    fileName: imageFile.name,
                                    filePath,
                                  },
                                ],
                              });
                            }
                          };
                          file.click();
                        }}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isSubmitting
                          ? "アップロード中..."
                          : "画像アップロード"}
                      </Button>
                    </div>
                  </div>

                  {(form.getValues("resources") || []).length > 0 && (
                    <div className="space-y-2">
                      {(form.getValues("resources") || []).map(
                        (resource, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <span className="flex-1 text-sm">
                              {resource.description}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateFormData({
                                  resources: (
                                    form.getValues("resources") || []
                                  ).filter((_, i) => i !== index),
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI提案表示 */}
            {renderAISuggestions(4)}
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
                  <p>{form.getValues("title")}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    日付:
                  </span>
                  <p>{form.getValues("logDate")}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    学習時間:
                  </span>
                  <p>{form.getValues("learningTime")}分</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    効果スコア:
                  </span>
                  <div className="flex items-center gap-1">
                    {Array(form.getValues("effectScore") || 0)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    <span className="ml-1">
                      ({form.getValues("effectScore") || 0}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-medium text-muted-foreground">
                  効果タイプ:
                </span>
                <p>
                  {
                    effectTypes.find(
                      (t) => t.value === form.getValues("effectType")
                    )?.label
                  }
                </p>
              </div>

              {(form.getValues("tags") || []).length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    タグ:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(form.getValues("tags") || []).map((tag) => (
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
                <div className="mt-2 p-4 border rounded-md bg-muted/50 max-h-[300px] overflow-y-auto">
                  <MarkdownPreview>{form.getValues("note")}</MarkdownPreview>
                </div>
              </div>

              {(form.getValues("resources") || []).length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    参考資料:
                  </span>
                  <div className="space-y-2 mt-1">
                    {(form.getValues("resources") || []).map(
                      (resource, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-muted/50 rounded"
                        >
                          {resource.description}
                        </div>
                      )
                    )}
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
      <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>学習ログを作成</CardTitle>

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

        <CardContent className="flex flex-col flex-1 min-h-0 p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              onKeyDown={(e) => {
                // Enterキーでのフォーム送信を最後のステップ以外では防ぐ
                if (e.key === "Enter" && currentStep !== steps.length) {
                  e.preventDefault();
                  console.log(
                    "Enter key prevented. Current step:",
                    currentStep
                  );
                }
              }}
              className="flex flex-col h-full"
            >
              {/* スクロール可能なコンテンツエリア */}
              <div className="flex-1 overflow-y-auto overflow-x-visible pr-2 space-y-6 min-h-0">
                {renderStepContent()}
              </div>

              {/* 固定ナビゲーションボタン */}
              <div className="flex justify-between pt-6 mt-6 border-t border-border flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 1) {
                      onCancel();
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? "キャンセル" : "戻る"}
                </Button>

                {/* ステップ5（最後のステップ）でのみ送信ボタンを表示 */}
                {currentStep === steps.length ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canProceed(currentStep)}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Save className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        作成
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log(
                        "Next button clicked. Current step:",
                        currentStep,
                        "Steps length:",
                        steps.length
                      );
                      setCurrentStep(currentStep + 1);
                    }}
                    disabled={!canProceed(currentStep) || isSubmitting}
                  >
                    次へ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
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
